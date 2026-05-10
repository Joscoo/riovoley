export class AdminDashboardError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'AdminDashboardError';
    this.details = details;
  }
}
