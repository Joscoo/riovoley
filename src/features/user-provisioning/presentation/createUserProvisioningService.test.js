jest.mock('../infrastructure/repositories/supabaseUserProvisioningRepository', () => ({
  SupabaseUserProvisioningRepository: jest.fn().mockImplementation(() => ({
    createUser: jest.fn(),
    createStudent: jest.fn(),
    resendCredentials: jest.fn(),
  })),
}));

const { createUserProvisioningService } = require('./createUserProvisioningService');

describe('createUserProvisioningService', () => {
  it('delega createUser al repositorio', async () => {
    const payload = { email: 'demo@riovoley.com' };
    const repository = {
      createUser: jest.fn().mockResolvedValue({ success: true }),
      createStudent: jest.fn(),
      resendCredentials: jest.fn(),
    };

    const service = createUserProvisioningService(repository);
    const result = await service.createUser(payload);

    expect(repository.createUser).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true });
  });

  it('delega createStudent al repositorio', async () => {
    const payload = { email: 'student@riovoley.com', categoria: 'iniciacion_hombres' };
    const repository = {
      createUser: jest.fn(),
      createStudent: jest.fn().mockResolvedValue({ success: true }),
      resendCredentials: jest.fn(),
    };

    const service = createUserProvisioningService(repository);
    const result = await service.createStudent(payload);

    expect(repository.createStudent).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true });
  });

  it('delega resendCredentials al repositorio', async () => {
    const payload = { user_id: 'uuid-1', email: 'user@riovoley.com' };
    const repository = {
      createUser: jest.fn(),
      createStudent: jest.fn(),
      resendCredentials: jest.fn().mockResolvedValue({ success: true, emailSent: true }),
    };

    const service = createUserProvisioningService(repository);
    const result = await service.resendCredentials(payload);

    expect(repository.resendCredentials).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, emailSent: true });
  });
});
