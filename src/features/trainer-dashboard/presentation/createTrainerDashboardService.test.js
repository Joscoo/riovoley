process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createTrainerDashboardUseCases', () => ({
  __esModule: true,
  createTrainerDashboardUseCases: jest.fn(),
}));

const { createTrainerDashboardUseCases } = require('../application/useCases/createTrainerDashboardUseCases');
const { createTrainerDashboardService } = require('./createTrainerDashboardService');

describe('createTrainerDashboardService', () => {
  const mockLoadStats = jest.fn();
  const mockLoadDashboard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createTrainerDashboardUseCases.mockReturnValue({
      loadStatsUseCase: { execute: mockLoadStats },
      loadDashboardUseCase: { execute: mockLoadDashboard },
    });
  });

  it('loadStats delega al use case', async () => {
    mockLoadStats.mockResolvedValueOnce({ totalAtletas: 10 });
    const service = createTrainerDashboardService({});

    const result = await service.loadStats();

    expect(mockLoadStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalAtletas: 10 });
  });

  it('loadDashboard delega al use case consolidado', async () => {
    mockLoadDashboard.mockResolvedValueOnce({
      stats: { totalAtletas: 10 },
      categoriesStats: { items: [{ code: 'iniciacion_hombres', total: 3 }], loading: false },
    });
    const service = createTrainerDashboardService({});

    const result = await service.loadDashboard();

    expect(mockLoadDashboard).toHaveBeenCalledTimes(1);
    expect(result.categoriesStats.items[0].code).toBe('iniciacion_hombres');
  });
});
