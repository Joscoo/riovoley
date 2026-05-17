jest.mock('../infrastructure/repositories/supabaseStudentDashboardRepository', () => ({
  SupabaseStudentDashboardRepository: jest.fn().mockImplementation(() => ({
    findStudentByUserId: jest.fn(),
    listCurrentPayments: jest.fn(),
    listPhysicalTests: jest.fn(),
    listPaymentsByStudentId: jest.fn(),
    listAttendancesFromDate: jest.fn(),
  })),
}));

const { createStudentDashboardService } = require('./createStudentDashboardService');

describe('createStudentDashboardService', () => {
  it('delega loadStudentPanelData y usa el repositorio inyectado', async () => {
    const repository = {
      findStudentByUserId: jest.fn().mockResolvedValue({ id: 's1' }),
      listCurrentPayments: jest.fn().mockResolvedValue([]),
      listPhysicalTests: jest.fn().mockResolvedValue([{ id: 't1' }]),
      listPaymentsByStudentId: jest.fn().mockResolvedValue([]),
      listAttendancesFromDate: jest.fn().mockResolvedValue([]),
    };

    const service = createStudentDashboardService(repository);
    const result = await service.loadStudentPanelData('u1');

    expect(repository.findStudentByUserId).toHaveBeenCalledWith('u1');
    expect(result.studentData).toEqual({ id: 's1' });
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
  });

  it('delega loadStudentViewData y retorna pagos/tests', async () => {
    const repository = {
      findStudentByUserId: jest.fn().mockResolvedValue({ id: 's1' }),
      listCurrentPayments: jest.fn().mockResolvedValue([]),
      listPhysicalTests: jest.fn().mockResolvedValue([{ id: 't1' }]),
      listPaymentsByStudentId: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      listAttendancesFromDate: jest.fn().mockResolvedValue([]),
    };

    const service = createStudentDashboardService(repository);
    const result = await service.loadStudentViewData('u1');

    expect(repository.listPaymentsByStudentId).toHaveBeenCalledWith('s1');
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]).toMatchObject({ id: 'p1', statusInfo: { estado: 'activo' } });
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
  });
});
