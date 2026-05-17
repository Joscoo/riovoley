const { createCommunicationsUseCases } = require('./createCommunicationsUseCases');
const { CommunicationsError } = require('../../domain/communicationsError');

describe('createCommunicationsUseCases', () => {
  const buildRepository = () => ({
    sendCredentials: jest.fn(),
    sendPaymentConfirmation: jest.fn(),
    sendPasswordReset: jest.fn(),
  });

  it('sendCredentialsUseCase delega al repositorio', async () => {
    const repository = buildRepository();
    repository.sendCredentials.mockResolvedValue({ success: true });
    const useCases = createCommunicationsUseCases(repository);

    const result = await useCases.sendCredentialsUseCase.execute({
      userData: { email: 'ana@demo.com' },
    });

    expect(repository.sendCredentials).toHaveBeenCalledWith({ email: 'ana@demo.com' });
    expect(result).toEqual({ success: true });
  });

  it('sendPaymentConfirmationUseCase envuelve errores genericos', async () => {
    const repository = buildRepository();
    repository.sendPaymentConfirmation.mockRejectedValue(new Error('boom'));
    const useCases = createCommunicationsUseCases(repository);

    await expect(
      useCases.sendPaymentConfirmationUseCase.execute({
        paymentData: { id: 'p1' },
      })
    ).rejects.toBeInstanceOf(CommunicationsError);
  });
});
