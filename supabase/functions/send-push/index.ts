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

const normalizeAudienceRoles = (audience: string[]) => {
  if (!audience.length) return [];

  return [...new Set(
    audience.flatMap((value) => AUDIENCE_ROLE_ALIASES[value] || [value]),
  )];
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

  if (type === 'payment_reminder') {
    if (role === 'estudiante') return '/estudiante?section=mensualidad';
    if (role === 'entrenador') return '/entrenador?section=pagos';
    return '/admin?section=pagos';
  }

  if (type === 'announcement') {
    if (role === 'estudiante') return '/estudiante?section=anuncios';
    if (role === 'entrenador') return '/entrenador?section=anuncios';
    return '/admin?section=anuncios';
  }

  return '/';
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
        data: { sent: 0, failed: 0, invalid_tokens: 0 },
      }));
    }

    const { data: deviceTargets, error: deviceError } = await adminClient
      .from('mobile_device_registrations')
      .select('id, user_id, device_token')
      .eq('notifications_enabled', true)
      .in('user_id', resolvedUserIds);

    if (deviceError) {
      throw deviceError;
    }

    if (!deviceTargets?.length) {
      return jsonResponse(successEnvelope({
        code: 'NO_REGISTERED_DEVICES',
        message: 'Los usuarios destino no tienen dispositivos registrados para push.',
        data: {
          resolved_user_ids: resolvedUserIds.length,
          sent: 0,
          failed: 0,
          invalid_tokens: 0,
        },
      }));
    }

    const { data: profiles, error: profilesError } = await adminClient
      .from('user_profiles')
      .select('id, role')
      .in('id', resolvedUserIds);

    if (profilesError) {
      throw profilesError;
    }

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

    for (const [routeForTargets, targets] of targetsByRoute.entries()) {
      const result = await gateway.sendToDevices(targets || [], {
        title,
        body: messageBody,
        route: routeForTargets,
        type,
        data,
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
      code: sent > 0 ? 'PUSH_SENT' : 'PUSH_SKIPPED_INVALID_TOKENS',
      message: sent > 0
        ? 'Push procesado correctamente.'
        : 'No se pudo entregar el push porque los dispositivos registrados tenían tokens inválidos.',
      data: {
        resolved_user_ids: resolvedUserIds.length,
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
