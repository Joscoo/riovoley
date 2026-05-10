export class TrainerManagementError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'TrainerManagementError';
    this.code = 'TRAINER_MANAGEMENT_ERROR';
    this.cause = cause;
  }
}
