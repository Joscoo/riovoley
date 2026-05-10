import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { DEFAULT_REPORT_CODE } from '../../domain/reportingPolicies';
import { invalidArgumentError } from '../../domain/reportingErrors';
import { runUseCase } from './helpers';

export const createGenerateReportUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ reportCode = DEFAULT_REPORT_CODE, periodStart, periodEnd = periodStart, trigger = 'manual', observations = '' }) =>
      runUseCase(async () => {
        if (!periodStart) {
          throw invalidArgumentError('periodStart es obligatorio para generar reportes');
        }
        return repository.generateReport({
          reportCode,
          periodStart,
          periodEnd,
          trigger,
          observations,
        });
      }),
  };
};
