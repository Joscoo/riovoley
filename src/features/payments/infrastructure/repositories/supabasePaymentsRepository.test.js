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
      data: { id: 'payment-1', monto: 20 },
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabasePaymentsRepository();
    const result = await repository.createPayment({ monto: 20 });

    expect(builder.insert).toHaveBeenCalledWith({ monto: 20 });
    expect(result.id).toBe('payment-1');
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
