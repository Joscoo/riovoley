process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

const { createAuthProfileService } = require('./createAuthProfileService');

describe('createAuthProfileService', () => {
  it('loadUserProfile delega al use case con repositorio inyectado', async () => {
    const repository = {
      findUserProfile: jest.fn().mockResolvedValue({ id: 'u1', role: 'administrador' }),
      findCoreUser: jest.fn(),
      upsertUserProfile: jest.fn(),
      createFallbackProfile: jest.fn(),
    };

    const service = createAuthProfileService(repository);
    const result = await service.loadUserProfile({ id: 'u1' });

    expect(repository.findUserProfile).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ id: 'u1', role: 'administrador' });
  });
});
