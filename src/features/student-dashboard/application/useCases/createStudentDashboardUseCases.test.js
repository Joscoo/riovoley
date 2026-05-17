const { createStudentDashboardUseCases } = require('./createStudentDashboardUseCases');
const { getEcuadorDate, getEcuadorFirstDayOfMonth } = require('../../../../utils/dateUtils');

describe('createStudentDashboardUseCases', () => {
  const buildRepository = () => ({
    findStudentByUserId: jest.fn(),
    listCurrentPayments: jest.fn(),
    listPhysicalTests: jest.fn(),
    listPaymentsByStudentId: jest.fn(),
    listAttendancesFromDate: jest.fn(),
  });

  it('loadPaymentStatusUseCase retorna hasPaid=true cuando existe pago vigente', async () => {
    const repository = buildRepository();
    repository.listCurrentPayments.mockResolvedValue([{ id: 'p1', monto: 30 }]);
    const useCases = createStudentDashboardUseCases(repository, buildDeps());

    const result = await useCases.loadPaymentStatusUseCase.execute({ studentId: 's1' });

    expect(repository.listCurrentPayments).toHaveBeenCalledWith('s1', getEcuadorDate());
    expect(result.hasPaid).toBe(true);
    expect(result.payment).toEqual({ id: 'p1', monto: 30 });
    expect(typeof result.monthName).toBe('string');
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
    repository.listCurrentPayments.mockResolvedValue([{ id: 'p1' }]);
    repository.listAttendancesFromDate.mockResolvedValue([{ id: 'a1' }]);
    repository.listPhysicalTests.mockResolvedValue([{ id: 't1' }]);
    const useCases = createStudentDashboardUseCases(repository, buildDeps());

    const result = await useCases.loadStudentPanelDataUseCase.execute({ userId: 'u1' });

    expect(repository.findStudentByUserId).toHaveBeenCalledWith('u1');
    expect(result.studentData.id).toBe('s1');
    expect(result.paymentStatus.hasPaid).toBe(true);
    expect(result.attendanceStats.totalDays).toBe(1);
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
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
});
  const buildDeps = () => ({
    PagoStatusService: {
      getStatusInfo: jest.fn(() => ({ estado: 'activo', mensaje: 'Activo' })),
    },
  });
