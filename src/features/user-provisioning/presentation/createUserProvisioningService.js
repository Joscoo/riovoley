import { createUserProvisioningUseCases } from '../application/useCases/createUserProvisioningUseCases';
import { SupabaseUserProvisioningRepository } from '../infrastructure/repositories/supabaseUserProvisioningRepository';

export const createUserProvisioningService = (repository = new SupabaseUserProvisioningRepository()) => {
  const useCases = createUserProvisioningUseCases(repository);

  const createUser = async (payload) => {
    return useCases.createUserUseCase.execute({ payload });
  };

  const createStudent = async (payload) => {
    return useCases.createStudentUseCase.execute({ payload });
  };

  const resendCredentials = async (payload) => {
    return useCases.resendCredentialsUseCase.execute({ payload });
  };

  return {
    createUser,
    createStudent,
    resendCredentials,
  };
};
