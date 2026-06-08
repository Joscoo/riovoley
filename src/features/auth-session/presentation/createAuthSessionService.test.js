jest.mock('../infrastructure/repositories/supabaseAuthSessionRepository', () => ({
  SupabaseAuthSessionRepository: jest.fn().mockImplementation(() => ({
    signInWithPassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    markFirstLoginCompleted: jest.fn(),
  })),
}));

jest.mock('../../gamification', () => ({
  gamificationService: {
    registerDailyLoginReward: jest.fn().mockResolvedValue({ awarded: true, xpDelta: 8 }),
  },
}));

const { createAuthSessionService } = require('./createAuthSessionService');

describe('createAuthSessionService', () => {
  it('delega signIn al repositorio', async () => {
    const repository = {
      onAuthStateChange: jest.fn(),
      getCurrentUser: jest.fn(),
      checkFirstLogin: jest.fn(),
      getUserRole: jest.fn(),
      updateLastLogin: jest.fn(),
      checkLoginAllowed: jest.fn(),
      recordLoginAttempt: jest.fn(),
      signInWithPassword: jest.fn().mockResolvedValue({ user: { id: 'u1' } }),
      signOut: jest.fn(),
      requestPasswordReset: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      setRecoverySession: jest.fn(),
      getSession: jest.fn(),
      updatePassword: jest.fn(),
      markFirstLoginCompleted: jest.fn(),
    };

    const service = createAuthSessionService(repository);
    const result = await service.signIn('demo@riovoley.com', 'secret');

    expect(repository.signInWithPassword).toHaveBeenCalledWith('demo@riovoley.com', 'secret');
    expect(result).toEqual({ user: { id: 'u1' } });
  });

  it('delega requestPasswordReset al repositorio', async () => {
    const repository = {
      onAuthStateChange: jest.fn(),
      getCurrentUser: jest.fn(),
      checkFirstLogin: jest.fn(),
      getUserRole: jest.fn(),
      updateLastLogin: jest.fn(),
      checkLoginAllowed: jest.fn(),
      recordLoginAttempt: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
      exchangeCodeForSession: jest.fn(),
      setRecoverySession: jest.fn(),
      getSession: jest.fn(),
      updatePassword: jest.fn(),
      markFirstLoginCompleted: jest.fn(),
    };

    const service = createAuthSessionService(repository);
    const result = await service.requestPasswordReset('demo@riovoley.com', 'https://app/reset');

    expect(repository.requestPasswordReset).toHaveBeenCalledWith('demo@riovoley.com', 'https://app/reset');
    expect(result).toEqual({ success: true });
  });

  it('delega markFirstLoginCompleted al repositorio', async () => {
    const repository = {
      onAuthStateChange: jest.fn(),
      getCurrentUser: jest.fn(),
      checkFirstLogin: jest.fn(),
      getUserRole: jest.fn(),
      updateLastLogin: jest.fn(),
      checkLoginAllowed: jest.fn(),
      recordLoginAttempt: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      requestPasswordReset: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      setRecoverySession: jest.fn(),
      getSession: jest.fn(),
      updatePassword: jest.fn(),
      markFirstLoginCompleted: jest.fn().mockResolvedValue({ success: true }),
    };

    const service = createAuthSessionService(repository);
    const result = await service.markFirstLoginCompleted('u1');

    expect(repository.markFirstLoginCompleted).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ success: true });
  });
});
