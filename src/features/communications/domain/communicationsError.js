export class CommunicationsError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'CommunicationsError';
    this.code = 'COMMUNICATIONS_ERROR';
    this.cause = cause;
  }
}
