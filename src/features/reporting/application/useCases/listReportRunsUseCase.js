import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { DEFAULT_REPORT_CODE } from '../../domain/reportingPolicies';
import { runUseCase } from './helpers';

export const createListReportRunsUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ reportCode = DEFAULT_REPORT_CODE, dateFrom = null, dateTo = null, status = null, limit = 60 } = {}) =>
      runUseCase(async () =>
        repository.listRuns({
          reportCode,
          dateFrom,
          dateTo,
          status,
          limit,
        })),
  };
};
