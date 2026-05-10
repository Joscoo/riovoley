import { CommunicationsError } from '../../domain/communicationsError';

const wrapError = (error, fallback) => {
  if (error instanceof CommunicationsError) {
    throw error;
  }
  throw new CommunicationsError(error?.message || fallback, error);
};

export const createCommunicationsUseCases = (repository) => {
  const sendCredentialsUseCase = {
    execute: async ({ userData }) => {
      try {
        return await repository.sendCredentials(userData);
      } catch (error) {
        wrapError(error, 'Error enviando credenciales por correo');
      }
    },
  };

  const sendPaymentConfirmationUseCase = {
    execute: async ({ paymentData }) => {
      try {
        return await repository.sendPaymentConfirmation(paymentData);
      } catch (error) {
        wrapError(error, 'Error enviando confirmacion de pago');
      }
    },
  };

  const sendPasswordResetUseCase = {
    execute: async ({ userData }) => {
      try {
        return await repository.sendPasswordReset(userData);
      } catch (error) {
        wrapError(error, 'Error enviando correo de restablecimiento');
      }
    },
  };

  return {
    sendCredentialsUseCase,
    sendPaymentConfirmationUseCase,
    sendPasswordResetUseCase,
  };
};
