export class UserManagementError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'UserManagementError';
    this.details = details;
  }
}
