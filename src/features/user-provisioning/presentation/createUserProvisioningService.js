import { createUserProvisioningUseCases } from '../application/useCases/createUserProvisioningUseCases';
import { SupabaseUserProvisioningRepository } from '../infrastructure/repositories/supabaseUserProvisioningRepository';
import WhatsAppBusinessService from '../../../services/whatsappBusinessService';

export const createUserProvisioningService = (
  repository = new SupabaseUserProvisioningRepository(),
  deps = {}
) => {
  const createWhatsAppBusiness = deps.createWhatsAppBusiness || (() => new WhatsAppBusinessService());
  const useCases = createUserProvisioningUseCases(repository, {
    createWhatsAppBusiness,
  });

  const createUser = async (payload) => {
    return useCases.createUserUseCase.execute({ payload });
  };

  const createStudent = async (payload) => {
    return useCases.createStudentUseCase.execute({ payload });
  };

  const resendCredentials = async (payload) => {
    return useCases.resendCredentialsUseCase.execute({ payload });
  };

  const sendCredentialsByWhatsApp = async (payload) => {
    return useCases.sendCredentialsByWhatsAppUseCase.execute({ payload });
  };

  return {
    createUser,
    createStudent,
    resendCredentials,
    sendCredentialsByWhatsApp,
  };
};
