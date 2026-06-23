jest.mock('../../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

const { supabase } = require('../../../../config/supabase');
const { StudentDashboardError } = require('../../domain/studentDashboardError');
const { SupabaseStudentDashboardRepository } = require('./supabaseStudentDashboardRepository');

const createQueryBuilder = (result) => {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return builder;
};

describe('SupabaseStudentDashboardRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findStudentByUserId retorna estudiante cuando existe', async () => {
    const builder = createQueryBuilder({
      data: { id: 'st-1', user_id: 'u-1' },
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseStudentDashboardRepository();
    const result = await repository.findStudentByUserId('u-1');

    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u-1');
    expect(result.id).toBe('st-1');
  });

  it('listCurrentPayments filtra por fechas y retorna lista', async () => {
    const builder = createQueryBuilder({
      data: [{ id: 'p-1' }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseStudentDashboardRepository();
    const result = await repository.listCurrentPayments('st-1', '2026-05-10');

    expect(builder.eq).toHaveBeenCalledWith('student_id', 'st-1');
    expect(builder.lte).toHaveBeenCalledWith('fecha_inicio', '2026-05-10');
    expect(builder.gte).toHaveBeenCalledWith('fecha_fin', '2026-05-10');
    expect(Array.isArray(result)).toBe(true);
  });

  it('listPaymentsByStudentId lanza StudentDashboardError cuando falla consulta', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: { message: 'payments failed' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseStudentDashboardRepository();
    await expect(repository.listPaymentsByStudentId('st-1')).rejects.toBeInstanceOf(StudentDashboardError);
  });

  it('listAttendancesFromDate retorna [] cuando no hay asistencias', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseStudentDashboardRepository();
    const result = await repository.listAttendancesFromDate('st-1', '2026-05-01');

    expect(result).toEqual([]);
  });

  it('subscribeToPaymentChanges crea una suscripcion filtrada por estudiante', () => {
    const unsubscribe = jest.fn();
    const subscribe = jest.fn(() => ({ unsubscribe }));
    const on = jest.fn(() => ({ subscribe }));
    supabase.channel.mockReturnValue({ on });

    const repository = new SupabaseStudentDashboardRepository();
    const onChange = jest.fn();
    const dispose = repository.subscribeToPaymentChanges('st-1', onChange);

    expect(supabase.channel).toHaveBeenCalledWith('student-dashboard-payments-st-1');
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: 'student_id=eq.st-1',
      },
      onChange
    );

    dispose();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
