jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

jest.mock('../../../../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../../../../utils/piiCrypto', () => ({
  withEncryptedUserContactFields: jest.fn(async (payload) => payload),
}));

jest.mock('../../../../utils/athleteValidation', () => ({
  MIN_ATHLETE_AGE: 12,
  validateAthleteBirthDate: jest.fn(),
}));

const { supabase } = require('../../../../config/supabase');
const { validateAthleteBirthDate } = require('../../../../utils/athleteValidation');
const { SupabaseUserProvisioningRepository } = require('./supabaseUserProvisioningRepository');

describe('SupabaseUserProvisioningRepository', () => {
  const payload = { user_id: 'uuid-1', email: 'demo@riovoley.com', nombre: 'Demo' };

  const mockPasswordUpdate = () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
    supabase.from.mockReturnValue({ update: () => ({ eq: async () => ({ error: null }) }) });
    supabase.functions.invoke.mockImplementation(async (name) => name === 'update-user-password'
      ? { data: { success: true }, error: null }
      : { data: { success: false, message: 'Dominio de correo no verificado' }, error: null });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createStudent falla cuando la fecha no cumple validacion de edad', async () => {
    validateAthleteBirthDate.mockReturnValue({
      isValid: false,
      error: 'Edad minima no cumplida',
    });

    const repository = new SupabaseUserProvisioningRepository();

    await expect(
      repository.createStudent({
        email: 'student@riovoley.com',
        nombre: 'Test',
        apellido: 'Student',
        fecha_nacimiento: '2020-01-01',
        categoria: 'iniciacion_hombres',
      }),
    ).rejects.toThrow('Edad minima no cumplida');

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('resendCredentials falla cuando no hay user_id', async () => {
    const repository = new SupabaseUserProvisioningRepository();

    await expect(
      repository.resendCredentials({
        email: 'demo@riovoley.com',
      }),
    ).rejects.toThrow('No se encontro el identificador del usuario');
  });

  it('resendCredentials falla cuando no hay token de sesión', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const repository = new SupabaseUserProvisioningRepository();

    await expect(
      repository.resendCredentials({
        user_id: 'uuid-1',
        email: 'demo@riovoley.com',
      }),
    ).rejects.toThrow('No se encontro un token de sesión valido');
  });

  it('resendCredentials traduce error funcional de edge function', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    });
    supabase.functions.invoke.mockResolvedValue({
      data: { success: false, code: 'AUTH_REQUIRED' },
      error: null,
    });

    const repository = new SupabaseUserProvisioningRepository();

    await expect(
      repository.resendCredentials({
        user_id: 'uuid-1',
        email: 'demo@riovoley.com',
      }),
    ).rejects.toThrow('Tu sesión expiro o no es valida');
  });

  it('conserva las credenciales y comunica el fallo real cuando el proveedor rechaza el correo', async () => {
    mockPasswordUpdate();
    const result = await new SupabaseUserProvisioningRepository().resendCredentials(payload);
    expect(result.emailSent).toBe(false);
    expect(result.emailError).toContain('Dominio de correo no verificado');
    expect(result.message).not.toContain('Email enviado exitosamente');
    expect(result.credentials.password).toBeTruthy();
  });

  it('no envia correo cuando solo se solicita WhatsApp', async () => {
    mockPasswordUpdate();
    await new SupabaseUserProvisioningRepository().resendCredentials({ ...payload, channels: ['whatsapp'] });
    expect(supabase.functions.invoke.mock.calls.filter(([name]) => name === 'send-email')).toHaveLength(0);
  });

  it('recupera el mensaje de error HTTP del backend antes de intentar enviar', async () => {
    mockPasswordUpdate();
    supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code', context: {
        status: 403, json: async () => ({ code: 'ROLE_NOT_ALLOWED', message: 'Sin permisos' }),
      } },
    });
    await expect(new SupabaseUserProvisioningRepository().resendCredentials(payload)).rejects.toThrow(/permisos/i);
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it('envia al email de Auth confirmado por el backend y evita actualizar primer ingreso dos veces', async () => {
    mockPasswordUpdate();
    supabase.functions.invoke.mockImplementation(async (name) => ({ error: null, data: name === 'update-user-password'
      ? { success: true, email: 'correct@example.com', firstLoginUpdated: true }
      : { success: true, messageId: 'email-1' } }));
    const result = await new SupabaseUserProvisioningRepository().resendCredentials(payload);
    expect(result.credentials.email).toBe('correct@example.com');
    expect(supabase.functions.invoke.mock.calls.find(([name]) => name === 'send-email')[1].body.to).toBe('correct@example.com');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('un error de red al marcar primer ingreso no oculta una contrasena ya actualizada', async () => {
    mockPasswordUpdate();
    supabase.from.mockImplementation(() => { throw new Error('network error'); });
    const result = await new SupabaseUserProvisioningRepository().resendCredentials(payload);
    expect(result.credentials.password).toBeTruthy();
    expect(result.firstLoginUpdated).toBe(false);
  });
});
