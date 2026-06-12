import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';
import { readJsonBody } from '../_core/http/body.ts';
import { internalError, jsonResponse, methodNotAllowed, successEnvelope } from '../_core/http/response.ts';
import { FirebasePushGateway } from '../_core/push/infrastructure/firebase-push-gateway.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const AUDIENCE_ROLE_ALIASES: Record<string, string[]> = {
  all: ['administrador', 'entrenador', 'estudiante'],
  administrador: ['administrador'],
  administradores: ['administrador'],
  entrenador: ['entrenador'],
  entrenadores: ['entrenador'],
  estudiante: ['estudiante'],
  estudiantes: ['estudiante'],
};

const PAYMENT_TYPES = new Set(['payment_reminder', 'payment_registered', 'payment_due_soon', 'payment_overdue']);
const GAMIFICATION_TYPES = new Set(['gamification_progress', 'achievement_unlocked', 'challenge_completed', 'level_up']);
const IN_QUERY_BATCH_SIZE = 50;

const normalizeAudienceRoles = (audience: string[]) => {
  if (!audience.length) return [];

  return [...new Set(
    audience.flatMap((value) => AUDIENCE_ROLE_ALIASES[value] || [value]),
  )];
};

const buildBatches = <T>(values: T[], batchSize = IN_QUERY_BATCH_SIZE) => {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += batchSize) {
    batches.push(values.slice(index, index + batchSize));
  }
  return batches;
};

const isPreferenceEnabled = (
  preferences: Record<string, {
    announcement_enabled?: boolean;
    payment_registered_enabled?: boolean;
    payment_reminders_enabled?: boolean;
    payment_overdue_enabled?: boolean;
    attendance_enabled?: boolean;
    gamification_enabled?: boolean;
  }>,
  userId: string,
  type: string,
) => {
  const preference = preferences[userId];
  if (!preference) return true;
  if (type === 'payment_registered') return preference.payment_registered_enabled !== false;
  if (type === 'payment_overdue') return preference.payment_overdue_enabled !== false;
  if (type === 'payment_reminder' || type === 'payment_due_soon') return preference.payment_reminders_enabled !== false;
  if (type === 'attendance_recorded') return preference.attendance_enabled !== false;
  if (GAMIFICATION_TYPES.has(type)) return preference.gamification_enabled !== false;
  return preference.announcement_enabled !== false;
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      type: error.constructor?.name || 'Error',
      message: error.message,
      stack: error.stack || null,
    };
  }

  if (error && typeof error === 'object') {
    try {
      return {
        type: error.constructor?.name || 'Object',
        message: typeof Reflect.get(error, 'message') === 'string' ? Reflect.get(error, 'message') : null,
        value: JSON.parse(JSON.stringify(error)),
      };
    } catch (_serializationError) {
      return {
        type: error.constructor?.name || 'Object',
        message: null,
        value: String(error),
      };
    }
  }

  return {
    type: typeof error,
    message: String(error),
    value: error ?? null,
  };
};

const buildRoleRoute = (role: string, type: string, fallbackRoute?: string) => {
  if (fallbackRoute) return fallbackRoute;

  if (PAYMENT_TYPES.has(type)) {
    if (role === 'estudiante') return '/estudiante?section=mensualidad';
    if (role === 'entrenador') return '/entrenador?section=pagos';
    return '/admin?section=pagos';
  }

  if (type === 'attendance_recorded') {
    if (role === 'estudiante') return '/estudiante?section=asistencias';
    if (role === 'entrenador') return '/entrenador?section=asistencias';
    return '/admin?section=asistencias';
  }

  if (type === 'announcement') {
    if (role === 'estudiante') return '/estudiante?section=anuncios';
    if (role === 'entrenador') return '/entrenador?section=anuncios';
    return '/admin?section=anuncios';
  }

  if (GAMIFICATION_TYPES.has(type)) {
    if (role === 'estudiante') return '/estudiante?section=progreso';
    if (role === 'entrenador') return '/entrenador?section=progreso';
    return '/admin?section=progreso';
  }

  return '/';
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
    console.warn('No se pudo actualizar trazabilidad de entrega en mobile_device_registrations.', JSON.stringify(serializeError(error)));
  }
};

