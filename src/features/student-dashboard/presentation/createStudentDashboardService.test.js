process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../infrastructure/repositories/supabaseStudentDashboardRepository', () => ({
  SupabaseStudentDashboardRepository: jest.fn().mockImplementation(() => ({
    findStudentByUserId: jest.fn(),
    listCurrentPayments: jest.fn(),
    listPhysicalTests: jest.fn(),
    listPaymentsByStudentId: jest.fn(),
    listAttendancesFromDate: jest.fn(),
  })),
}));

jest.mock('../../gamification', () => ({
  gamificationService: {
    loadStudentGamificationByStudentId: jest.fn(),
  },
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
    const deps = {
      gamificationService: {
        loadStudentGamificationByStudentId: jest.fn().mockResolvedValue({ profile: { totalXp: 220 } }),
      },
    };

    const service = createStudentDashboardService(repository, deps);
    const result = await service.loadStudentPanelData('u1');

    expect(repository.findStudentByUserId).toHaveBeenCalledWith('u1');
    expect(result.studentData).toEqual({ id: 's1' });
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
    expect(result.gamification).toEqual({ profile: { totalXp: 220 } });
  });

  it('delega loadStudentViewData y retorna pagos/tests', async () => {
    const repository = {
      findStudentByUserId: jest.fn().mockResolvedValue({ id: 's1' }),
      listCurrentPayments: jest.fn().mockResolvedValue([]),
      listPhysicalTests: jest.fn().mockResolvedValue([{ id: 't1' }]),
      listPaymentsByStudentId: jest.fn().mockResolvedValue([{ id: 'p1' }]),
      listAttendancesFromDate: jest.fn().mockResolvedValue([]),
    };

    const service = createStudentDashboardService(repository, {
      gamificationService: {
        loadStudentGamificationByStudentId: jest.fn(),
      },
    });
    const result = await service.loadStudentViewData('u1');

    expect(repository.listPaymentsByStudentId).toHaveBeenCalledWith('s1');
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0]).toMatchObject({ id: 'p1', statusInfo: { estado: 'activo' } });
    expect(result.physicalTests).toEqual([{ id: 't1' }]);
  });

  it('delega subscribeToPaymentChanges al use case correspondiente', () => {
    const unsubscribe = jest.fn();
    const repository = {
      findStudentByUserId: jest.fn(),
      listCurrentPayments: jest.fn(),
      listPhysicalTests: jest.fn(),
      listPaymentsByStudentId: jest.fn(),
      listAttendancesFromDate: jest.fn(),
      subscribeToPaymentChanges: jest.fn(() => unsubscribe),
    };
    const onChange = jest.fn();

    const service = createStudentDashboardService(repository, {
      gamificationService: {
        loadStudentGamificationByStudentId: jest.fn(),
      },
    });

    const result = service.subscribeToPaymentChanges({ studentId: 's1', onChange });

    expect(repository.subscribeToPaymentChanges).toHaveBeenCalledWith('s1', onChange);
    expect(result).toBe(unsubscribe);
  });
});
