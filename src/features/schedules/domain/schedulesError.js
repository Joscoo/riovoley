export class SchedulesError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'SchedulesError';
    this.code = 'SCHEDULES_ERROR';
    this.cause = cause;
  }
}
