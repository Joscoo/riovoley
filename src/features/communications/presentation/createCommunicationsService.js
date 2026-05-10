import { createCommunicationsUseCases } from '../application/useCases/createCommunicationsUseCases';
import { SupabaseCommunicationsRepository } from '../infrastructure/repositories/supabaseCommunicationsRepository';

export const createCommunicationsService = (repository = new SupabaseCommunicationsRepository()) => {
  const useCases = createCommunicationsUseCases(repository);

  const sendCredentials = async (userData) => {
    return useCases.sendCredentialsUseCase.execute({ userData });
  };

  const sendPaymentConfirmation = async (paymentData) => {
    return useCases.sendPaymentConfirmationUseCase.execute({ paymentData });
  };

  const sendPasswordReset = async (userData) => {
    return useCases.sendPasswordResetUseCase.execute({ userData });
  };

  return {
    sendCredentials,
    sendPaymentConfirmation,
    sendPasswordReset,
  };
};
