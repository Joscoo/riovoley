export class UserProvisioningError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'UserProvisioningError';
    this.code = 'USER_PROVISIONING_ERROR';
    this.cause = cause;
  }
}
