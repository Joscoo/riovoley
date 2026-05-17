import { BrowserFileDownloadGateway } from '../infrastructure/gateways/browserFileDownloadGateway';
import { SupabaseReportingRepository } from '../infrastructure/repositories/supabaseReportingRepository';
import { createDeleteRunUseCase } from '../application/useCases/deleteRunUseCase';
import { createDownloadFromSignedUrlUseCase } from '../application/useCases/downloadFromSignedUrlUseCase';
import { createEnsureDailyAttendanceReportUseCase } from '../application/useCases/ensureDailyAttendanceReportUseCase';
import { createGenerateReportUseCase } from '../application/useCases/generateReportUseCase';
import { createGenerateScheduledReportsUseCase } from '../application/useCases/generateScheduledReportsUseCase';
import { createGetDownloadUrlByRunIdUseCase } from '../application/useCases/getDownloadUrlByRunIdUseCase';
import { createListReportRunsUseCase } from '../application/useCases/listReportRunsUseCase';

const unwrapResult = (result) => {
  if (result.ok) return result.data;
  throw result.error;
};

export const createReportingService = (repositoryOverride = null) => {
  const repository = repositoryOverride || new SupabaseReportingRepository({
    fileDownloadGateway: new BrowserFileDownloadGateway(),
  });

  const listReportRunsUseCase = createListReportRunsUseCase(repository);
  const generateReportUseCase = createGenerateReportUseCase(repository);
  const generateScheduledReportsUseCase = createGenerateScheduledReportsUseCase(repository);
  const getDownloadUrlByRunIdUseCase = createGetDownloadUrlByRunIdUseCase(repository);
  const downloadFromSignedUrlUseCase = createDownloadFromSignedUrlUseCase(repository);
  const deleteRunUseCase = createDeleteRunUseCase(repository);
  const ensureDailyAttendanceReportUseCase = createEnsureDailyAttendanceReportUseCase(repository);

  return {
    listRuns: async (params) => unwrapResult(await listReportRunsUseCase.execute(params)),
    generateReport: async (params) => unwrapResult(await generateReportUseCase.execute(params)),
    generateScheduledReports: async (params) => unwrapResult(await generateScheduledReportsUseCase.execute(params)),
    getDownloadUrlByRunId: async (runId) => unwrapResult(await getDownloadUrlByRunIdUseCase.execute({ runId })),
    downloadFromSignedUrl: async (signedUrl, fileName) =>
      unwrapResult(await downloadFromSignedUrlUseCase.execute({ signedUrl, fileName })),
    deleteRun: async (runId) => unwrapResult(await deleteRunUseCase.execute({ runId })),
    ensureDailyAttendanceReport: async (params) => unwrapResult(await ensureDailyAttendanceReportUseCase.execute(params)),
  };
};
