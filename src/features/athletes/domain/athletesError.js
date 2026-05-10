export class AthletesError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'AthletesError';
    this.code = 'ATHLETES_ERROR';
    this.cause = cause;
  }
}
