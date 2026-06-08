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
  const mockLeaderboards = jest.fn();
  const mockAchievements = jest.fn();
  const mockChallenges = jest.fn();
  const mockXpLedger = jest.fn();
  const mockLoginReward = jest.fn();
  const mockUpdateIdentity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createGamificationUseCases.mockReturnValue({
      loadStudentGamificationUseCase: { execute: mockLoadStudent },
      loadStudentGamificationByStudentIdUseCase: { execute: mockLoadByStudentId },
      refreshStudentProgressUseCase: { execute: mockRefresh },
      processPhysicalTestRecordedUseCase: { execute: mockProcess },
      getCategoryLeaderboardUseCase: { execute: mockLeaderboard },
      listCategoryLeaderboardsUseCase: { execute: mockLeaderboards },
      listStudentAchievementsUseCase: { execute: mockAchievements },
      listActiveChallengesUseCase: { execute: mockChallenges },
      loadXpLedgerUseCase: { execute: mockXpLedger },
      registerDailyLoginRewardUseCase: { execute: mockLoginReward },
      updateStudentIdentityUseCase: { execute: mockUpdateIdentity },
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

  it('listCategoryLeaderboards delega categoria y limite', async () => {
    mockLeaderboards.mockResolvedValueOnce([{ type: 'overall', rows: [] }]);
    const service = createGamificationService({});

    const result = await service.listCategoryLeaderboards({
      category: 'iniciacion_hombres',
      ageBand: 'menor',
      limit: 6,
    });

    expect(mockLeaderboards).toHaveBeenCalledWith({
      category: 'iniciacion_hombres',
      ageBand: 'menor',
      limit: 6,
    });
    expect(result).toEqual([{ type: 'overall', rows: [] }]);
  });

  it('loadXpLedger delega studentId y limit', async () => {
    mockXpLedger.mockResolvedValueOnce([{ label: 'Asistencia', xpDelta: 35 }]);
    const service = createGamificationService({});

    const result = await service.loadXpLedger({ studentId: 's1', limit: 20 });

    expect(mockXpLedger).toHaveBeenCalledWith({ studentId: 's1', limit: 20 });
    expect(result[0].label).toBe('Asistencia');
  });

  it('registerDailyLoginReward delega userId', async () => {
    mockLoginReward.mockResolvedValueOnce({ awarded: true, xpDelta: 8 });
    const service = createGamificationService({});

    const result = await service.registerDailyLoginReward({ userId: 'u1' });

    expect(mockLoginReward).toHaveBeenCalledWith({ userId: 'u1' });
    expect(result).toEqual({ awarded: true, xpDelta: 8 });
  });

  it('updateStudentIdentity delega userId, apodo y titulo', async () => {
    mockUpdateIdentity.mockResolvedValueOnce({ identity: { nickname: 'RayoLeo' } });
    const service = createGamificationService({});

    const result = await service.updateStudentIdentity({
      userId: 'u1',
      nickname: 'RayoLeo',
      selectedTitleSlug: 'primer_impulso',
    });

    expect(mockUpdateIdentity).toHaveBeenCalledWith({
      userId: 'u1',
      nickname: 'RayoLeo',
      selectedTitleSlug: 'primer_impulso',
    });
    expect(result).toEqual({ identity: { nickname: 'RayoLeo' } });
  });
});
