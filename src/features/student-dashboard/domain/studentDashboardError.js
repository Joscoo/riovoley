export class StudentDashboardError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'StudentDashboardError';
    this.details = details;
  }
}
