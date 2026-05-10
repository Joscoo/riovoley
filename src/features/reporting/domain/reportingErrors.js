import { REPORTING_ERROR_CODES } from './reportingErrorCodes';

export class ReportingError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'ReportingError';
    this.code = code;
    this.details = details;
  }
}

export const invalidArgumentError = (message, details = null) =>
  new ReportingError(REPORTING_ERROR_CODES.INVALID_ARGUMENT, message, details);

export const repositoryError = (message, details = null) =>
  new ReportingError(REPORTING_ERROR_CODES.REPOSITORY_ERROR, message, details);

export const downloadError = (message, details = null) =>
  new ReportingError(REPORTING_ERROR_CODES.DOWNLOAD_ERROR, message, details);

export const reportNotFoundError = (message, details = null) =>
  new ReportingError(REPORTING_ERROR_CODES.REPORT_NOT_FOUND, message, details);
