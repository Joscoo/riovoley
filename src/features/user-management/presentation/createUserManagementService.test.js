jest.mock('../infrastructure/repositories/supabaseUserManagementRepository', () => ({
  __esModule: true,
  SupabaseUserManagementRepository: jest.fn().mockImplementation(() => ({
    listAthletes: jest.fn(),
    listTrainers: jest.fn(),
    listAdministrators: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    suspendUser: jest.fn(),
    reactivateUser: jest.fn(),
    resendCredentials: jest.fn(),
    changeRole: jest.fn(),
  })),
}));

const { createUserManagementService } = require('./createUserManagementService');

describe('createUserManagementService', () => {
  const buildRepository = () => ({
    listAthletes: jest.fn(),
    listTrainers: jest.fn(),
    listAdministrators: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    suspendUser: jest.fn(),
    reactivateUser: jest.fn(),
    resendCredentials: jest.fn(),
    changeRole: jest.fn(),
  });

  it('listAthletes delega al repositorio', async () => {
    const repository = buildRepository();
    repository.listAthletes.mockResolvedValue([{ id: 'a1' }]);
    const service = createUserManagementService(repository);

    const result = await service.listAthletes();

    expect(repository.listAthletes).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('createUser delega payload completo al repositorio', async () => {
    const repository = buildRepository();
    repository.createUser.mockResolvedValue({ success: true });
    const service = createUserManagementService(repository);

    const formData = { email: 'ana@demo.com', nombre: 'Ana' };
    const result = await service.createUser(formData, 'entrenador');

    expect(repository.createUser).toHaveBeenCalledWith(formData, 'entrenador');
    expect(result).toEqual({ success: true });
  });

  it('changeRole delega userId y newRole al repositorio', async () => {
    const repository = buildRepository();
    repository.changeRole.mockResolvedValue({ success: true });
    const service = createUserManagementService(repository);

    const result = await service.changeRole('u1', 'administrador');

    expect(repository.changeRole).toHaveBeenCalledWith('u1', 'administrador');
    expect(result).toEqual({ success: true });
  });
});
