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

  it('un doble clic simultaneo solo cambia una vez la contrasena del usuario', async () => {
    const repository = buildRepository();
    let finish;
    repository.resendCredentials.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const useCases = createUserProvisioningUseCases(repository, buildDeps());
    const input = { payload: { user_id: 'u1', email: 'ana@demo.com' } };
    const first = useCases.resendCredentialsUseCase.execute(input);
    const second = useCases.resendCredentialsUseCase.execute(input);
    finish({ success: true, emailSent: true, credentials: { email: 'ana@demo.com', password: 'Temp123456!' } });
    const results = await Promise.all([first, second]);
    expect(repository.resendCredentials).toHaveBeenCalledTimes(1);
    expect(results[0].credentials.password).toBe(results[1].credentials.password);
  });

  it('no cambia la contrasena si no se selecciono ningun canal', async () => {
    const repository = buildRepository();
    const useCases = createUserProvisioningUseCases(repository, buildDeps());
    await expect(useCases.resendCredentialsUseCase.execute({
      payload: { user_id: 'u1', email: 'ana@demo.com', channels: [] },
    })).rejects.toThrow(/canal/i);
    expect(repository.resendCredentials).not.toHaveBeenCalled();
  });

  it('un fallo de WhatsApp conserva la nueva contrasena y el resultado parcial de email', async () => {
    const repository = buildRepository();
    const credentials = { email: 'ana@demo.com', password: 'Temp123456!', loginUrl: 'https://riovoley.com/login' };
    repository.resendCredentials.mockResolvedValue({ success: true, emailSent: true, credentials });
    const deps = { createWhatsAppBusiness: () => ({ sendCredentials: async () => { throw new Error('WhatsApp no disponible'); } }) };
    const useCases = createUserProvisioningUseCases(repository, deps);
    const result = await useCases.resendCredentialsUseCase.execute({ payload: {
      user_id: 'u1', email: 'ana@demo.com', telefono: '0999999999', channels: ['email', 'whatsapp'],
    } });
    expect(result.credentials).toEqual(credentials);
    expect(result.deliverySuccess).toBe(false);
    expect(result.deliveryStatus).toBe('partial');
    expect(result.whatsappError).toContain('WhatsApp no disponible');
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
