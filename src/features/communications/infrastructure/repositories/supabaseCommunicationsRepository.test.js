jest.mock('../../../../config/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    auth: {
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

const { supabase } = require('../../../../config/supabase');
const { SupabaseCommunicationsRepository } = require('./supabaseCommunicationsRepository');

describe('SupabaseCommunicationsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendCredentials retorna success=true cuando la edge function responde ok', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const repository = new SupabaseCommunicationsRepository();
    const result = await repository.sendCredentials({
      email: 'demo@riovoley.com',
      nombre: 'Demo',
      apellido: 'User',
      password: 'Temp1234!',
    });

    expect(result.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        body: expect.objectContaining({
          to: 'demo@riovoley.com',
        }),
      }),
    );
  });

  it('sendPaymentConfirmation retorna success=false cuando la edge function falla', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'edge failed' },
    });

    const repository = new SupabaseCommunicationsRepository();
    const result = await repository.sendPaymentConfirmation({
      email: 'demo@riovoley.com',
      nombre: 'Demo',
      apellido: 'User',
      monto: 30,
      fecha_inicio: '2026-05-01',
      fecha_fin: '2026-05-31',
      fecha_pago: '2026-05-02',
      estado: 'pagado',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No se pudo completar el envio de comunicacion.');
  });

  it('sendPasswordReset retorna success=false cuando supabase auth devuelve error', async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValue({
      error: { message: 'reset failed' },
    });

    const repository = new SupabaseCommunicationsRepository();
    const result = await repository.sendPasswordReset({
      email: 'demo@riovoley.com',
    });

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalled();
    expect(result).toEqual({ success: false, error: 'No se pudo enviar el enlace de recuperacion.' });
  });

  it('sendCredentials falla cuando el email no es valido', async () => {
    const repository = new SupabaseCommunicationsRepository();
    const result = await repository.sendCredentials({
      email: 'correo-invalido',
      nombre: 'Demo',
      apellido: 'User',
      password: 'Temp1234!',
    });

    expect(result).toEqual({ success: false, error: 'El email proporcionado no es valido.' });
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });
});
