jest.mock('../infrastructure/repositories/supabaseNotificationsRepository', () => ({
  SupabaseNotificationsRepository: jest.fn().mockImplementation(() => ({
    listPaymentsForNotifications: jest.fn(),
    listStudentsByIds: jest.fn(),
    listRecentActiveAnnouncements: jest.fn(),
    listNotificationInboxState: jest.fn(),
    markNotificationAsRead: jest.fn(),
    dismissNotification: jest.fn(),
    markNotificationsAsReadBulk: jest.fn(),
  })),
}));

const { createNotificationsService } = require('./createNotificationsService');

describe('createNotificationsService', () => {
  it('delega loadBellNotifications al caso de uso', async () => {
    const repository = {
      listPaymentsForNotifications: jest.fn().mockResolvedValue([]),
      listStudentsByIds: jest.fn().mockResolvedValue([]),
      listRecentActiveAnnouncements: jest.fn().mockResolvedValue([]),
      listRecentGamificationAchievements: jest.fn().mockResolvedValue([]),
      listNotificationInboxState: jest.fn().mockResolvedValue([]),
      markNotificationAsRead: jest.fn(),
      dismissNotification: jest.fn(),
      markNotificationsAsReadBulk: jest.fn(),
    };

    const service = createNotificationsService(repository);
    const result = await service.loadBellNotifications({ userId: 'u1', userRole: 'entrenador' });

    expect(repository.listPaymentsForNotifications).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('delega loadPaymentNotifications al caso de uso', async () => {
    const repository = {
      listPaymentsForNotifications: jest.fn().mockResolvedValue([
        { student_id: 's1', fecha_fin: '2026-05-10' },
      ]),
      listStudentsByIds: jest.fn().mockResolvedValue([
        { id: 's1', categoria: 'iniciacion_hombres', users: { nombre: 'Ana', apellido: 'Perez' } },
      ]),
      listRecentActiveAnnouncements: jest.fn().mockResolvedValue([]),
      listRecentGamificationAchievements: jest.fn().mockResolvedValue([]),
      listNotificationInboxState: jest.fn().mockResolvedValue([]),
      markNotificationAsRead: jest.fn(),
      dismissNotification: jest.fn(),
      markNotificationsAsReadBulk: jest.fn(),
    };

    const service = createNotificationsService(repository);
    const result = await service.loadPaymentNotifications();

    expect(repository.listPaymentsForNotifications).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].atleta).toBe('Ana Perez');
  });

  it('delega acciones de bandeja persistida al repositorio', async () => {
    const repository = {
      listPaymentsForNotifications: jest.fn().mockResolvedValue([]),
      listStudentsByIds: jest.fn().mockResolvedValue([]),
      listRecentActiveAnnouncements: jest.fn().mockResolvedValue([]),
      listRecentGamificationAchievements: jest.fn().mockResolvedValue([]),
      listNotificationInboxState: jest.fn().mockResolvedValue([]),
      markNotificationAsRead: jest.fn().mockResolvedValue({ notification_key: 'anuncio-a1' }),
      dismissNotification: jest.fn().mockResolvedValue({ notification_key: 'anuncio-a1' }),
      markNotificationsAsReadBulk: jest.fn().mockResolvedValue([]),
    };

    const service = createNotificationsService(repository);

    await service.markBellNotificationRead({ userId: 'u1', notificationId: 'anuncio-a1', category: 'anuncios' });
    await service.dismissBellNotification({ userId: 'u1', notificationId: 'anuncio-a1', category: 'anuncios' });
    await service.markBellNotificationsReadBulk({
      userId: 'u1',
      notifications: [{ id: 'anuncio-a1', category: 'anuncios' }],
    });

    expect(repository.markNotificationAsRead).toHaveBeenCalledWith({
      userId: 'u1',
      notificationKey: 'anuncio-a1',
      notificationCategory: 'anuncios',
    });
    expect(repository.dismissNotification).toHaveBeenCalledWith({
      userId: 'u1',
      notificationKey: 'anuncio-a1',
      notificationCategory: 'anuncios',
    });
    expect(repository.markNotificationsAsReadBulk).toHaveBeenCalledWith('u1', [
      { notificationKey: 'anuncio-a1', notificationCategory: 'anuncios' },
    ]);
  });
});
