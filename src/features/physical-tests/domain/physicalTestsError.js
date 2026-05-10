export class PhysicalTestsError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'PhysicalTestsError';
    this.code = 'PHYSICAL_TESTS_ERROR';
    this.cause = cause;
  }
}
