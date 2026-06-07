const { createNotificationsUseCases } = require('./createNotificationsUseCases');
const { getEcuadorDate, getEcuadorDateMinusDays, getEcuadorDatePlusDays } = require('../../../../utils/dateUtils');

describe('createNotificationsUseCases', () => {
  it('loadBellNotificationsUseCase combina pagos y anuncios, ordenados por prioridad', async () => {
    const today = getEcuadorDate();
    const inTwoDays = getEcuadorDatePlusDays(2);
    const inTenDays = getEcuadorDatePlusDays(10);

    const repository = {
      listPaymentsForNotifications: jest.fn().mockResolvedValue([
        { id: 1, student_id: 's1', fecha_fin: today },
        { id: 2, student_id: 's2', fecha_fin: inTwoDays },
        { id: 3, student_id: 's3', fecha_fin: inTenDays },
      ]),
      listStudentsByIds: jest.fn().mockResolvedValue([
        { id: 's1', categoria: 'iniciacion_hombres', users: { nombre: 'Ana', apellido: 'Perez' } },
        { id: 's2', categoria: 'master_mujeres', users: { nombre: 'Lia', apellido: 'Torres' } },
        { id: 's4', categoria: 'perfeccionamiento_hombres', users: { nombre: 'Leo', apellido: 'Ruiz' } },
      ]),
      listRecentActiveAnnouncements: jest.fn().mockResolvedValue([
        { id: 'a1', title: 'Nuevo Horario', content: 'Se actualizo la planificacion semanal', created_at: '2026-05-09' },
      ]),
      listRecentGamificationAchievements: jest.fn().mockResolvedValue([
        { student_id: 's4', achievement_slug: 'jump_up_5', earned_at: '2026-05-10', metadata: { title: 'Salto en ascenso' } },
      ]),
    };

    const useCases = createNotificationsUseCases(repository);
    const notifications = await useCases.loadBellNotificationsUseCase.execute();

    expect(repository.listStudentsByIds).toHaveBeenCalledTimes(2);
    const idsRequested = repository.listStudentsByIds.mock.calls[0][0];
    expect(idsRequested).toHaveLength(3);
    expect(idsRequested).toEqual(expect.arrayContaining(['s1', 's2', 's3']));
    expect(repository.listStudentsByIds.mock.calls[1][0]).toEqual(['s4']);
    expect(repository.listRecentActiveAnnouncements).toHaveBeenCalledWith(getEcuadorDateMinusDays(7));
    expect(notifications).toHaveLength(4);
    expect(notifications[0].mensaje).toContain('Vence HOY');
    expect(notifications[1].mensaje).toContain('Vence en 2 dias');
    expect(notifications[2].tipo_notificacion).toBe('gamificacion');
    expect(notifications[2].mensaje).toContain('desbloqueo Salto en ascenso');
    expect(notifications[3].tipo_notificacion).toBe('anuncio');
  });

  it('loadPaymentNotificationsUseCase genera tarjetas de pago solo hasta 3 dias', async () => {
    const yesterday = getEcuadorDateMinusDays(1);
    const tomorrow = getEcuadorDatePlusDays(1);
    const inFiveDays = getEcuadorDatePlusDays(5);

    const repository = {
      listPaymentsForNotifications: jest.fn().mockResolvedValue([
        { id: 11, student_id: 's1', fecha_fin: yesterday },
        { id: 12, student_id: 's2', fecha_fin: tomorrow },
        { id: 13, student_id: 's3', fecha_fin: inFiveDays },
      ]),
      listStudentsByIds: jest.fn().mockResolvedValue([
        { id: 's1', categoria: 'iniciacion_hombres', users: { nombre: 'Ana', apellido: 'Perez' } },
        { id: 's2', categoria: 'master_mujeres', users: { nombre: 'Lia', apellido: 'Torres' } },
      ]),
      listRecentActiveAnnouncements: jest.fn(),
      listRecentGamificationAchievements: jest.fn().mockResolvedValue([]),
    };

    const useCases = createNotificationsUseCases(repository);
    const notifications = await useCases.loadPaymentNotificationsUseCase.execute();

    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({
      id: 's1',
      tipo: 'danger',
      diasRestantes: -1,
      atleta: 'Ana Perez',
    });
    expect(notifications[1]).toMatchObject({
      id: 's2',
      tipo: 'warning',
      diasRestantes: 1,
      atleta: 'Lia Torres',
    });
  });
});
