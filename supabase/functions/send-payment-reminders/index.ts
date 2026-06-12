import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';
import { internalError, jsonResponse, methodNotAllowed, successEnvelope } from '../_core/http/response.ts';
import { FirebasePushGateway } from '../_core/push/infrastructure/firebase-push-gateway.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});
const IN_QUERY_BATCH_SIZE = 50;

const addDays = (date: Date, days: number) => {
  const clone = new Date(date);
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
};

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const buildBatches = <T>(values: T[], batchSize = IN_QUERY_BATCH_SIZE) => {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += batchSize) {
    batches.push(values.slice(index, index + batchSize));
  }
  return batches;
};

const updateAttemptStatus = async (
  targetIds: number[],
  payload: Record<string, unknown>,
) => {
  if (!targetIds.length) return;

  const { error } = await adminClient
    .from('mobile_device_registrations')
    .update(payload)
    .in('id', targetIds);

  if (error) {
    console.warn('No se pudo actualizar trazabilidad de recordatorios de pago.', JSON.stringify(error));
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed();
  }

  try {
    const schedulerSecret = Deno.env.get('REPORTS_SCHEDULER_SECRET') || '';
    if (schedulerSecret) {
      const providedSecret = req.headers.get('x-scheduler-secret') || '';
      if (providedSecret !== schedulerSecret) {
        return jsonResponse({
          success: false,
          code: 'FORBIDDEN',
          message: 'Secret de scheduler inválido.',
          details: null,
          data: null,
        }, 403);
      }
    }

    const today = new Date();
    const upcomingLimit = toDateOnly(addDays(today, 5));
    const todayOnly = toDateOnly(today);

    const { data: duePayments, error: paymentsError } = await adminClient
      .from('payments')
      .select(`
        id,
        student_id,
        monto,
        fecha_fin,
        students!inner(
          id,
          users!inner(id, nombre, apellido)
        )
      `)
      .is('deleted_at', null)
      .lte('fecha_fin', upcomingLimit);

    if (paymentsError) {
      throw paymentsError;
    }

    const eligiblePayments = duePayments || [];
    const userIds = [...new Set(eligiblePayments.map((payment) => String(payment.students?.users?.id || '')))].filter(Boolean);

    if (!userIds.length) {
      return jsonResponse(successEnvelope({
        code: 'PAYMENT_REMINDERS_SKIPPED',
        message: 'No hay pagos elegibles para notificar.',
        data: {
          payments_considered: eligiblePayments.length,
          resolved_user_ids: [],
          resolved_user_count: 0,
          targeted_devices: 0,
          sent: 0,
          failed: 0,
          invalid_tokens: 0,
        },
      }));
    }

    const preferenceBatches = await Promise.all(buildBatches(userIds).map(async (userIdBatch) => {
      const { data: preferencesRows, error: preferencesError } = await adminClient
        .from('user_notification_preferences')
        .select('user_id, payment_reminders_enabled, payment_overdue_enabled')
        .in('user_id', userIdBatch);

      if (preferencesError) {
        console.warn('No se pudieron cargar preferencias de notificacion de pagos, se aplicaran valores por defecto.', JSON.stringify(preferencesError));
        return [];
      }

      return preferencesRows || [];
    }));

    const preferencesRows = preferenceBatches.flat();

    const preferenceByUserId = new Map(
      (preferencesRows || []).map((preference) => [String(preference.user_id), preference]),
    );

    const deviceTargetBatches = await Promise.all(buildBatches(userIds).map(async (userIdBatch) => {
      const { data: deviceTargets, error: deviceError } = await adminClient
        .from('mobile_device_registrations')
        .select('id, user_id, device_token')
        .eq('notifications_enabled', true)
        .in('user_id', userIdBatch);

      if (deviceError) {
        throw deviceError;
      }

      return deviceTargets || [];
    }));

    const deviceTargets = deviceTargetBatches.flat();

    const tokensByUser = new Map<string, Array<{ id: number; user_id: string; device_token: string }>>();
    for (const target of deviceTargets || []) {
      const key = String(target.user_id);
      const existing = tokensByUser.get(key) || [];
      existing.push(target);
      tokensByUser.set(key, existing);
    }

    const gateway = new FirebasePushGateway();
    let sent = 0;
    let failed = 0;
    const invalidTokenIds: number[] = [];
    const failureRows: Array<{ targetId: number; status: number; response: string }> = [];
    const targetedUserIds = new Set<string>();
    const attemptedAt = new Date().toISOString();

    for (const payment of eligiblePayments) {
      const userId = String(payment.students?.users?.id || '');
      const userTargets = tokensByUser.get(userId) || [];
      if (!userTargets.length) continue;

      const athleteName = `${payment.students?.users?.nombre || ''} ${payment.students?.users?.apellido || ''}`.trim();
      const daysRemaining = Math.ceil(
        (new Date(`${payment.fecha_fin}T00:00:00Z`).getTime() - new Date(`${todayOnly}T00:00:00Z`).getTime()) / 86400000,
      );
      const preference = preferenceByUserId.get(userId);
      const notificationType = daysRemaining < 0 ? 'payment_overdue' : 'payment_due_soon';
      const isEnabled = daysRemaining < 0
        ? preference?.payment_overdue_enabled !== false
        : preference?.payment_reminders_enabled !== false;

      if (!isEnabled) continue;
      targetedUserIds.add(userId);

      const result = await gateway.sendToDevices(userTargets, {
        type: notificationType,
        title: daysRemaining < 0 ? 'Mensualidad vencida' : 'Mensualidad por vencer',
        body: daysRemaining < 0
          ? `${athleteName}, tu mensualidad venció el ${payment.fecha_fin}.`
          : `${athleteName}, tu mensualidad vence el ${payment.fecha_fin}.`,
        route: '/estudiante?section=mensualidad',
        channelId: 'payments',
        priority: 'high',
        data: {
          payment_id: payment.id,
          fecha_fin: payment.fecha_fin,
          monto: payment.monto,
          user_role: 'estudiante',
        },
      });

      sent += result.sent;
      failed += result.failed;
      invalidTokenIds.push(...result.invalidTokenIds);
      failureRows.push(...(result.failures || []));

      const failedIds = new Set((result.failures || []).map((failure) => failure.targetId));
      const sentIds = userTargets
        .map((target) => Number(target.id))
        .filter((targetId) => !failedIds.has(targetId));

      await updateAttemptStatus(sentIds, {
        last_delivery_status: 'sent',
        last_delivery_error: null,
        last_delivery_attempt_at: attemptedAt,
        last_delivery_success_at: attemptedAt,
      });
    }

    if (failureRows.length > 0) {
      await Promise.all(failureRows.map((failure) => updateAttemptStatus([failure.targetId], {
        last_delivery_status: 'failed',
        last_delivery_error: failure.response,
        last_delivery_attempt_at: attemptedAt,
      })));
      console.error('Payment reminder delivery failures', JSON.stringify(failureRows));
    }

    if (invalidTokenIds.length > 0) {
      await adminClient
        .from('mobile_device_registrations')
        .update({
          notifications_enabled: false,
          invalidated_at: attemptedAt,
        })
        .in('id', invalidTokenIds);
    }

    return jsonResponse(successEnvelope({
      code: 'PAYMENT_REMINDERS_SENT',
      message: 'Recordatorios de pago procesados correctamente.',
      data: {
        payments_considered: eligiblePayments.length,
        resolved_user_ids: Array.from(targetedUserIds),
        resolved_user_count: targetedUserIds.size,
        targeted_devices: deviceTargets?.length || 0,
        sent,
        failed,
        invalid_tokens: invalidTokenIds.length,
      },
    }));
  } catch (error) {
    return internalError(error);
  }
});
