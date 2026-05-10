import { assertReportingRepository } from '../contracts/reportingRepositoryContract';
import { invalidArgumentError } from '../../domain/reportingErrors';
import { runUseCase } from './helpers';

export const createDownloadFromSignedUrlUseCase = (repository) => {
  assertReportingRepository(repository);

  return {
    execute: async ({ signedUrl, fileName }) =>
      runUseCase(async () => {
        if (!signedUrl) {
          throw invalidArgumentError('signedUrl es obligatorio para descargar un reporte');
        }
        return repository.downloadFromSignedUrl(signedUrl, fileName);
      }),
  };
};
