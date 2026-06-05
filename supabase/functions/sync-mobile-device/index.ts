import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';
import { readJsonBody } from '../_core/http/body.ts';
import { internalError, jsonResponse, methodNotAllowed, successEnvelope } from '../_core/http/response.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const requireUser = async (authHeader: string) => {
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    throw new Error('Missing bearer token.');
  }

  const { data, error } = await adminClient.auth.getUser(jwt);
  if (error || !data.user) {
    throw new Error('No se pudo autenticar al usuario.');
  }

  return data.user;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed();
  }

  try {
    const user = await requireUser(req.headers.get('Authorization') || '');
    const body = await readJsonBody<Record<string, unknown>>(req);
    const action = String(body?.action || '').trim();
    const deviceToken = String(body?.device_token || '').trim();

    if (!deviceToken || !['upsert', 'remove'].includes(action)) {
      return jsonResponse({
        success: false,
        code: 'INVALID_INPUT',
        message: 'action y device_token son obligatorios.',
        details: null,
        data: null,
      }, 400);
    }

    if (action === 'remove') {
      const { error } = await adminClient
        .from('mobile_device_registrations')
        .delete()
        .eq('user_id', user.id)
        .eq('device_token', deviceToken);

      if (error) {
        throw error;
      }

      return jsonResponse(successEnvelope({
        code: 'DEVICE_REMOVED',
        message: 'Dispositivo desvinculado correctamente.',
        data: { device_token: deviceToken },
      }));
    }

    const { error } = await adminClient
      .from('mobile_device_registrations')
      .upsert({
        user_id: user.id,
        platform: String(body?.platform || 'android'),
        device_token: deviceToken,
        device_name: typeof body?.device_name === 'string' ? body.device_name : null,
        app_version: typeof body?.app_version === 'string' ? body.app_version : null,
        notifications_enabled: body?.notifications_enabled !== false,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'device_token',
      });

    if (error) {
      throw error;
    }

    return jsonResponse(successEnvelope({
      code: 'DEVICE_SYNCED',
      message: 'Dispositivo sincronizado correctamente.',
      data: { device_token: deviceToken },
    }));
  } catch (error) {
    return internalError(error);
  }
});
