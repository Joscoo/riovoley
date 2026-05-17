const { createUserProvisioningUseCases } = require('./createUserProvisioningUseCases');
const { UserProvisioningError } = require('../../domain/userProvisioningError');

describe('createUserProvisioningUseCases', () => {
  const buildRepository = () => ({
    createUser: jest.fn(),
    createStudent: jest.fn(),
    resendCredentials: jest.fn(),
  });

  const buildDeps = () => ({
    createWhatsAppBusiness: jest.fn(() => ({
      sendCredentials: jest.fn().mockResolvedValue({ success: true }),
    })),
  });

  it('createUserUseCase delega payload', async () => {
    const repository = buildRepository();
    repository.createUser.mockResolvedValue({ success: true });
    const useCases = createUserProvisioningUseCases(repository, buildDeps());

    const result = await useCases.createUserUseCase.execute({
      payload: { email: 'ana@demo.com' },
    });

    expect(repository.createUser).toHaveBeenCalledWith({ email: 'ana@demo.com' });
    expect(result).toEqual({ success: true });
  });

  it('createStudentUseCase envuelve errores genericos', async () => {
    const repository = buildRepository();
    repository.createStudent.mockRejectedValue(new Error('boom'));
    const useCases = createUserProvisioningUseCases(repository, buildDeps());

    await expect(
      useCases.createStudentUseCase.execute({
        payload: { email: 'student@demo.com' },
      })
    ).rejects.toBeInstanceOf(UserProvisioningError);
  });

  it('sendCredentialsByWhatsAppUseCase retorna missing_phone cuando no hay telefono', async () => {
    const repository = buildRepository();
    const useCases = createUserProvisioningUseCases(repository, buildDeps());

    const result = await useCases.sendCredentialsByWhatsAppUseCase.execute({
      payload: { userData: {} },
    });

    expect(result).toEqual({ success: false, reason: 'missing_phone' });
  });

  it('sendCredentialsByWhatsAppUseCase delega al gateway cuando hay telefono', async () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createUserProvisioningUseCases(repository, deps);

    const result = await useCases.sendCredentialsByWhatsAppUseCase.execute({
      payload: {
        userData: { telefono: '0999999999', email: 'ana@demo.com' },
        password: 'Temp123!',
      },
    });

    expect(deps.createWhatsAppBusiness).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
});