const requireActor = async (authHeader: string) => {
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    throw new Error('Missing bearer token.');
  }

  const { data, error } = await adminClient.auth.getUser(jwt);
  if (error || !data.user) {
    throw new Error('No se pudo autenticar al actor.');
  }

  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('No se pudo cargar el perfil del actor.');
  }

  if (!['administrador', 'entrenador'].includes(profile.role)) {
    throw new Error('No autorizado para enviar push.');
  }

  return { userId: data.user.id, role: profile.role };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed();
  }

  try {
    await requireActor(req.headers.get('Authorization') || '');

    const body = await readJsonBody<Record<string, unknown>>(req);
    const title = String(body?.title || '').trim();
    const messageBody = String(body?.body || '').trim();
    const route = typeof body?.route === 'string' ? body.route : '';
    const type = String(body?.type || 'announcement');
    const channelId = typeof body?.channelId === 'string' ? body.channelId.trim() : '';
    const priority = body?.priority === 'high' ? 'high' : 'normal';
    const userIds = Array.isArray(body?.userIds) ? body.userIds.map(String) : [];
    const audience = Array.isArray(body?.audience) ? body.audience.map(String) : [];
    const data = typeof body?.data === 'object' && body?.data ? body.data as Record<string, unknown> : {};

    if (!title || !messageBody) {
      return jsonResponse({
        success: false,
        code: 'INVALID_INPUT',
        message: 'title y body son obligatorios.',
        details: null,
        data: null,
      }, 400);
    }

    let resolvedUserIds = [...userIds];
    if (audience.length > 0) {
      const normalizedAudience = normalizeAudienceRoles(audience);

      const { data: usersByAudience, error: audienceError } = await adminClient
        .from('user_profiles')
        .select('id, role')
        .in('role', normalizedAudience.includes('all') ? ['administrador', 'entrenador', 'estudiante'] : normalizedAudience);

      if (audienceError) {
        throw audienceError;
      }

      resolvedUserIds = [...new Set([
        ...resolvedUserIds,
        ...(usersByAudience || []).map((profile) => String(profile.id)),
      ])];
    }

    if (!resolvedUserIds.length) {
      return jsonResponse(successEnvelope({
        code: 'NO_PUSH_TARGETS',
        message: 'No se encontraron usuarios destino para esta notificación.',
        data: { resolved_user_ids: [], resolved_user_count: 0, sent: 0, failed: 0, invalid_tokens: 0 },
      }));
    }

    const preferenceBatches = await Promise.all(buildBatches(resolvedUserIds).map(async (userIdBatch) => {
      const { data: preferencesRows, error: preferencesError } = await adminClient
        .from('user_notification_preferences')
        .select('user_id, announcement_enabled, payment_registered_enabled, payment_reminders_enabled, payment_overdue_enabled, attendance_enabled, gamification_enabled')
        .in('user_id', userIdBatch);

      if (preferencesError) {
        console.warn('No se pudieron cargar preferencias de notificacion, se aplicaran valores por defecto.', JSON.stringify(serializeError(preferencesError)));
        return [];
      }

      return preferencesRows || [];
    }));

    const preferencesRows = preferenceBatches.flat();

    const preferencesByUserId = (preferencesRows || []).reduce<Record<string, {
      announcement_enabled?: boolean;
      payment_registered_enabled?: boolean;
      payment_reminders_enabled?: boolean;
      payment_overdue_enabled?: boolean;
      attendance_enabled?: boolean;
      gamification_enabled?: boolean;
    }>>((accumulator, preference) => {
      accumulator[String(preference.user_id)] = preference;
      return accumulator;
    }, {});

    const enabledUserIds = resolvedUserIds.filter((userId) => isPreferenceEnabled(preferencesByUserId, userId, type));

    if (!enabledUserIds.length) {
      return jsonResponse(successEnvelope({
        code: 'NO_PUSH_TARGETS',
        message: 'Los usuarios destino tienen desactivadas las notificaciones para este tipo de aviso.',
        data: {
          resolved_user_ids: resolvedUserIds,
          resolved_user_count: resolvedUserIds.length,
          targeted_devices: 0,
          sent: 0,
          failed: 0,
          invalid_tokens: 0,
        },
      }));
    }

    const deviceTargetBatches = await Promise.all(buildBatches(enabledUserIds).map(async (userIdBatch) => {
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

    if (!deviceTargets?.length) {
      return jsonResponse(successEnvelope({
        code: 'NO_REGISTERED_DEVICES',
        message: 'Los usuarios destino no tienen dispositivos registrados para push.',
        data: {
          resolved_user_ids: enabledUserIds,
          resolved_user_count: enabledUserIds.length,
          sent: 0,
          failed: 0,
          invalid_tokens: 0,
        },
      }));
    }

    const profileBatches = await Promise.all(buildBatches(enabledUserIds).map(async (userIdBatch) => {
      const { data: profiles, error: profilesError } = await adminClient
        .from('user_profiles')
        .select('id, role')
        .in('id', userIdBatch);

      if (profilesError) {
        throw profilesError;
      }

      return profiles || [];
    }));

    const profiles = profileBatches.flat();

    const roleByUserId = new Map((profiles || []).map((profile) => [String(profile.id), String(profile.role || '')]));
    const targetsByRoute = new Map<string, typeof deviceTargets>();

    for (const target of deviceTargets || []) {
      const targetRoute = buildRoleRoute(roleByUserId.get(String(target.user_id)) || '', type, route);
      const existingTargets = targetsByRoute.get(targetRoute) || [];
      existingTargets.push(target);
      targetsByRoute.set(targetRoute, existingTargets);
    }

    const gateway = new FirebasePushGateway();
    let sent = 0;
    let failed = 0;
    const invalidTokenIds: number[] = [];
    const failureRows: Array<{ targetId: number; status: number; response: string }> = [];
    const attemptedAt = new Date().toISOString();

    for (const [routeForTargets, targets] of targetsByRoute.entries()) {
      const routeRole = roleByUserId.get(String(targets?.[0]?.user_id || '')) || '';
      const result = await gateway.sendToDevices(targets || [], {
        title,
        body: messageBody,
        route: routeForTargets,
        type,
        channelId: channelId || (PAYMENT_TYPES.has(type) ? 'payments' : type === 'attendance_recorded' ? 'attendance' : GAMIFICATION_TYPES.has(type) ? 'progress' : 'announcements'),
        priority,
        data: {
          ...data,
          user_role: routeRole,
        },
      });
      sent += result.sent;
      failed += result.failed;
      invalidTokenIds.push(...result.invalidTokenIds);
      failureRows.push(...(result.failures || []));

      const failedIds = new Set((result.failures || []).map((failure) => failure.targetId));
      const sentIds = (targets || [])
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
      console.error('Push delivery failures', JSON.stringify(failureRows));
    }

    if (invalidTokenIds.length > 0) {
      const { error: invalidationError } = await adminClient
        .from('mobile_device_registrations')
        .update({
          notifications_enabled: false,
          invalidated_at: attemptedAt,
        })
        .in('id', invalidTokenIds);

      if (invalidationError) {
        console.warn('No se pudo invalidar tokens push fallidos.', JSON.stringify(serializeError(invalidationError)));
      }
    }

    return jsonResponse(successEnvelope({
      code: sent > 0 ? 'PUSH_SENT' : 'PUSH_SKIPPED_INVALID_TOKENS',
      message: sent > 0
        ? 'Push procesado correctamente.'
        : 'No se pudo entregar el push porque los dispositivos registrados tenían tokens inválidos.',
      data: {
        resolved_user_ids: enabledUserIds,
        resolved_user_count: enabledUserIds.length,
        targeted_devices: deviceTargets.length,
        sent,
        failed,
        invalid_tokens: invalidTokenIds.length,
      },
    }));
  } catch (error) {
    return jsonResponse({
      success: false,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error desconocido',
      details: serializeError(error),
      data: null,
    }, 500);
  }
});
