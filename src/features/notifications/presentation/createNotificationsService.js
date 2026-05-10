import { createNotificationsUseCases } from '../application/useCases/createNotificationsUseCases';
import { SupabaseNotificationsRepository } from '../infrastructure/repositories/supabaseNotificationsRepository';

export const createNotificationsService = (repository = new SupabaseNotificationsRepository()) => {
  const useCases = createNotificationsUseCases(repository);

  const loadBellNotifications = async () => {
    return useCases.loadBellNotificationsUseCase.execute();
  };

  const loadPaymentNotifications = async () => {
    return useCases.loadPaymentNotificationsUseCase.execute();
  };

  return {
    loadBellNotifications,
    loadPaymentNotifications,
  };
};
