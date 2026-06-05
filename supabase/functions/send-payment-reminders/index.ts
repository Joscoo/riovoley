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

const addDays = (date: Date, days: number) => {
  const clone = new Date(date);
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
};

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

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

    const { data: deviceTargets, error: deviceError } = await adminClient
      .from('mobile_device_registrations')
      .select('id, user_id, device_token')
      .eq('notifications_enabled', true)
      .in('user_id', userIds);

    if (deviceError) {
      throw deviceError;
    }

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

    for (const payment of eligiblePayments) {
      const userId = String(payment.students?.users?.id || '');
      const userTargets = tokensByUser.get(userId) || [];
      if (!userTargets.length) continue;

      const athleteName = `${payment.students?.users?.nombre || ''} ${payment.students?.users?.apellido || ''}`.trim();
      const daysRemaining = Math.ceil(
        (new Date(`${payment.fecha_fin}T00:00:00Z`).getTime() - new Date(`${todayOnly}T00:00:00Z`).getTime()) / 86400000,
      );

      const result = await gateway.sendToDevices(userTargets, {
        type: 'payment_reminder',
        title: daysRemaining < 0 ? 'Pago vencido' : 'Recordatorio de pago',
        body: daysRemaining < 0
          ? `${athleteName}, tu mensualidad venció el ${payment.fecha_fin}.`
          : `${athleteName}, tu mensualidad vence el ${payment.fecha_fin}.`,
        route: '/estudiante?section=mensualidad',
        data: {
          payment_id: payment.id,
          fecha_fin: payment.fecha_fin,
          monto: payment.monto,
        },
      });

      sent += result.sent;
      failed += result.failed;
      invalidTokenIds.push(...result.invalidTokenIds);
    }

    if (invalidTokenIds.length > 0) {
      await adminClient
        .from('mobile_device_registrations')
        .update({ notifications_enabled: false })
        .in('id', invalidTokenIds);
    }

    return jsonResponse(successEnvelope({
      code: 'PAYMENT_REMINDERS_SENT',
      message: 'Recordatorios de pago procesados correctamente.',
      data: {
        payments_considered: eligiblePayments.length,
        sent,
        failed,
        invalid_tokens: invalidTokenIds.length,
      },
    }));
  } catch (error) {
    return internalError(error);
  }
});
