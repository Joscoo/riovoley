jest.mock('../../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../../../../config/supabase');
const { GamificationError } = require('../../domain/gamificationError');
const { SupabaseGamificationRepository } = require('./supabaseGamificationRepository');

const createQueryBuilder = (result) => {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    in: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return builder;
};

describe('SupabaseGamificationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findStudentByUserId retorna estudiante cuando existe', async () => {
    const builder = createQueryBuilder({
      data: { id: 's1', user_id: 'u1' },
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseGamificationRepository();
    const result = await repository.findStudentByUserId('u1');

    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result.id).toBe('s1');
  });

  it('getProfile retorna null cuando no hay filas', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: { code: 'PGRST116', message: '0 rows' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseGamificationRepository();
    const result = await repository.getProfile('s1');

    expect(result).toBeNull();
  });

  it('replaceRewardEvents elimina y luego inserta eventos', async () => {
    const deleteBuilder = createQueryBuilder({ data: [], error: null });
    const insertBuilder = createQueryBuilder({ data: [{ id: 'e1' }], error: null });
    supabase.from
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(insertBuilder);

    const repository = new SupabaseGamificationRepository();
    const result = await repository.replaceRewardEvents('s1', [{ student_id: 's1', source_type: 'physical_test', event_type: 'physical_test_recorded' }]);

    expect(deleteBuilder.eq).toHaveBeenCalledWith('student_id', 's1');
    expect(insertBuilder.insert).toHaveBeenCalledWith([{ student_id: 's1', source_type: 'physical_test', event_type: 'physical_test_recorded' }]);
    expect(result).toEqual([{ id: 'e1' }]);
  });

  it('listCategoryLeaderboard lanza GamificationError cuando falla la consulta', async () => {
    const builder = createQueryBuilder({ data: null, error: { message: 'leaderboard failed' } });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseGamificationRepository();
    await expect(repository.listCategoryLeaderboard({ category: 'iniciacion_hombres', ageBand: 'menor', limit: 5 })).rejects.toBeInstanceOf(GamificationError);
  });
});
