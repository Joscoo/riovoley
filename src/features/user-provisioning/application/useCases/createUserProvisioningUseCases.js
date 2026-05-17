import { UserProvisioningError } from '../../domain/userProvisioningError';

const wrapProvisioningError = (error, fallbackMessage) => {
  if (error instanceof UserProvisioningError) {
    throw error;
  }
  throw new UserProvisioningError(error?.message || fallbackMessage, error);
};

export const createUserProvisioningUseCases = (repository, deps = {}) => {
  const createWhatsAppBusiness = deps.createWhatsAppBusiness || (() => null);

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

  const sendCredentialsByWhatsAppUseCase = {
    execute: async ({ payload }) => {
      const phone = payload?.userData?.telefono;
      if (!phone) {
        return { success: false, reason: 'missing_phone' };
      }

      try {
        const whatsAppBusiness = createWhatsAppBusiness();
        if (!whatsAppBusiness || typeof whatsAppBusiness.sendCredentials !== 'function') {
          return { success: false, reason: 'missing_gateway' };
        }

        return await whatsAppBusiness.sendCredentials(payload.userData, payload.password);
      } catch (error) {
        wrapProvisioningError(error, 'Error enviando credenciales por WhatsApp');
      }
    },
  };

  return {
    createUserUseCase,
    createStudentUseCase,
    resendCredentialsUseCase,
    sendCredentialsByWhatsAppUseCase,
  };
};
