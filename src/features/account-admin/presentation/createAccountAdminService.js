import { createAccountAdminUseCases } from '../application/useCases/createAccountAdminUseCases';
import { SupabaseAccountAdminRepository } from '../infrastructure/repositories/supabaseAccountAdminRepository';

export const createAccountAdminService = (repository = new SupabaseAccountAdminRepository()) => {
  const useCases = createAccountAdminUseCases(repository);

  const loadUsuarios = async ({ filters }) => {
    return useCases.loadUsuariosUseCase.execute({ filters });
  };

  const updateManagedUser = async ({ editingUser, formData }) => {
    await useCases.updateManagedUserUseCase.execute({ editingUser, formData });
  };

  const deleteManagedUser = async ({ userId }) => {
    await useCases.deleteManagedUserUseCase.execute({ userId });
  };

  const suspendManagedUser = async ({ userId, reason, until }) => {
    await useCases.suspendManagedUserUseCase.execute({ userId, reason, until });
  };

  const reactivateManagedUser = async ({ userId }) => {
    await useCases.reactivateManagedUserUseCase.execute({ userId });
  };

  const loadProfileData = async ({ user }) => {
    return useCases.loadProfileDataUseCase.execute({ user });
  };

  const updateProfileData = async ({ user, userProfile, formData }) => {
    await useCases.updateProfileDataUseCase.execute({ user, userProfile, formData });
  };

  const changePassword = async ({ user, passwordData }) => {
    return useCases.changePasswordUseCase.execute({ user, passwordData });
  };

  return {
    loadUsuarios,
    updateManagedUser,
    deleteManagedUser,
    suspendManagedUser,
    reactivateManagedUser,
    loadProfileData,
    updateProfileData,
    changePassword,
  };
};
