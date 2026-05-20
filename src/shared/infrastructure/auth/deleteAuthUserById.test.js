jest.mock('../../../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const { supabase } = require('../../../config/supabase');
const { deleteAuthUserById } = require('./deleteAuthUserById');

describe('deleteAuthUserById Edge Function contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna envelope exitoso cuando delete-auth-user responde success=true', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token-123' } },
    });
    supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        code: 'AUTH_USER_DELETED',
        message: 'Usuario eliminado de Auth exitosamente',
        details: null,
        data: {},
      },
      error: null,
    });

    const result = await deleteAuthUserById('user-1');

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'delete-auth-user',
      expect.objectContaining({
        body: { userId: 'user-1' },
        headers: { Authorization: 'Bearer token-123' },
      }),
    );
    expect(result).toMatchObject({
      success: true,
      code: 'AUTH_USER_DELETED',
      message: 'Usuario eliminado de Auth exitosamente',
    });
  });

  it('traduce AUTH_REQUIRED a mensaje legible', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token-123' } },
    });
    supabase.functions.invoke.mockResolvedValue({
      data: {
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Missing bearer token',
        details: null,
        data: null,
      },
      error: null,
    });

    await expect(deleteAuthUserById('user-1')).rejects.toThrow(
      'Tu sesión expiro o no es valida. Inicia sesión nuevamente e intenta otra vez.',
    );
  });
});
