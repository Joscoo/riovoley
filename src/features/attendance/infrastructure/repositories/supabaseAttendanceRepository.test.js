jest.mock('../../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../../../../config/supabase');
const { AttendanceError } = require('../../domain/attendanceError');
const { SupabaseAttendanceRepository } = require('./supabaseAttendanceRepository');

const createQueryBuilder = (result) => {
  const builder = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    in: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    single: jest.fn(() => Promise.resolve(result)),
    insert: jest.fn(() => Promise.resolve(result)),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    then: (resolve) => resolve(result),
  };
  return builder;
};

describe('SupabaseAttendanceRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listAttendances aplica filtros de fecha y atleta', async () => {
    const builder = createQueryBuilder({
      data: [{ id: 'att-1', student_id: 'st-1' }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseAttendanceRepository();
    const result = await repository.listAttendances({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-10',
      studentIds: ['st-1'],
      studentId: 'st-1',
    });

    expect(builder.gte).toHaveBeenCalledWith('fecha', '2026-05-01');
    expect(builder.lte).toHaveBeenCalledWith('fecha', '2026-05-10');
    expect(builder.in).toHaveBeenCalledWith('student_id', ['st-1']);
    expect(builder.eq).toHaveBeenCalledWith('student_id', 'st-1');
    expect(result).toHaveLength(1);
  });

  it('listAthletesWithRole lanza AttendanceError cuando falla consulta', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: { message: 'query failed' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseAttendanceRepository();
    await expect(repository.listAthletesWithRole()).rejects.toBeInstanceOf(AttendanceError);
  });

  it('findAttendanceByStudentAndDate retorna null cuando no existe registro', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseAttendanceRepository();
    const result = await repository.findAttendanceByStudentAndDate('st-1', '2026-05-10');

    expect(builder.maybeSingle).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('deleteAttendancesByDate lanza AttendanceError ante error de supabase', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: { message: 'delete failed' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseAttendanceRepository();
    await expect(repository.deleteAttendancesByDate('2026-05-10')).rejects.toBeInstanceOf(AttendanceError);
  });
});
