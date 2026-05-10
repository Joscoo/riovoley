import { UserManagementError } from '../../domain/userManagementError';

const requiredMethods = [
  'listAthletes',
  'listTrainers',
  'listAdministrators',
  'createUser',
  'updateUser',
  'deleteUser',
  'suspendUser',
  'reactivateUser',
  'resendCredentials',
  'changeRole',
];

export const assertUserManagementRepository = (repository) => {
  if (!repository || typeof repository !== 'object') {
    throw new UserManagementError('UserManagementRepository invalido');
  }

  const missingMethods = requiredMethods.filter((method) => typeof repository[method] !== 'function');
  if (missingMethods.length > 0) {
    throw new UserManagementError(`UserManagementRepository incompleto: faltan ${missingMethods.join(', ')}`);
  }
};
