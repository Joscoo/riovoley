export class AuthProfileError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AuthProfileError';
    this.details = details;
  }
}
