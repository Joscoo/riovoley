export class TrainingCategoriesError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'TrainingCategoriesError';
    this.cause = cause;
  }
}

