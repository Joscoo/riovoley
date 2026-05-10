import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { readJsonBody } from '../_core/http/body.ts';
import { internalError, jsonResponse, methodNotAllowed } from '../_core/http/response.ts';
import { AuthAdminError } from '../_core/auth-admin/domain/auth-admin-error.ts';
import { UpdateUserPasswordUseCase } from '../_core/auth-admin/application/use-cases/update-user-password-use-case.ts';
import { SupabaseAuthAdminGateway } from '../_core/auth-admin/infrastructure/supabase-auth-admin-gateway.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed();
  }

  try {
    const gateway = new SupabaseAuthAdminGateway();
    const useCase = new UpdateUserPasswordUseCase(gateway);

    const body = await readJsonBody<{ userId?: string; newPassword?: string }>(req);
    const authorization = req.headers.get('Authorization') || '';

    const result = await useCase.execute({
      authorization,
      userId: body?.userId || '',
      newPassword: body?.newPassword || '',
    });

    return jsonResponse(result, 200);
  } catch (error) {
    if (error instanceof AuthAdminError) {
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
        error.status,
      );
    }

    return internalError(error);
  }
});
