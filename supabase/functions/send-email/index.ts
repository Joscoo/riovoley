import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { readJsonBody } from '../_core/http/body.ts';
import { internalError, jsonResponse, methodNotAllowed, successEnvelope } from '../_core/http/response.ts';
import { CommunicationsCoreError } from '../_core/communications/domain/communications-error.ts';
import { SendEmailUseCase } from '../_core/communications/application/use-cases/send-email-use-case.ts';
import { ResendCommunicationsGateway } from '../_core/communications/infrastructure/resend-communications-gateway.ts';
import { SupabaseAuthAdminGateway } from '../_core/auth-admin/infrastructure/supabase-auth-admin-gateway.ts';
import { AuthAdminError } from '../_core/auth-admin/domain/auth-admin-error.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed();
  }

  try {
    const gateway = new ResendCommunicationsGateway();
    const useCase = new SendEmailUseCase(gateway, new SupabaseAuthAdminGateway());
    const body = await readJsonBody<{ to?: string; subject?: string; html?: string; attachments?: unknown[] }>(req);

    const result = await useCase.execute({
      to: body?.to || '',
      subject: body?.subject || '',
      html: body?.html || '',
      attachments: body?.attachments,
    }, req.headers.get('Authorization') || '');

    const { success, code, message, details, ...extra } = (result || {}) as Record<string, unknown>;
    return jsonResponse(
      successEnvelope({
        success: typeof success === 'boolean' ? success : true,
        code: typeof code === 'string' ? code : 'EMAIL_SENT',
        message: typeof message === 'string' ? message : 'Operacion completada',
        details: details ?? null,
        data: extra,
      }),
      200,
    );
  } catch (error) {
    if (error instanceof CommunicationsCoreError || error instanceof AuthAdminError) {
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,
          details: error.details ?? null,
          data: null,
        },
        error.status,
      );
    }

    return internalError(error);
  }
});
