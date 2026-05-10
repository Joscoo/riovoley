import { assertUserManagementRepository } from '../application/contracts/userManagementRepositoryContract';
import { SupabaseUserManagementRepository } from '../infrastructure/repositories/supabaseUserManagementRepository';

export const createUserManagementService = (repository = new SupabaseUserManagementRepository()) => {
  assertUserManagementRepository(repository);

  return {
    listAthletes: () => repository.listAthletes(),
    listTrainers: () => repository.listTrainers(),
    listAdministrators: () => repository.listAdministrators(),
    createUser: (formData, userType) => repository.createUser(formData, userType),
    updateUser: (userId, formData, userType) => repository.updateUser(userId, formData, userType),
    deleteUser: (userId, userType) => repository.deleteUser(userId, userType),
    suspendUser: (userId, reason, until) => repository.suspendUser(userId, reason, until),
    reactivateUser: (userId) => repository.reactivateUser(userId),
    resendCredentials: (userId, channels) => repository.resendCredentials(userId, channels),
    changeRole: (userId, newRole) => repository.changeRole(userId, newRole),
  };
};
