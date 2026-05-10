import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { readJsonBody } from '../_core/http/body.ts';
import { internalError, jsonResponse, methodNotAllowed } from '../_core/http/response.ts';
import { GenerateReportRunUseCase } from '../_core/reporting/application/use-cases/generate-report-run-use-case.ts';
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
    const useCase = new GenerateReportRunUseCase(reportingGateway);

    const authHeader = req.headers.get('Authorization') || '';
    const actor = await reportingGateway.requireActor(authHeader);

    const body = await readJsonBody<Record<string, unknown>>(req);
    const reportCode = String(body?.report_code || 'attendance_daily');
    const periodStart = String(body?.period_start || '');
    const periodEnd = String(body?.period_end || periodStart);
    const triggerType = reportingGateway.asTriggerType(body?.trigger);
    const observations = typeof body?.observations === 'string' ? body.observations : '';

    const result = await useCase.execute({
      reportCode,
      periodStart,
      periodEnd,
      triggerType,
      requestedBy: actor.userId,
      observations,
    });

    return jsonResponse({
      success: true,
      code: 'REPORT_GENERATED',
      run_id: result.run_id,
      status: result.status,
      artifact_url: result.artifact_url,
      cached: result.cached,
      details: null,
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
