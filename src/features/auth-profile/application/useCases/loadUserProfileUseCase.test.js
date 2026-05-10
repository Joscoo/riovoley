const { createLoadUserProfileUseCase } = require('./loadUserProfileUseCase');
const { AuthProfileError } = require('../../domain/authProfileError');

describe('createLoadUserProfileUseCase', () => {
  const buildRepository = () => ({
    findUserProfile: jest.fn(),
    findCoreUser: jest.fn(),
    upsertUserProfile: jest.fn(),
    createFallbackProfile: jest.fn(),
  });

  it('lanza AuthProfileError si currentUser no tiene id', async () => {
    const repository = buildRepository();
    const useCase = createLoadUserProfileUseCase(repository);

    await expect(useCase.execute({})).rejects.toBeInstanceOf(AuthProfileError);
  });

  it('retorna perfil directo cuando existe en user_profiles', async () => {
    const repository = buildRepository();
    repository.findUserProfile.mockResolvedValue({ id: 'u1', role: 'administrador' });
    const useCase = createLoadUserProfileUseCase(repository);

    const result = await useCase.execute({ id: 'u1' });

    expect(repository.findUserProfile).toHaveBeenCalledWith('u1');
    expect(repository.findCoreUser).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'u1', role: 'administrador' });
  });

  it('sincroniza y retorna perfil desde users cuando user_profiles no existe', async () => {
    const repository = buildRepository();
    repository.findUserProfile.mockResolvedValue(null);
    repository.findCoreUser.mockResolvedValue({
      id: 'u1',
      role: 'entrenador',
      nombre: 'Ana',
      apellido: 'Perez',
    });
    const useCase = createLoadUserProfileUseCase(repository);

    const result = await useCase.execute({ id: 'u1' });

    expect(repository.upsertUserProfile).toHaveBeenCalledWith({
      id: 'u1',
      role: 'entrenador',
      full_name: 'Ana Perez',
      organization_id: null,
      created_at: null,
    });
    expect(result).toMatchObject({
      id: 'u1',
      role: 'entrenador',
      full_name: 'Ana Perez',
    });
  });

  it('usa fallback profile cuando no hay user_profiles ni users', async () => {
    const repository = buildRepository();
    repository.findUserProfile.mockResolvedValue(null);
    repository.findCoreUser.mockResolvedValue(null);
    repository.createFallbackProfile.mockResolvedValue({
      id: 'u1',
      role: 'usuario',
      full_name: 'Fallback User',
    });
    const useCase = createLoadUserProfileUseCase(repository);

    const result = await useCase.execute({
      id: 'u1',
      user_metadata: { full_name: 'Fallback User' },
    });

    expect(repository.createFallbackProfile).toHaveBeenCalledWith({
      id: 'u1',
      full_name: 'Fallback User',
      role: 'usuario',
    });
    expect(result).toEqual({
      id: 'u1',
      role: 'usuario',
      full_name: 'Fallback User',
    });
  });
});
