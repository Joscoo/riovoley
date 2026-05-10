export class PaymentsError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'PaymentsError';
    this.details = details;
  }
}
