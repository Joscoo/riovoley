import { UserProvisioningError } from '../../domain/userProvisioningError';

const wrapProvisioningError = (error, fallbackMessage) => {
  if (error instanceof UserProvisioningError) {
    throw error;
  }
  throw new UserProvisioningError(error?.message || fallbackMessage, error);
};

export const createUserProvisioningUseCases = (repository, deps = {}) => {
  const createWhatsAppBusiness = deps.createWhatsAppBusiness || (() => null);
  const pendingResends = new Map();

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
      const channels = [...new Set(payload?.channels ?? ['email'])];
      if (channels.length === 0 || channels.some((channel) => !['email', 'whatsapp'].includes(channel))) {
        throw new UserProvisioningError('Selecciona al menos un canal de envío válido.');
      }
      if (channels.includes('whatsapp') && !payload?.telefono) {
        throw new UserProvisioningError('El usuario no tiene teléfono para enviar por WhatsApp.');
      }
      const key = payload?.user_id;
      if (pendingResends.has(key)) return pendingResends.get(key);
      const operation = (async () => {
        try {
          const result = await repository.resendCredentials({ ...payload, channels });
          let whatsappSent = false;
          let whatsappError;
          if (channels.includes('whatsapp') && result.credentials) {
            try {
              const gateway = createWhatsAppBusiness();
              const response = await gateway?.sendCredentials({ ...payload, email: result.credentials.email }, result.credentials.password);
              whatsappSent = response?.success === true;
              if (!whatsappSent) whatsappError = response?.error || 'El servicio no confirmó el envío por WhatsApp.';
            } catch (error) {
              whatsappError = error.message;
            }
          }
          const sent = channels.filter((channel) => channel === 'email' ? result.emailSent : whatsappSent);
          const deliverySuccess = sent.length === channels.length;
          return {
            ...result,
            whatsappSent,
            whatsappError,
            requestedChannels: channels,
            deliverySuccess,
            deliveryStatus: deliverySuccess ? 'sent' : sent.length ? 'partial' : 'failed',
            message: deliverySuccess
              ? 'Nueva contraseña temporal enviada por los canales seleccionados.'
              : 'La contraseña fue actualizada, pero no se completaron todos los envíos. Conserva las credenciales para compartirlas manualmente.',
          };
        } catch (error) {
          wrapProvisioningError(error, 'Error reenviando credenciales');
        }
      })();
      pendingResends.set(key, operation);
      try {
        return await operation;
      } finally {
        pendingResends.delete(key);
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
