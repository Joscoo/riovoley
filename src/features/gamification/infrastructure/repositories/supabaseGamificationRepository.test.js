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
    neq: jest.fn(() => builder),
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

  it('replaceXpLedger no reinserta daily_login preservado ni ids generados', async () => {
    const deleteBuilder = createQueryBuilder({ data: [], error: null });
    const insertBuilder = createQueryBuilder({ data: [{ source_type: 'attendance' }], error: null });
    supabase.from
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(insertBuilder);

    const repository = new SupabaseGamificationRepository();
    await repository.replaceXpLedger('s1', [
      { id: 'keep-me-out', student_id: 's1', source_type: 'daily_login', xp_delta: 8 },
      { id: 'strip-id', student_id: 's1', source_type: 'attendance', xp_delta: 35 },
    ]);

    expect(deleteBuilder.eq).toHaveBeenCalledWith('student_id', 's1');
    expect(deleteBuilder.neq).toHaveBeenCalledWith('source_type', 'daily_login');
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      { student_id: 's1', source_type: 'attendance', xp_delta: 35 },
    ]);
  });

  it('replaceLeaderboardSnapshots elimina columnas no persistidas antes de insertar', async () => {
    const deleteBuilder = createQueryBuilder({ data: [], error: null });
    const insertBuilder = createQueryBuilder({ data: [{ student_id: 's1' }], error: null });
    supabase.from
      .mockReturnValueOnce(deleteBuilder)
      .mockReturnValueOnce(insertBuilder);

    const repository = new SupabaseGamificationRepository();
    await repository.replaceLeaderboardSnapshots({
      category: 'iniciacion_hombres',
      snapshotDate: '2026-06-12',
      rows: [{
        id: 'row-1',
        student_id: 's1',
        categoria: 'iniciacion_hombres',
        age_band: 'menor',
        score: 250,
        current_level: 2,
        rank_position: 1,
        snapshot_date: '2026-06-12',
        public_alias: 'Leo P',
        leaderboard_type: 'overall',
        metric_key: 'total_xp',
        updated_at: '2026-06-12T12:00:00.000Z',
      }],
    });

    expect(insertBuilder.insert).toHaveBeenCalledWith([{
      student_id: 's1',
      categoria: 'iniciacion_hombres',
      age_band: 'menor',
      score: 250,
      current_level: 2,
      rank_position: 1,
      snapshot_date: '2026-06-12',
      updated_at: '2026-06-12T12:00:00.000Z',
    }]);
  });

  it('listCategoryLeaderboard lanza GamificationError cuando falla la consulta', async () => {
    const builder = createQueryBuilder({ data: null, error: { message: 'leaderboard failed' } });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseGamificationRepository();
    await expect(repository.listCategoryLeaderboard({ category: 'iniciacion_hombres', ageBand: 'menor', limit: 5 })).rejects.toBeInstanceOf(GamificationError);
  });
});
