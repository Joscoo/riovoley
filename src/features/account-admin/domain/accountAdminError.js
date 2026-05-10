export class AccountAdminError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'AccountAdminError';
    this.code = 'ACCOUNT_ADMIN_ERROR';
    this.cause = cause;
  }
}
