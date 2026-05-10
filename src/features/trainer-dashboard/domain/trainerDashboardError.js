export class TrainerDashboardError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'TrainerDashboardError';
    this.details = details;
  }
}
