import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { invalidArgumentError } from '../../domain/reportingErrors';
import { runUseCase } from './helpers';

export const createGetDownloadUrlByRunIdUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ runId }) =>
      runUseCase(async () => {
        if (!runId) {
          throw invalidArgumentError('runId es obligatorio para obtener URL de descarga');
        }
        return repository.getDownloadUrlByRunId(runId);
      }),
  };
};
