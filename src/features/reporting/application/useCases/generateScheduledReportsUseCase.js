import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { runUseCase } from './helpers';

export const createGenerateScheduledReportsUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ targetDate } = {}) =>
      runUseCase(async () => repository.generateScheduledReports({ targetDate })),
  };
};
