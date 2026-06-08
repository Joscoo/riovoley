const { createTrainerDashboardUseCases } = require('./createTrainerDashboardUseCases');

describe('createTrainerDashboardUseCases', () => {
  it('loadStatsUseCase orquesta metricas y normaliza nulos a 0', async () => {
    const repository = {
      countStudents: jest.fn().mockResolvedValue(12),
      countAttendancesByDate: jest.fn().mockResolvedValue(5),
      countPhysicalTestsFromDate: jest.fn().mockResolvedValue(null),
      countPaymentsFromDate: jest.fn().mockResolvedValue(undefined),
      listStudentCategories: jest.fn().mockResolvedValue([]),
      listTrainingCategoriesForStudents: jest.fn().mockResolvedValue([]),
    };
    const useCases = createTrainerDashboardUseCases(repository);

    const result = await useCases.loadStatsUseCase.execute();

    expect(repository.countAttendancesByDate).toHaveBeenCalledTimes(1);
    expect(repository.countPhysicalTestsFromDate).toHaveBeenCalledTimes(1);
    expect(repository.countPaymentsFromDate).toHaveBeenCalledTimes(1);
    expect(repository.countAttendancesByDate.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(repository.countPhysicalTestsFromDate.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(repository.countPaymentsFromDate.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toEqual({
      totalAtletas: 12,
      asistenciasHoy: 5,
      testsPendientes: 0,
      pagosDelMes: 0,
    });
  });

  it('loadDashboardUseCase incluye categorias para competencia por categoria', async () => {
    const repository = {
      countStudents: jest.fn().mockResolvedValue(8),
      countAttendancesByDate: jest.fn().mockResolvedValue(3),
      countPhysicalTestsFromDate: jest.fn().mockResolvedValue(4),
      countPaymentsFromDate: jest.fn().mockResolvedValue(6),
      listStudentCategories: jest.fn().mockResolvedValue([
        { categoria: 'iniciacion_hombres' },
        { categoria: 'iniciacion_hombres' },
        { categoria: 'sub16_mujeres' },
      ]),
      listTrainingCategoriesForStudents: jest.fn().mockResolvedValue([
        { code: 'iniciacion_hombres', label: 'Iniciacion Hombres' },
        { code: 'sub16_mujeres', label: 'Sub 16 Mujeres' },
      ]),
    };

    const useCases = createTrainerDashboardUseCases(repository);
    const result = await useCases.loadDashboardUseCase.execute();

    expect(result.stats.totalAtletas).toBe(8);
    expect(result.categoriesStats.loading).toBe(false);
    expect(result.categoriesStats.items).toEqual([
      { code: 'iniciacion_hombres', label: 'Iniciacion Hombres', total: 2 },
      { code: 'sub16_mujeres', label: 'Sub 16 Mujeres', total: 1 },
    ]);
  });
});
