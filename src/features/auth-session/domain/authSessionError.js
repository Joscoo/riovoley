export class AuthSessionError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'AuthSessionError';
    this.code = 'AUTH_SESSION_ERROR';
    this.cause = cause;
  }
}
