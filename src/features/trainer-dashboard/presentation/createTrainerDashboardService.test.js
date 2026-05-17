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

  beforeEach(() => {
    jest.clearAllMocks();
    createTrainerDashboardUseCases.mockReturnValue({
      loadStatsUseCase: { execute: mockLoadStats },
    });
  });

  it('loadStats delega al use case', async () => {
    mockLoadStats.mockResolvedValueOnce({ totalAtletas: 10 });
    const service = createTrainerDashboardService({});

    const result = await service.loadStats();

    expect(mockLoadStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalAtletas: 10 });
  });
});
