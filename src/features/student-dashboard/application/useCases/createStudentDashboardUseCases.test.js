const { createStudentDashboardUseCases } = require('./createStudentDashboardUseCases');
const { getEcuadorDate, getEcuadorFirstDayOfMonth } = require('../../../../utils/dateUtils');

describe('createStudentDashboardUseCases', () => {
  const buildRepository = () => ({
    findStudentByUserId: jest.fn(),
    listCurrentPayments: jest.fn(),
    listPhysicalTests: jest.fn(),
    listPaymentsByStudentId: jest.fn(),
    listAttendancesFromDate: jest.fn(),
    subscribeToPaymentChanges: jest.fn(),
  });

  it('loadPaymentStatusUseCase retorna hasPaid=true cuando existe pago vigente', async () => {
    const repository = buildRepository();
    repository.listPaymentsByStudentId.mockResolvedValue([{ id: 'p1', monto: 30, fecha_inicio: '2026-06-01', fecha_fin: '2099-05-31' }]);
    const useCases = createStudentDashboardUseCases(repository, buildDeps());

    const result = await useCases.loadPaymentStatusUseCase.execute({ studentId: 's1' });

    expect(repository.listPaymentsByStudentId).toHaveBeenCalledWith('s1');
    expect(result.hasPaid).toBe(true);
    expect(result.payment).toMatchObject({
      id: 'p1',
      monto: 30,
      fecha_inicio: '2026-06-01',
      fecha_fin: '2099-05-31',
      coverage_payment_count: 1,
      coverage_total_amount: 30,
    });
    expect(typeof result.monthName).toBe('string');
  });

  it('loadPaymentStatusUseCase agrupa la cobertura continua registrada en varios pagos', async () => {
    const repository = buildRepository();
    repository.listPaymentsByStudentId.mockResolvedValue([
      { id: 'p1', monto: 30, fecha_pago: '2026-06-01', fecha_inicio: '2026-06-01', fecha_fin: '2026-07-14', estado: 'activo' },
      { id: 'p2', monto: 30, fecha_pago: '2026-07-10', fecha_inicio: '2026-07-15', fecha_fin: '2099-12-31', estado: 'activo' },
    ]);
    const useCases = createStudentDashboardUseCases(repository, buildDeps());

    const result = await useCases.loadPaymentStatusUseCase.execute({ studentId: 's1' });

    expect(result.payment).toMatchObject({
      id: 'p2',
      fecha_inicio: '2026-06-01',
      fecha_fin: '2099-12-31',
      coverage_payment_count: 2,
      coverage_total_amount: 60,
      latest_payment_date: '2026-07-10',
      latest_payment_status: 'activo',
    });
    expect(result.hasPaid).toBe(true);
  });

  it('loadAttendanceStatsUseCase calcula estadisticas y limita recientes a 10', async () => {
    const repository = buildRepository();
    const attendances = Array.from({ length: 12 }, (_, index) => ({ id: `a${index + 1}` }));
    repository.listAttendancesFromDate.mockResolvedValue(attendances);
    const useCases = createStudentDashboardUseCases(repository, buildDeps());

    const result = await useCases.loadAttendanceStatsUseCase.execute({ studentId: 's1' });

    expect(repository.listAttendancesFromDate).toHaveBeenCalledWith('s1', getEcuadorFirstDayOfMonth());
    expect(result.totalDays).toBe(12);
    expect(result.presentDays).toBe(12);
    expect(result.absentDays).toBe(0);
    expect(result.attendanceRate).toBe('100.0');
    expect(result.recentAttendances).toHaveLength(10);
  });

  it('loadStudentPanelDataUseCase orquesta student + pago + asistencia + tests', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue({ id: 's1', categoria: 'iniciacion_hombres' });
    repository.listPaymentsByStudentId.mockResolvedValue([{ id: 'p1', fecha_inicio: '2026-06-01', fecha_fin: '2099-12-31' }]);
    repository.listAttendancesFromDate.mockResolvedValue([{ id: 'a1' }]);
    repository.listPhysicalTests.mockResolvedValue([{ id: 't1' }]);
    const deps = buildDeps();
    const useCases = createStudentDashboardUseCases(repository, deps);

    const result = await useCases.loadStudentPanelDataUseCase.execute({ userId: 'u1' });

    expect(repository.findStudentByUserId).toHaveBeenCalledWith('u1');
    expect(result.studentData.id).toBe('s1');
    expect(result.paymentStatus.hasPaid).toBe(true);
    expect(result.attendanceStats.totalDays).toBe(1);
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
    expect(deps.gamificationService.loadStudentGamificationByStudentId).toHaveBeenCalledWith({
      studentId: 's1',
      studentData: { id: 's1', categoria: 'iniciacion_hombres' },
      physicalTests: [{ id: 't1' }],
    });
    expect(result.gamification).toMatchObject({
      profile: {
        totalXp: 200,
        currentLevel: 2,
        summary: expect.objectContaining({
          weekdayAttendanceStreak: 3,
        }),
      },
      xpLedger: expect.any(Array),
    });
  });

  it('loadStudentViewDataUseCase orquesta student + pagos + tests', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue({ id: 's1' });
    repository.listPaymentsByStudentId.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    repository.listPhysicalTests.mockResolvedValue([{ id: 't1' }]);
    const deps = buildDeps();
    const useCases = createStudentDashboardUseCases(repository, deps);

    const result = await useCases.loadStudentViewDataUseCase.execute({ userId: 'u1' });

    expect(repository.findStudentByUserId).toHaveBeenCalledWith('u1');
    expect(repository.listPaymentsByStudentId).toHaveBeenCalledWith('s1');
    expect(repository.listPhysicalTests).toHaveBeenCalledWith('s1');
    expect(result.payments).toHaveLength(2);
    expect(deps.PagoStatusService.getStatusInfo).toHaveBeenCalledTimes(2);
    expect(result.payments[0]).toMatchObject({ id: 'p1', statusInfo: { estado: 'activo', mensaje: 'Activo' } });
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
  });

  it('subscribeToPaymentChangesUseCase delega al repositorio', () => {
    const repository = buildRepository();
    const unsubscribe = jest.fn();
    const onChange = jest.fn();
    repository.subscribeToPaymentChanges.mockReturnValue(unsubscribe);
    const useCases = createStudentDashboardUseCases(repository, buildDeps());

    const result = useCases.subscribeToPaymentChangesUseCase.execute({ studentId: 's1', onChange });

    expect(repository.subscribeToPaymentChanges).toHaveBeenCalledWith('s1', onChange);
    expect(result).toBe(unsubscribe);
  });
});
  const buildDeps = () => ({
    PagoStatusService: {
      getStatusInfo: jest.fn(() => ({ estado: 'activo', mensaje: 'Activo' })),
    },
    gamificationService: {
      loadStudentGamificationByStudentId: jest.fn(() => Promise.resolve({
        profile: { totalXp: 200, currentLevel: 2, summary: { weekdayAttendanceStreak: 3 } },
        achievements: [],
        challenges: [],
        leaderboard: [],
        xpLedger: [{ label: 'Asistencia registrada', xpDelta: 35 }],
      })),
    },
  });
