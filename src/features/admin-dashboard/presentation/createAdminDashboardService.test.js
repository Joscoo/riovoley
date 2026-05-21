jest.mock('../infrastructure/repositories/supabaseAdminDashboardRepository', () => ({
  SupabaseAdminDashboardRepository: jest.fn().mockImplementation(() => ({
    countStudents: jest.fn(),
    listActivePayers: jest.fn(),
    listMonthlyPayments: jest.fn(),
    listPaymentsForExpiration: jest.fn(),
    countAttendancesByDate: jest.fn(),
    listStudentCategories: jest.fn(),
    listTrainingCategoriesForStudents: jest.fn(),
    listRecentAttendances: jest.fn(),
    listRecentPayments: jest.fn(),
    getStudentName: jest.fn(),
  })),
}));

const { createAdminDashboardService } = require('./createAdminDashboardService');

describe('createAdminDashboardService', () => {
  it('loadDashboard delega en use-cases y retorna data consolidada', async () => {
    const repository = {
      countStudents: jest.fn().mockResolvedValue(2),
      listActivePayers: jest.fn().mockResolvedValue([{ student_id: 's1' }]),
      listMonthlyPayments: jest.fn().mockResolvedValue([{ monto: 50 }]),
      listPaymentsForExpiration: jest.fn().mockResolvedValue([]),
      countAttendancesByDate: jest.fn().mockResolvedValue(1),
      listStudentCategories: jest.fn().mockResolvedValue([{ categoria: 'iniciacion_hombres' }]),
      listTrainingCategoriesForStudents: jest.fn().mockResolvedValue([{ code: 'iniciacion_hombres', label: 'Iniciacion Hombres' }]),
      listRecentAttendances: jest.fn().mockResolvedValue([]),
      listRecentPayments: jest.fn().mockResolvedValue([]),
      getStudentName: jest.fn(),
    };

    const service = createAdminDashboardService(repository);
    const result = await service.loadDashboard();

    expect(repository.countStudents).toHaveBeenCalledTimes(1);
    expect(result.stats.totalAtletas).toBe(2);
    expect(result.categoriesStats.items).toEqual([
      { code: 'iniciacion_hombres', label: 'Iniciacion Hombres', total: 1 },
    ]);
    expect(Array.isArray(result.recentActivity)).toBe(true);
  });
});
