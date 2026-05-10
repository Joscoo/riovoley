import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { readJsonBody } from '../_core/http/body.ts';
import { internalError, jsonResponse, methodNotAllowed } from '../_core/http/response.ts';
import { DeleteReportRunUseCase } from '../_core/reporting/application/use-cases/delete-report-run-use-case.ts';
import { LegacyReportingGateway } from '../_core/reporting/infrastructure/legacy-reporting-gateway.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowed();
  }

  try {
    const reportingGateway = new LegacyReportingGateway();
    const useCase = new DeleteReportRunUseCase(reportingGateway);

    const authHeader = req.headers.get('Authorization') || '';
    await reportingGateway.requireActor(authHeader);

    const body = await readJsonBody<Record<string, unknown>>(req);
    const runId = String(body?.run_id || '');

    const result = await useCase.execute(runId);

    return jsonResponse({
      success: true,
      code: 'REPORT_RUN_DELETED',
      message: 'Reporte eliminado correctamente',
      details: null,
      ...result,
    });
  } catch (error) {
    if (error instanceof LegacyReportingGateway.HttpError) {
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,
          details: error.details || null,
        },
        error.status,
      );
    }

    return internalError(error);
  }
});
