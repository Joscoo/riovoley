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
    document.body.innerHTML = '';
  });

  it('escapa los datos del destinatario y la contrasena sin alterar el texto que recibe', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: { success: true }, error: null });
    await new SupabaseCommunicationsRepository().sendCredentials({
      email: 'demo@riovoley.com', nombre: '<img src=x onerror=alert(1)>', password: 'Aa123456<&',
    });
    const html = supabase.functions.invoke.mock.calls[0][1].body.html;
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
    expect(html).toContain('Aa123456&lt;&amp;');
  });

  it('devuelve el mensaje HTTP real y no inserta credenciales como HTML en el documento', async () => {
    supabase.functions.invoke.mockResolvedValue({ data: null, error: {
      message: 'Edge Function returned a non-2xx status code',
      context: { status: 502, json: async () => ({ message: 'Proveedor no disponible', code: 'SEND_EMAIL_FAILED' }) },
    } });
    const result = await new SupabaseCommunicationsRepository().sendCredentials({
      email: 'demo@riovoley.com', password: 'Aa123456<&',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Proveedor no disponible');
    expect(document.body.textContent).not.toContain('Aa123456');
  });

  it('no envia credenciales incompletas', async () => {
    const result = await new SupabaseCommunicationsRepository().sendCredentials({ email: 'demo@riovoley.com' });
    expect(result.success).toBe(false);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
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
    expect(result.error).toContain('edge failed');
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
    expect(result).toEqual({ success: false, error: 'reset failed' });
  });
});
