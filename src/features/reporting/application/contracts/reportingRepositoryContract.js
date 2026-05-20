import { invalidArgumentError } from '../../domain/reportingErrors';

const requiredMethods = [
  'listRuns',
  'generateReport',
  'generateScheduledReports',
  'getDownloadUrlByRunId',
  'downloadFromSignedUrl',
  'deleteRun',
];

export const assertReportingRepository = (repository) => {
  if (!repository || typeof repository !== 'object') {
    throw invalidArgumentError('ReportingRepository inválido: se esperaba un objeto');
  }

  const missingMethods = requiredMethods.filter((method) => typeof repository[method] !== 'function');
  if (missingMethods.length > 0) {
    throw invalidArgumentError(`ReportingRepository incompleto: faltan metodos ${missingMethods.join(', ')}`);
  }
};
