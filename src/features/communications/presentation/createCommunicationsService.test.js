jest.mock('../infrastructure/repositories/supabaseCommunicationsRepository', () => ({
  SupabaseCommunicationsRepository: jest.fn().mockImplementation(() => ({
    sendCredentials: jest.fn(),
    sendPaymentConfirmation: jest.fn(),
    sendPasswordReset: jest.fn(),
  })),
}));

const { createCommunicationsService } = require('./createCommunicationsService');

describe('createCommunicationsService', () => {
  it('delega sendCredentials al repositorio', async () => {
    const payload = { email: 'demo@riovoley.com', password: '123456' };
    const repository = {
      sendCredentials: jest.fn().mockResolvedValue({ success: true }),
      sendPaymentConfirmation: jest.fn(),
      sendPasswordReset: jest.fn(),
    };

    const service = createCommunicationsService(repository);
    const result = await service.sendCredentials(payload);

    expect(repository.sendCredentials).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true });
  });

  it('delega sendPaymentConfirmation al repositorio', async () => {
    const payload = { email: 'demo@riovoley.com', monto: 20 };
    const repository = {
      sendCredentials: jest.fn(),
      sendPaymentConfirmation: jest.fn().mockResolvedValue({ success: true }),
      sendPasswordReset: jest.fn(),
    };

    const service = createCommunicationsService(repository);
    const result = await service.sendPaymentConfirmation(payload);

    expect(repository.sendPaymentConfirmation).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true });
  });

  it('delega sendPasswordReset al repositorio', async () => {
    const payload = { email: 'demo@riovoley.com' };
    const repository = {
      sendCredentials: jest.fn(),
      sendPaymentConfirmation: jest.fn(),
      sendPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    };

    const service = createCommunicationsService(repository);
    const result = await service.sendPasswordReset(payload);

    expect(repository.sendPasswordReset).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true });
  });
});
