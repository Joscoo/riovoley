const { createTrainerDashboardUseCases } = require('./createTrainerDashboardUseCases');

describe('createTrainerDashboardUseCases', () => {
  it('loadStatsUseCase orquesta metricas y normaliza nulos a 0', async () => {
    const repository = {
      countStudents: jest.fn().mockResolvedValue(12),
      countAttendancesByDate: jest.fn().mockResolvedValue(5),
      countPhysicalTestsFromDate: jest.fn().mockResolvedValue(null),
      countPaymentsFromDate: jest.fn().mockResolvedValue(undefined),
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
});
