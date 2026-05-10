jest.mock('../../../../shared/infrastructure/auth/deleteAuthUserById', () => ({
  __esModule: true,
  deleteAuthUserById: jest.fn(),
}));

const { deleteAuthUserById } = require('../../../../shared/infrastructure/auth/deleteAuthUserById');
const { createAccountAdminUseCases } = require('./createAccountAdminUseCases');

describe('createAccountAdminUseCases', () => {
  const buildRepository = () => ({
    listUsersByRole: jest.fn(),
    updateUser: jest.fn(),
    upsertUserProfile: jest.fn(),
    deleteUser: jest.fn(),
    updateUserSuspension: jest.fn(),
    getProfileById: jest.fn(),
    getUserById: jest.fn(),
    insertUser: jest.fn(),
    updateUserProfileName: jest.fn(),
    verifyCurrentPassword: jest.fn(),
    updatePassword: jest.fn(),
  });

  it('loadUsuariosUseCase aplica filtros de busqueda y estado', async () => {
    const repository = buildRepository();
    repository.listUsersByRole.mockResolvedValue([
      { id: '1', nombre: 'Ana', apellido: 'Perez', email: 'ana@demo.com', suspended: false },
      { id: '2', nombre: 'Lia', apellido: 'Torres', email: 'lia@demo.com', suspended: true },
    ]);

    const useCases = createAccountAdminUseCases(repository);
    const users = await useCases.loadUsuariosUseCase.execute({
      filters: { role: 'entrenador', search: 'lia', status: 'suspendido' },
    });

    expect(repository.listUsersByRole).toHaveBeenCalledWith('entrenador');
    expect(users).toEqual([{ id: '2', nombre: 'Lia', apellido: 'Torres', email: 'lia@demo.com', suspended: true }]);
  });

  it('updateManagedUserUseCase actualiza usuario y su profile', async () => {
    const repository = buildRepository();
    const useCases = createAccountAdminUseCases(repository);

    await useCases.updateManagedUserUseCase.execute({
      editingUser: { id: 'u1' },
      formData: {
        role: 'entrenador',
        nombre: 'Juan',
        apellido: 'Lopez',
        telefono: '0991234567',
      },
    });

    expect(repository.updateUser).toHaveBeenCalledWith('u1', {
      role: 'entrenador',
      nombre: 'Juan',
      apellido: 'Lopez',
      telefono: '0991234567',
    });
    expect(repository.upsertUserProfile).toHaveBeenCalledWith({
      id: 'u1',
      role: 'entrenador',
      full_name: 'Juan Lopez',
    });
  });

  it('deleteManagedUserUseCase elimina auth y luego registro local', async () => {
    const repository = buildRepository();
    const useCases = createAccountAdminUseCases(repository);

    await useCases.deleteManagedUserUseCase.execute({ userId: 'u1' });

    expect(deleteAuthUserById).toHaveBeenCalledWith('u1');
    expect(repository.deleteUser).toHaveBeenCalledWith('u1');
  });

  it('suspendManagedUserUseCase registra suspension con timestamp Ecuador', async () => {
    const repository = buildRepository();
    const useCases = createAccountAdminUseCases(repository);

    await useCases.suspendManagedUserUseCase.execute({
      userId: 'u1',
      reason: 'Incumplimiento',
      until: '2026-06-01',
    });

    expect(repository.updateUserSuspension).toHaveBeenCalledWith('u1', {
      suspended: true,
      suspension_reason: 'Incumplimiento',
      suspension_until: '2026-06-01',
      suspended_at: expect.any(String),
    });
  });

  it('loadProfileDataUseCase arma fallback cuando no existe users row', async () => {
    const repository = buildRepository();
    repository.getProfileById.mockResolvedValue({ id: 'u1', full_name: 'Ana Perez', role: 'estudiante' });
    repository.getUserById.mockResolvedValue(null);

    const useCases = createAccountAdminUseCases(repository);
    const result = await useCases.loadProfileDataUseCase.execute({
      user: { id: 'u1', email: 'ana@demo.com' },
    });

    expect(result.userData).toMatchObject({
      id: 'u1',
      email: 'ana@demo.com',
      nombre: 'Ana',
      apellido: 'Perez',
    });
    expect(result.formData.nombre).toBe('Ana');
  });

  it('updateProfileDataUseCase inserta user cuando no existe y actualiza profile name', async () => {
    const repository = buildRepository();
    repository.getUserById.mockResolvedValue(null);
    const useCases = createAccountAdminUseCases(repository);

    await useCases.updateProfileDataUseCase.execute({
      user: { id: 'u1', email: 'ana@demo.com' },
      userProfile: { role: 'estudiante' },
      formData: {
        nombre: 'Ana',
        apellido: 'Perez',
        telefono: '099123',
        fecha_nacimiento: '2010-01-01',
      },
    });

    expect(repository.insertUser).toHaveBeenCalledWith({
      id: 'u1',
      email: 'ana@demo.com',
      nombre: 'Ana',
      apellido: 'Perez',
      telefono: '099123',
      fecha_nacimiento: '2010-01-01',
      role: 'estudiante',
    });
    expect(repository.updateUserProfileName).toHaveBeenCalledWith('u1', 'Ana Perez');
  });

  it('changePasswordUseCase valida campos y no llama verify cuando faltan datos', async () => {
    const repository = buildRepository();
    const useCases = createAccountAdminUseCases(repository);

    const result = await useCases.changePasswordUseCase.execute({
      user: { email: 'ana@demo.com' },
      passwordData: {
        currentPassword: '',
        newPassword: '123456',
        confirmPassword: '123456',
      },
    });

    expect(result).toEqual({
      ok: false,
      code: 'MISSING_FIELDS',
      message: 'Por favor completa todos los campos',
    });
    expect(repository.verifyCurrentPassword).not.toHaveBeenCalled();
  });

  it('changePasswordUseCase actualiza cuando validaciones y verificacion son correctas', async () => {
    const repository = buildRepository();
    repository.verifyCurrentPassword.mockResolvedValue({ ok: true });
    const useCases = createAccountAdminUseCases(repository);

    const result = await useCases.changePasswordUseCase.execute({
      user: { email: 'ana@demo.com' },
      passwordData: {
        currentPassword: 'oldpass',
        newPassword: 'newpass1',
        confirmPassword: 'newpass1',
      },
    });

    expect(repository.verifyCurrentPassword).toHaveBeenCalledWith('ana@demo.com', 'oldpass');
    expect(repository.updatePassword).toHaveBeenCalledWith('newpass1');
    expect(result).toEqual({ ok: true });
  });
});
