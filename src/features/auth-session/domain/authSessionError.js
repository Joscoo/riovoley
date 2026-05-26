export class AuthSessionError extends Error {
  constructor(message, cause = null, code = 'AUTH_SESSION_ERROR') {
    super(message);
    this.name = 'AuthSessionError';
    this.code = code;
    this.cause = cause;
  }
}
