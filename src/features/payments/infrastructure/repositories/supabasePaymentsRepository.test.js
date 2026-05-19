jest.mock('../../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../../../../config/supabase');
const { PaymentsError } = require('../../domain/paymentsError');
const { SupabasePaymentsRepository } = require('./supabasePaymentsRepository');

const createBuilder = (result) => {
  const builder = {
    select: jest.fn(() => builder),
    order: jest.fn(() => Promise.resolve(result)),
    is: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
  };
  return builder;
};

describe('SupabasePaymentsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listAthletes devuelve lista cuando consulta es exitosa', async () => {
    const builder = createBuilder({
      data: [{ id: 1, categoria: 'iniciacion_hombres' }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabasePaymentsRepository();
    const result = await repository.listAthletes();

    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(result).toHaveLength(1);
  });

  it('listMembershipTypes retorna catalogo activo', async () => {
    const builder = createBuilder({
      data: [{ id: 1, code: 'normal', costo: 35 }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabasePaymentsRepository();
    const result = await repository.listMembershipTypes();

    expect(supabase.from).toHaveBeenCalledWith('membership_types');
    expect(builder.eq).toHaveBeenCalledWith('active', true);
    expect(result[0].code).toBe('normal');
  });

  it('listPayments lanza PaymentsError cuando hay error de supabase', async () => {
    const builder = createBuilder({
      data: null,
      error: { message: 'db failed' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabasePaymentsRepository();

    await expect(repository.listPayments()).rejects.toBeInstanceOf(PaymentsError);
    await expect(repository.listPayments()).rejects.toThrow('db failed');
  });

  it('createPayment retorna el pago creado', async () => {
    const builder = createBuilder({
      data: { id: 'payment-1', membership_type_id: 1 },
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabasePaymentsRepository();
    const result = await repository.createPayment({ membership_type_id: 1 });

    expect(builder.insert).toHaveBeenCalledWith({ membership_type_id: 1 });
    expect(result.id).toBe('payment-1');
  });

  it('getPaymentPeriodPreview devuelve payload base cuando se solicita preview', async () => {
    const repository = new SupabasePaymentsRepository();
    const result = await repository.getPaymentPeriodPreview({
      studentId: 'student-1',
      fechaPago: '2026-06-01',
    });

    expect(result).toEqual({
      studentId: 'student-1',
      fecha_pago: '2026-06-01',
    });
  });

  it('getAthleteByStudentId lanza PaymentsError ante error', async () => {
    const builder = createBuilder({
      data: null,
      error: { message: 'not found' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabasePaymentsRepository();

    await expect(repository.getAthleteByStudentId('student-1')).rejects.toBeInstanceOf(PaymentsError);
  });
});
