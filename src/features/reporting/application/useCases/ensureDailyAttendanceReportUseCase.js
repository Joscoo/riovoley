import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { DEFAULT_REPORT_CODE, buildDefaultFileName } from '../../domain/reportingPolicies';
import { invalidArgumentError, reportNotFoundError } from '../../domain/reportingErrors';
import { runUseCase } from './helpers';

export const createEnsureDailyAttendanceReportUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ date, observations = '' }) =>
      runUseCase(async () => {
        if (!date) {
          throw invalidArgumentError('date es obligatorio para generar reporte diario');
        }

        const result = await repository.generateReport({
          reportCode: DEFAULT_REPORT_CODE,
          periodStart: date,
          periodEnd: date,
          trigger: 'manual',
          observations,
        });

        const runId = typeof result?.run_id === 'string' ? result.run_id.trim() : '';
        if (!result?.artifact_url && !runId) {
          throw reportNotFoundError('No se recibio run_id ni URL firmada del servicio de reportes');
        }

        const signedUrl = result.artifact_url || await repository.getDownloadUrlByRunId(runId);
        if (!signedUrl) {
          throw reportNotFoundError('No existe URL de descarga disponible para el reporte generado');
        }

        return {
          ...result,
          signedUrl,
          fileName: buildDefaultFileName(date, date),
        };
      }),
  };
};
