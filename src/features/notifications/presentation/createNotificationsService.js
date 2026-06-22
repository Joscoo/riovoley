import { createNotificationsUseCases } from '../application/useCases/createNotificationsUseCases';
import { SupabaseNotificationsRepository } from '../infrastructure/repositories/supabaseNotificationsRepository';

export const createNotificationsService = (repository = new SupabaseNotificationsRepository()) => {
  const useCases = createNotificationsUseCases(repository);

  const loadBellNotifications = async ({ userId, userRole } = {}) => {
    return useCases.loadBellNotificationsUseCase.execute({ userId, userRole });
  };

  const markBellNotificationRead = async ({ userId, notificationId, category }) => {
    return useCases.markBellNotificationReadUseCase.execute({ userId, notificationId, category });
  };

  const dismissBellNotification = async ({ userId, notificationId, category }) => {
    return useCases.dismissBellNotificationUseCase.execute({ userId, notificationId, category });
  };

  const markBellNotificationsReadBulk = async ({ userId, notifications }) => {
    return useCases.markBellNotificationsReadBulkUseCase.execute({ userId, notifications });
  };

  const loadPaymentNotifications = async () => {
    return useCases.loadPaymentNotificationsUseCase.execute();
  };

  return {
    loadBellNotifications,
    markBellNotificationRead,
    dismissBellNotification,
    markBellNotificationsReadBulk,
    loadPaymentNotifications,
  };
};
