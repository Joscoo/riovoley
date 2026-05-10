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

  it('resendCredentials falla cuando no hay token de sesion', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const repository = new SupabaseUserProvisioningRepository();

    await expect(
      repository.resendCredentials({
        user_id: 'uuid-1',
        email: 'demo@riovoley.com',
      }),
    ).rejects.toThrow('No se encontro un token de sesion valido');
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
    ).rejects.toThrow('Tu sesion expiro o no es valida');
  });
});
