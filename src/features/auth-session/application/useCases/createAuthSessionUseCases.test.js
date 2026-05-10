const { createAuthSessionUseCases } = require('./createAuthSessionUseCases');

describe('createAuthSessionUseCases', () => {
  const buildRepository = () => ({
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
    markFirstLoginCompleted: jest.fn(),
  });

  it('checkFirstLoginUseCase retorna null cuando userId no existe', async () => {
    const repository = buildRepository();
    const useCases = createAuthSessionUseCases(repository);

    const result = await useCases.checkFirstLoginUseCase.execute({ userId: '' });

    expect(result).toBeNull();
    expect(repository.checkFirstLogin).not.toHaveBeenCalled();
  });

  it('updateLastLoginUseCase no llama repositorio si authUser no tiene id', async () => {
    const repository = buildRepository();
    const useCases = createAuthSessionUseCases(repository);

    await useCases.updateLastLoginUseCase.execute({ authUser: null });

    expect(repository.updateLastLogin).not.toHaveBeenCalled();
  });

  it('checkLoginAllowedUseCase retorna allowed=true si el repositorio falla', async () => {
    const repository = buildRepository();
    repository.checkLoginAllowed.mockRejectedValue(new Error('boom'));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const useCases = createAuthSessionUseCases(repository);
    const result = await useCases.checkLoginAllowedUseCase.execute({ email: 'demo@riovoley.com' });

    expect(result).toEqual({ allowed: true });
    expect(repository.checkLoginAllowed).toHaveBeenCalledWith('demo@riovoley.com');
    errorSpy.mockRestore();
  });

  it('recordLoginAttemptUseCase captura errores del repositorio sin propagar', async () => {
    const repository = buildRepository();
    repository.recordLoginAttempt.mockRejectedValue(new Error('boom'));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const useCases = createAuthSessionUseCases(repository);

    await expect(
      useCases.recordLoginAttemptUseCase.execute({
        email: 'demo@riovoley.com',
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
      })
    ).resolves.toBeUndefined();

    expect(repository.recordLoginAttempt).toHaveBeenCalledWith('demo@riovoley.com', false, 'INVALID_CREDENTIALS');
    errorSpy.mockRestore();
  });

  it('signInUseCase delega al repositorio con email y password', async () => {
    const repository = buildRepository();
    repository.signInWithPassword.mockResolvedValue({ user: { id: 'u1' } });
    const useCases = createAuthSessionUseCases(repository);

    const result = await useCases.signInUseCase.execute({
      email: 'demo@riovoley.com',
      password: 'secret',
    });

    expect(repository.signInWithPassword).toHaveBeenCalledWith('demo@riovoley.com', 'secret');
    expect(result).toEqual({ user: { id: 'u1' } });
  });
});
