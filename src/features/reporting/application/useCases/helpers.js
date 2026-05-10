import { fail, ok } from '../../../../shared/lib/result';
import { ReportingError, repositoryError } from '../../domain/reportingErrors';

export const runUseCase = async (handler) => {
  try {
    const data = await handler();
    return ok(data);
  } catch (error) {
    if (error instanceof ReportingError) {
      return fail(error);
    }
    return fail(repositoryError(error?.message || 'Error inesperado en reporting', error));
  }
};
