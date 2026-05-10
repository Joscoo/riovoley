import { LegacyReportingGateway } from '../../infrastructure/legacy-reporting-gateway.ts';

interface GenerateScheduledParams {
  authorization: string;
  targetDate?: string;
}

export class GenerateScheduledReportsUseCase {
  constructor(private readonly gateway: LegacyReportingGateway) {}

  async execute({ authorization, targetDate }: GenerateScheduledParams) {
    const requestedBy = await this.gateway.prepareScheduledActor({
      authorization,
      targetDate,
    });

    const definitions = await this.gateway.listSchedulableDefinitions();
    if (definitions.length === 0) {
      return {
        success: true,
        code: 'NO_DEFINITIONS',
        message: 'No hay reportes programables activos',
        processed: 0,
        failures: 0,
        results: [],
        errors: [],
        details: null,
      };
    }

    const results: Array<Record<string, unknown>> = [];
    const failures: Array<Record<string, unknown>> = [];

    for (const definition of definitions) {
      try {
        const periodDate = this.gateway.resolveSchedulePeriodDate(
          definition.timezone || 'America/Guayaquil',
          targetDate,
        );

        const run = await this.gateway.generateReport({
          reportCode: String(definition.code),
          periodStart: periodDate,
          periodEnd: periodDate,
          triggerType: 'scheduled',
          requestedBy,
        });

        results.push({
          report_code: definition.code,
          period_start: periodDate,
          period_end: periodDate,
          run_id: run.run_id,
          status: run.status,
          cached: run.cached,
        });
      } catch (error) {
        failures.push({
          report_code: definition.code,
          message: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return {
      success: failures.length === 0,
      code: failures.length === 0 ? 'SCHEDULED_REPORTS_DONE' : 'SCHEDULED_REPORTS_PARTIAL',
      message: failures.length === 0 ? 'Reportes programados generados' : 'Reportes programados con errores parciales',
      processed: results.length,
      failures: failures.length,
      results,
      errors: failures,
      details: null,
    };
  }
}
