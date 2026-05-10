jest.mock('../../../../utils/piiCrypto', () => ({
  __esModule: true,
  withEncryptedUserContactFields: jest.fn(async (payload) => ({
    ...payload,
    encrypted: true,
  })),
}));

jest.mock('../../../user-provisioning', () => ({
  __esModule: true,
  userProvisioningService: {
    createUser: jest.fn(),
  },
}));

const { withEncryptedUserContactFields } = require('../../../../utils/piiCrypto');
const { userProvisioningService } = require('../../../user-provisioning');
const { createTrainerManagementUseCases } = require('./createTrainerManagementUseCases');

describe('createTrainerManagementUseCases', () => {
  const buildRepository = () => ({
    listTrainers: jest.fn(),
    updateTrainer: jest.fn(),
    deleteTrainer: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loadEntrenadoresUseCase delega listTrainers', async () => {
    const repository = buildRepository();
    repository.listTrainers.mockResolvedValue([{ id: 't1' }]);
    const useCases = createTrainerManagementUseCases(repository);

    const result = await useCases.loadEntrenadoresUseCase.execute();

    expect(repository.listTrainers).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('updateEntrenadorUseCase cifra payload y actualiza entrenador', async () => {
    const repository = buildRepository();
    const useCases = createTrainerManagementUseCases(repository);

    await useCases.updateEntrenadorUseCase.execute({
      editingEntrenador: { id: 't1' },
      formData: {
        nombre: 'Ana',
        apellido: 'Perez',
        email: 'ana@demo.com',
        telefono: '0999999',
        fecha_nacimiento: '2000-01-01',
      },
    });

    expect(withEncryptedUserContactFields).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Perez',
      email: 'ana@demo.com',
      telefono: '0999999',
      fecha_nacimiento: '2000-01-01',
    });
    expect(repository.updateTrainer).toHaveBeenCalledTimes(1);
    expect(repository.updateTrainer.mock.calls[0][0]).toBe('t1');
  });

  it('saveEntrenadorUseCase actualiza cuando editingEntrenador existe', async () => {
    const repository = buildRepository();
    const useCases = createTrainerManagementUseCases(repository);

    const result = await useCases.saveEntrenadorUseCase.execute({
      editingEntrenador: { id: 't1' },
      formData: {
        nombre: 'Ana',
        apellido: 'Perez',
        email: 'ana@demo.com',
        telefono: '0999999',
      },
    });

    expect(repository.updateTrainer).toHaveBeenCalledTimes(1);
    expect(userProvisioningService.createUser).not.toHaveBeenCalled();
    expect(result).toEqual({ mode: 'updated' });
  });

  it('saveEntrenadorUseCase crea usuario cuando es nuevo', async () => {
    const repository = buildRepository();
    userProvisioningService.createUser.mockResolvedValue({ success: true, user: { id: 'u1' } });
    const useCases = createTrainerManagementUseCases(repository);

    const result = await useCases.saveEntrenadorUseCase.execute({
      editingEntrenador: null,
      formData: {
        nombre: 'Lia',
        apellido: 'Torres',
        email: 'lia@demo.com',
        telefono: '0988888',
        fecha_nacimiento: '',
      },
    });

    expect(userProvisioningService.createUser).toHaveBeenCalledWith({
      email: 'lia@demo.com',
      nombre: 'Lia',
      apellido: 'Torres',
      fecha_nacimiento: null,
      telefono: '0988888',
      role: 'entrenador',
    });
    expect(result).toEqual({
      mode: 'created',
      userResult: { success: true, user: { id: 'u1' } },
    });
  });

  it('deleteEntrenadorUseCase delega deleteTrainer', async () => {
    const repository = buildRepository();
    const useCases = createTrainerManagementUseCases(repository);

    await useCases.deleteEntrenadorUseCase.execute({ trainerId: 't1' });

    expect(repository.deleteTrainer).toHaveBeenCalledWith('t1');
  });
});
