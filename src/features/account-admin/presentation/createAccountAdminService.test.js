process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

const { createAccountAdminService } = require('./createAccountAdminService');

describe('createAccountAdminService', () => {
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

  it('loadUsuarios delega al flujo del use case', async () => {
    const repository = buildRepository();
    repository.listUsersByRole.mockResolvedValue([{ id: 'u1', suspended: false }]);

    const service = createAccountAdminService(repository);
    const result = await service.loadUsuarios({
      filters: { role: 'administrador', search: '', status: '' },
    });

    expect(repository.listUsersByRole).toHaveBeenCalledWith('administrador');
    expect(result).toEqual([{ id: 'u1', suspended: false }]);
  });

  it('changePassword retorna respuesta funcional cuando password actual no valida', async () => {
    const repository = buildRepository();
    repository.verifyCurrentPassword.mockResolvedValue({ ok: false });

    const service = createAccountAdminService(repository);
    const result = await service.changePassword({
      user: { email: 'demo@riovoley.com' },
      passwordData: {
        currentPassword: 'wrong',
        newPassword: '123456',
        confirmPassword: '123456',
      },
    });

    expect(repository.verifyCurrentPassword).toHaveBeenCalledWith('demo@riovoley.com', 'wrong');
    expect(result).toEqual({
      ok: false,
      code: 'INVALID_CURRENT_PASSWORD',
      message: 'La contrasena actual es incorrecta',
    });
    expect(repository.updatePassword).not.toHaveBeenCalled();
  });
});
