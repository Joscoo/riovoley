import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { invalidArgumentError } from '../../domain/reportingErrors';
import { runUseCase } from './helpers';

export const createDeleteRunUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ runId }) =>
      runUseCase(async () => {
        if (!runId) {
          throw invalidArgumentError('runId es obligatorio para eliminar un reporte');
        }
        return repository.deleteRun(runId);
      }),
  };
};
