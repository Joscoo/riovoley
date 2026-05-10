import { UserProvisioningError } from '../../domain/userProvisioningError';

const wrapProvisioningError = (error, fallbackMessage) => {
  if (error instanceof UserProvisioningError) {
    throw error;
  }
  throw new UserProvisioningError(error?.message || fallbackMessage, error);
};

export const createUserProvisioningUseCases = (repository) => {
  const createUserUseCase = {
    execute: async ({ payload }) => {
      try {
        return await repository.createUser(payload);
      } catch (error) {
        wrapProvisioningError(error, 'Error creando usuario');
      }
    },
  };

  const createStudentUseCase = {
    execute: async ({ payload }) => {
      try {
        return await repository.createStudent(payload);
      } catch (error) {
        wrapProvisioningError(error, 'Error creando estudiante');
      }
    },
  };

  const resendCredentialsUseCase = {
    execute: async ({ payload }) => {
      try {
        return await repository.resendCredentials(payload);
      } catch (error) {
        wrapProvisioningError(error, 'Error reenviando credenciales');
      }
    },
  };

  return {
    createUserUseCase,
    createStudentUseCase,
    resendCredentialsUseCase,
  };
};
