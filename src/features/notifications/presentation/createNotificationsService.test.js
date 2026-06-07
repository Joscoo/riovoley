jest.mock('../infrastructure/repositories/supabaseNotificationsRepository', () => ({
  SupabaseNotificationsRepository: jest.fn().mockImplementation(() => ({
    listPaymentsForNotifications: jest.fn(),
    listStudentsByIds: jest.fn(),
    listRecentActiveAnnouncements: jest.fn(),
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
    };

    const service = createNotificationsService(repository);
    const result = await service.loadBellNotifications();

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
    };

    const service = createNotificationsService(repository);
    const result = await service.loadPaymentNotifications();

    expect(repository.listPaymentsForNotifications).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].atleta).toBe('Ana Perez');
  });
});
