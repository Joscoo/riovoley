const { createAdminDashboardUseCases } = require('./createAdminDashboardUseCases');

describe('createAdminDashboardUseCases', () => {
  const activityIconFactory = {
    attendance: () => 'attendance-icon',
    payment: () => 'payment-icon',
    empty: () => 'empty-icon',
  };

  const buildRepository = () => ({
    countStudents: jest.fn(),
    listActivePayers: jest.fn(),
    listMonthlyPayments: jest.fn(),
    listPaymentsForExpiration: jest.fn(),
    countAttendancesByDate: jest.fn(),
    listPaymentTypes: jest.fn(),
    listPaymentsForFinancialReview: jest.fn(),
    listAttendancesForFinancialReview: jest.fn(),
    listStudentsForFinancialReview: jest.fn(),
    listStudentCategories: jest.fn(),
    listTrainingCategoriesForStudents: jest.fn(),
    listRecentAttendances: jest.fn(),
    listRecentPayments: jest.fn(),
    getStudentName: jest.fn(),
  });

  it('loadStatsUseCase calcula metricas del dashboard', async () => {
    const repository = buildRepository();
    const today = new Date();
    const expiredDate = new Date(today);
    expiredDate.setDate(today.getDate() - 1);
    const upcomingDate = new Date(today);
    upcomingDate.setDate(today.getDate() + 3);
    const farDate = new Date(today);
    farDate.setDate(today.getDate() + 20);

    repository.countStudents.mockResolvedValue(10);
    repository.listActivePayers.mockResolvedValue([
      { student_id: 's1' },
      { student_id: 's2' },
      { student_id: 's2' },
    ]);
    repository.listMonthlyPayments.mockResolvedValue([{ monto: 30 }, { monto: 45 }, { monto: 0 }]);
    repository.listPaymentsForExpiration.mockResolvedValue([
      { id: 1, student_id: 's1', fecha_fin: expiredDate.toISOString().slice(0, 10) },
      { id: 2, student_id: 's2', fecha_fin: expiredDate.toISOString().slice(0, 10) },
      { id: 3, student_id: 's3', fecha_fin: upcomingDate.toISOString().slice(0, 10) },
      { id: 4, student_id: 's4', fecha_fin: farDate.toISOString().slice(0, 10) },
    ]);
    repository.countAttendancesByDate.mockResolvedValue(7);
    repository.listPaymentTypes.mockResolvedValue([{ id: 1, nombre: 'pago_diario' }]);
    repository.listAttendancesForFinancialReview.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: today.toISOString().slice(0, 10), metodo_pago_id: 1 },
      { id: 'a2', student_id: 's2', fecha: today.toISOString().slice(0, 10), metodo_pago_id: 1 },
    ]);

    const useCases = createAdminDashboardUseCases(repository, activityIconFactory);
    const stats = await useCases.loadStatsUseCase.execute();

    expect(repository.countStudents).toHaveBeenCalledTimes(1);
    expect(repository.listMonthlyPayments).toHaveBeenCalledTimes(1);
    expect(repository.countAttendancesByDate).toHaveBeenCalledTimes(1);

    const monthlyRangeArg = repository.listMonthlyPayments.mock.calls[0][0];
    expect(monthlyRangeArg.firstDayOfMonth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(monthlyRangeArg.lastDayOfMonth).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(stats).toMatchObject({
      totalAtletas: 10,
      atletasActivos: 2,
      ingresosDelMes: 79,
      asistenciasHoy: 7,
      loading: false,
    });
    expect(stats.pagosVencidos).toBeGreaterThanOrEqual(1);
    expect(stats.renovacionesPendientes).toBeGreaterThanOrEqual(1);
  });

  it('loadFinancialReviewUseCase consolida mensualidades vencidas y pagos diarios por asistencia', async () => {
    const repository = buildRepository();
    repository.listStudentsForFinancialReview.mockResolvedValue([
      { id: 's1', categoria: 'iniciacion_hombres', users: { nombre: 'Ana', apellido: 'Perez' } },
      { id: 's2', categoria: 'master_mujeres', users: { nombre: 'Lia', apellido: 'Soto' } },
    ]);
    repository.listPaymentTypes.mockResolvedValue([
      { id: 1, nombre: 'pago_diario' },
      { id: 2, nombre: 'mensualidad' },
    ]);
    repository.listPaymentsForFinancialReview.mockResolvedValue([
      {
        id: 'p1',
        student_id: 's1',
        monto: 35,
        fecha_pago: '2026-06-01',
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-06-30',
      },
      {
        id: 'p2',
        student_id: 's2',
        monto: 35,
        fecha_pago: '2026-04-01',
        fecha_inicio: '2026-04-01',
        fecha_fin: '2026-04-30',
      },
    ]);
    repository.listAttendancesForFinancialReview.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-06-10', metodo_pago_id: 1 },
      { id: 'a2', student_id: 's2', fecha: '2026-06-11', metodo_pago_id: 1 },
      { id: 'a3', student_id: 's2', fecha: '2026-06-13', metodo_pago_id: 1 },
    ]);

    const useCases = createAdminDashboardUseCases(repository, activityIconFactory);
    const review = await useCases.loadFinancialReviewUseCase.execute();

    expect(review.summary.monthlyMembershipRevenue).toBe(35);
    expect(review.summary.dailyAttendanceRevenue).toBe(6);
    expect(review.summary.totalRevenue).toBe(41);
    expect(review.summary.overdueStudentsCount).toBe(1);
    expect(review.summary.overdueMonthlyFeesCount).toBeGreaterThanOrEqual(1);
    expect(review.overdueStudents[0]).toMatchObject({
      athleteName: 'Lia Soto',
      currentMonthAttendances: 2,
      currentMonthDailyPayments: 2,
      currentMonthDailyRevenue: 4,
    });
    expect(review.monthlyTrend).toHaveLength(6);
  });

  it('loadCategoriesStatsUseCase cuenta categorias correctamente', async () => {
    const repository = buildRepository();
    repository.listStudentCategories.mockResolvedValue([
      { categoria: 'iniciacion_hombres' },
      { categoria: 'iniciacion_hombres' },
      { categoria: 'master_mujeres' },
    ]);
    repository.listTrainingCategoriesForStudents.mockResolvedValue([
      { code: 'iniciacion_hombres', label: 'Iniciacion Hombres' },
      { code: 'iniciacion_mujeres', label: 'Iniciacion Mujeres' },
      { code: 'master_mujeres', label: 'Master Mujeres' },
    ]);

    const useCases = createAdminDashboardUseCases(repository, activityIconFactory);
    const categories = await useCases.loadCategoriesStatsUseCase.execute();

    expect(categories.loading).toBe(false);
    expect(categories.items).toEqual([
      { code: 'iniciacion_hombres', label: 'Iniciacion Hombres', total: 2 },
      { code: 'iniciacion_mujeres', label: 'Iniciacion Mujeres', total: 0 },
      { code: 'master_mujeres', label: 'Master Mujeres', total: 1 },
    ]);
  });

  it('loadRecentActivityUseCase retorna fallback cuando no hay actividad', async () => {
    const repository = buildRepository();
    repository.listRecentAttendances.mockResolvedValue([]);
    repository.listRecentPayments.mockResolvedValue([]);

    const useCases = createAdminDashboardUseCases(repository, activityIconFactory);
    const activity = await useCases.loadRecentActivityUseCase.execute();

    expect(activity).toEqual([
      {
        id: 'no-activity',
        tipo: 'info',
        descripcion: 'No hay actividad reciente registrada',
        fecha: 'Hoy',
        icono: 'empty-icon',
      },
    ]);
  });

  it('loadDashboardUseCase orquesta stats + categorias + actividad', async () => {
    const repository = buildRepository();
    repository.countStudents.mockResolvedValue(1);
    repository.listActivePayers.mockResolvedValue([]);
    repository.listMonthlyPayments.mockResolvedValue([]);
    repository.listPaymentsForExpiration.mockResolvedValue([]);
    repository.countAttendancesByDate.mockResolvedValue(0);
    repository.listPaymentTypes.mockResolvedValue([{ id: 1, nombre: 'pago_diario' }]);
    repository.listAttendancesForFinancialReview.mockResolvedValue([]);
    repository.listStudentCategories.mockResolvedValue([]);
    repository.listTrainingCategoriesForStudents.mockResolvedValue([]);
    repository.listRecentAttendances.mockResolvedValue([{ id: 'a1', student_id: 's1', fecha: '2026-05-10' }]);
    repository.listRecentPayments.mockResolvedValue([{ id: 'p1', student_id: 's1', fecha_pago: '2026-05-10', monto: 25 }]);
    repository.getStudentName.mockResolvedValue({ users: { nombre: 'Ana', apellido: 'Perez' } });

    const useCases = createAdminDashboardUseCases(repository, activityIconFactory);
    const dashboard = await useCases.loadDashboardUseCase.execute();

    expect(dashboard.stats.totalAtletas).toBe(1);
    expect(dashboard.categoriesStats.loading).toBe(false);
    expect(dashboard.recentActivity.length).toBeGreaterThan(0);
  });
});
