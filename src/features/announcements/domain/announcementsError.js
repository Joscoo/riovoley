export class AnnouncementsError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'AnnouncementsError';
    this.code = 'ANNOUNCEMENTS_ERROR';
    this.cause = cause;
  }
}
