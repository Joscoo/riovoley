export class AttendanceError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AttendanceError';
    this.details = details;
  }
}
