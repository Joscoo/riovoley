process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createGamificationUseCases', () => ({
  __esModule: true,
  createGamificationUseCases: jest.fn(),
}));

const { createGamificationUseCases } = require('../application/useCases/createGamificationUseCases');
const { createGamificationService } = require('./createGamificationService');

describe('createGamificationService', () => {
  const mockLoadStudent = jest.fn();
  const mockLoadByStudentId = jest.fn();
  const mockRefresh = jest.fn();
  const mockProcess = jest.fn();
  const mockLeaderboard = jest.fn();
  const mockAchievements = jest.fn();
  const mockChallenges = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createGamificationUseCases.mockReturnValue({
      loadStudentGamificationUseCase: { execute: mockLoadStudent },
      loadStudentGamificationByStudentIdUseCase: { execute: mockLoadByStudentId },
      refreshStudentProgressUseCase: { execute: mockRefresh },
      processPhysicalTestRecordedUseCase: { execute: mockProcess },
      getCategoryLeaderboardUseCase: { execute: mockLeaderboard },
      listStudentAchievementsUseCase: { execute: mockAchievements },
      listActiveChallengesUseCase: { execute: mockChallenges },
    });
  });

  it('loadStudentGamification delega al use case', async () => {
    mockLoadStudent.mockResolvedValueOnce({ profile: { totalXp: 200 } });
    const service = createGamificationService({});

    const result = await service.loadStudentGamification('u1');

    expect(mockLoadStudent).toHaveBeenCalledWith({ userId: 'u1' });
    expect(result).toEqual({ profile: { totalXp: 200 } });
  });

  it('processPhysicalTestRecorded delega studentId y testId', async () => {
    mockProcess.mockResolvedValueOnce({ studentId: 's1', totalXp: 300 });
    const service = createGamificationService({});

    const result = await service.processPhysicalTestRecorded({ studentId: 's1', testId: 't1' });

    expect(mockProcess).toHaveBeenCalledWith({ studentId: 's1', testId: 't1' });
    expect(result).toEqual({ studentId: 's1', totalXp: 300 });
  });

  it('refreshStudentProgress delega studentId', async () => {
    mockRefresh.mockResolvedValueOnce({ studentId: 's1', totalXp: 420 });
    const service = createGamificationService({});

    const result = await service.refreshStudentProgress({ studentId: 's1' });

    expect(mockRefresh).toHaveBeenCalledWith({ studentId: 's1' });
    expect(result).toEqual({ studentId: 's1', totalXp: 420 });
  });
});
