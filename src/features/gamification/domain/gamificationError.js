export class GamificationError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'GamificationError';
    this.cause = cause;
  }
}
