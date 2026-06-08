const { createGamificationUseCases } = require('./createGamificationUseCases');

describe('createGamificationUseCases', () => {
  const buildRepository = () => ({
    findStudentByUserId: jest.fn(),
    findStudentById: jest.fn(),
    listPhysicalTests: jest.fn(),
    listPhysicalTestsByStudentIds: jest.fn(),
    listAttendances: jest.fn(),
    listAttendancesByStudentIds: jest.fn(),
    listPayments: jest.fn(),
    listPaymentsByStudentIds: jest.fn(),
    getProfile: jest.fn(),
    getIdentity: jest.fn(),
    upsertProfile: jest.fn(),
    upsertIdentity: jest.fn(),
    listAchievementCatalog: jest.fn(),
    listTitleCatalog: jest.fn(),
    listStudentAchievements: jest.fn(),
    replaceRewardEvents: jest.fn(),
    listXpLedger: jest.fn(),
    appendXpLedgerEntry: jest.fn(),
    replaceXpLedger: jest.fn(),
    getLoginRewardState: jest.fn(),
    upsertLoginRewardState: jest.fn(),
    replaceStudentAchievements: jest.fn(),
    listActiveChallenges: jest.fn(),
    listStudentChallengeProgress: jest.fn(),
    replaceChallengeProgress: jest.fn(),
    listStudentsByCategory: jest.fn(),
    listProfilesByStudentIds: jest.fn(),
    listIdentitiesByStudentIds: jest.fn(),
    replaceLeaderboardSnapshots: jest.fn(),
    listCategoryLeaderboard: jest.fn(),
  });

  const buildStudent = () => ({
    id: 's1',
    categoria: 'iniciacion_hombres',
    fecha_nacimiento: '2012-05-10',
    users: { nombre: 'Leo', apellido: 'Perez', fecha_nacimiento: '2012-05-10' },
  });

  const buildDeps = () => ({
    getEcuadorDate: jest.fn(() => '2026-06-07'),
    getEcuadorISOString: jest.fn(() => '2026-06-07T12:00:00.000Z'),
  });

  it('loadStudentGamificationByStudentIdUseCase deriva progreso cuando no existe perfil persistido', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
      { id: 't2', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 32, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 190 },
    ]);
    repository.listAttendances.mockResolvedValue([
      { id: 'a1', fecha: '2026-06-02' },
      { id: 'a2', fecha: '2026-06-04' },
    ]);
    repository.listPayments.mockResolvedValue([
      { id: 'p1', fecha_inicio: '2026-05-01', fecha_pago: '2026-05-01', estado: 'activo' },
      { id: 'p2', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo' },
    ]);
    repository.getProfile.mockResolvedValue(null);
    repository.getIdentity.mockResolvedValue({ student_id: 's1', nickname: 'RayoLeo', selected_title_slug: 'primer_impulso' });
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCategoryLeaderboard.mockResolvedValue([
      { student_id: 's1', categoria: 'iniciacion_hombres', age_band: 'menor', score: 420, current_level: 2, rank_position: 1, snapshot_date: '2026-06-07', public_alias: 'L*** P' },
    ]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([
      { student_id: 's1', nickname: 'RayoLeo', selected_title_slug: 'primer_impulso' },
    ]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
      { id: 't2', student_id: 's1', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 32, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 190 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-06-02' },
      { id: 'a2', student_id: 's1', fecha: '2026-06-04' },
    ]);
    repository.listPaymentsByStudentIds.mockResolvedValue([
      { id: 'p1', student_id: 's1', fecha_inicio: '2026-05-01', fecha_pago: '2026-05-01', estado: 'activo' },
      { id: 'p2', student_id: 's1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo' },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

    expect(result.status.source).toBe('derived');
    expect(result.profile.totalXp).toBeGreaterThan(0);
    expect(result.profile.summary.totalPayments).toBe(2);
    expect(result.profile.progressPctToNextLevel).toBeGreaterThanOrEqual(0);
    expect(result.profile.summary.weekdayAttendanceStreak).toBe(1);
    expect(result.achievements.some((achievement) => achievement.achievementSlug === 'first_test')).toBe(true);
    expect(result.achievements.some((achievement) => achievement.achievementSlug === 'first_payment')).toBe(true);
    expect(result.lockedAchievements.some((achievement) => achievement.isUnlocked === false)).toBe(true);
    expect(result.challenges).toHaveLength(5);
    expect(result.leaderboard[0]).toMatchObject({ publicAlias: 'RayoLeo', isCurrentStudent: true });
    expect(result.identity).toMatchObject({
      nickname: 'RayoLeo',
      displayName: 'RayoLeo',
      selectedTitleSlug: 'primer_impulso',
    });
    expect(result.leaderboard[0].equippedTitle?.slug).toBe('primer_impulso');
    expect(result.leaderboards.some((board) => board.type === 'attendance_total')).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.upcomingChallenges.length).toBeGreaterThan(0);
    expect(result.xpLedger.some((entry) => entry.sourceType === 'attendance')).toBe(true);
  });

  it('processPhysicalTestRecordedUseCase persiste perfil y proyecciones derivadas', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-04-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
      { id: 't2', fecha_test: '2026-05-01', brazo_extend_con_impulso: 43, brazo_extend_sin_impulso: 37, fuerza_abdomen: 25, elevaciones_barra: 4, fuerza_explosiva_salto_largo: 188 },
      { id: 't3', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 31, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 194 },
    ]);
    repository.listAttendances.mockResolvedValue([
      { id: 'a1', fecha: '2026-04-02' },
      { id: 'a2', fecha: '2026-05-03' },
      { id: 'a3', fecha: '2026-06-05' },
    ]);
    repository.listPayments.mockResolvedValue([
      { id: 'p1', fecha_inicio: '2026-04-01', fecha_pago: '2026-04-01', estado: 'activo' },
      { id: 'p2', fecha_inicio: '2026-05-01', fecha_pago: '2026-05-01', estado: 'activo' },
      { id: 'p3', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'proximo_a_vencer' },
    ]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-04-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
      { id: 't2', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 43, brazo_extend_sin_impulso: 37, fuerza_abdomen: 25, elevaciones_barra: 4, fuerza_explosiva_salto_largo: 188 },
      { id: 't3', student_id: 's1', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 31, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 194 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-04-02' },
      { id: 'a2', student_id: 's1', fecha: '2026-05-03' },
      { id: 'a3', student_id: 's1', fecha: '2026-06-05' },
    ]);
    repository.listPaymentsByStudentIds.mockResolvedValue([
      { id: 'p1', student_id: 's1', fecha_inicio: '2026-04-01', fecha_pago: '2026-04-01', estado: 'activo' },
      { id: 'p2', student_id: 's1', fecha_inicio: '2026-05-01', fecha_pago: '2026-05-01', estado: 'activo' },
      { id: 'p3', student_id: 's1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'proximo_a_vencer' },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.processPhysicalTestRecordedUseCase.execute({ studentId: 's1', testId: 't3' });

    expect(repository.upsertProfile).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 's1',
      current_level: expect.any(Number),
      total_xp: expect.any(Number),
    }));
    expect(repository.replaceRewardEvents).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceXpLedger).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceStudentAchievements).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceChallengeProgress).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceLeaderboardSnapshots).toHaveBeenCalledWith(expect.objectContaining({
      category: 'iniciacion_hombres',
      rows: expect.any(Array),
    }));
    expect(result.studentId).toBe('s1');
  });

  it('loadStudentGamificationByStudentIdUseCase construye ranking derivado cuando no hay snapshot publico', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
      { id: 't2', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 32, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 190 },
    ]);
    repository.listAttendances.mockResolvedValue([{ id: 'a1', fecha: '2026-06-02' }]);
    repository.listPayments.mockResolvedValue([{ id: 'p1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo' }]);
    repository.getProfile.mockResolvedValue(null);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCategoryLeaderboard.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([
      buildStudent(),
      {
        id: 's2',
        categoria: 'iniciacion_hombres',
        fecha_nacimiento: '2011-03-11',
        users: { nombre: 'Ian', apellido: 'Lopez', fecha_nacimiento: '2011-03-11' },
      },
      {
        id: 's3',
        categoria: 'iniciacion_hombres',
        fecha_nacimiento: '2013-02-18',
        users: { nombre: 'Noa', apellido: 'Mena', fecha_nacimiento: '2013-02-18' },
      },
    ]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
      { id: 't2', student_id: 's1', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 32, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 190 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-06-02' },
      { id: 'a2', student_id: 's3', fecha: '2026-06-03' },
      { id: 'a3', student_id: 's3', fecha: '2026-06-05' },
    ]);
    repository.listPaymentsByStudentIds.mockResolvedValue([
      { id: 'p1', student_id: 's1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo' },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

    expect(result.leaderboard.length).toBeGreaterThan(0);
    expect(result.leaderboard.some((entry) => entry.isCurrentStudent)).toBe(true);
    expect(result.leaderboards.find((board) => board.type === 'attendance_total')?.rows.some((entry) => entry.studentId === 's3')).toBe(true);
  });

  it('loadStudentGamificationByStudentIdUseCase tolera repositorio sin listAttendances', async () => {
    const repository = buildRepository();
    delete repository.listAttendances;
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue(null);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCategoryLeaderboard.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

    expect(result.profile).toBeTruthy();
    expect(result.leaderboard.some((entry) => entry.isCurrentStudent)).toBe(true);
  });

  it('listCategoryLeaderboardsUseCase retorna todas las tablas formateadas de una categoria', async () => {
    const repository = buildRepository();
    repository.listStudentsByCategory.mockResolvedValue([
      buildStudent(),
      {
        id: 's2',
        categoria: 'iniciacion_hombres',
        fecha_nacimiento: '2011-03-11',
        users: { nombre: 'Ian', apellido: 'Lopez', fecha_nacimiento: '2011-03-11' },
      },
    ]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, brazo_extend_sin_impulso: 40, fuerza_abdomen: 32, elevaciones_barra: 5, fuerza_explosiva_salto_largo: 190 },
      { id: 't2', student_id: 's2', fecha_test: '2026-06-02', brazo_extend_con_impulso: 49, brazo_extend_sin_impulso: 41, fuerza_abdomen: 28, elevaciones_barra: 4, fuerza_explosiva_salto_largo: 185 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-06-03' },
      { id: 'a2', student_id: 's2', fecha: '2026-06-04' },
      { id: 'a3', student_id: 's2', fecha: '2026-06-05' },
    ]);
    repository.listPaymentsByStudentIds.mockResolvedValue([
      { id: 'p1', student_id: 's1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo' },
      { id: 'p2', student_id: 's2', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-02', estado: 'activo' },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.listCategoryLeaderboardsUseCase.execute({
      category: 'iniciacion_hombres',
      ageBand: 'menor',
      limit: 4,
    });

    expect(result.length).toBeGreaterThan(3);
    expect(result.find((board) => board.type === 'overall')?.rows[0]).toMatchObject({
      publicAlias: 'Ian Lopez',
      rankPosition: 1,
    });
    expect(result.find((board) => board.type === 'attendance_total')?.rows[0]).toMatchObject({
      publicAlias: 'Ian Lopez',
      score: 2,
    });
  });

  it('registerDailyLoginRewardUseCase queda expuesto desde createGamificationUseCases', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue(buildStudent());
    repository.getLoginRewardState.mockResolvedValue(null);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.registerDailyLoginRewardUseCase.execute({ userId: 'u1' });

    expect(result).toMatchObject({ awarded: true, xpDelta: 8 });
    expect(repository.appendXpLedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
      source_type: 'daily_login',
    }));
  });

  it('updateStudentIdentityUseCase permite guardar apodo y titulo desbloqueado', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue(buildStudent());
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendances.mockResolvedValue([]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue(null);
    repository.getIdentity
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        student_id: 's1',
        nickname: 'Capi Leo',
        selected_title_slug: 'primer_impulso',
      });
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([
      { student_id: 's1', nickname: 'Capi Leo', selected_title_slug: 'primer_impulso' },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.updateStudentIdentityUseCase.execute({
      userId: 'u1',
      nickname: 'Capi Leo',
      selectedTitleSlug: 'primer_impulso',
    });

    expect(repository.upsertIdentity).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 's1',
      nickname: 'Capi Leo',
      selected_title_slug: 'primer_impulso',
    }));
    expect(result.identity).toMatchObject({
      nickname: 'Capi Leo',
      displayName: 'Capi Leo',
      selectedTitleSlug: 'primer_impulso',
    });
  });
});
