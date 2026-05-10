export class NotificationsError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'NotificationsError';
    this.code = 'NOTIFICATIONS_ERROR';
    this.cause = cause;
  }
}
