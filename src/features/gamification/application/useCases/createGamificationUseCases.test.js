const { createGamificationUseCases } = require('./createGamificationUseCases');

describe('createGamificationUseCases', () => {
  const buildRepository = () => ({
    findStudentByUserId: jest.fn(),
    findStudentById: jest.fn(),
    listPhysicalTests: jest.fn(),
    listAttendances: jest.fn(),
    listPayments: jest.fn(),
    getProfile: jest.fn(),
    upsertProfile: jest.fn(),
    listAchievementCatalog: jest.fn(),
    listStudentAchievements: jest.fn(),
    replaceRewardEvents: jest.fn(),
    replaceStudentAchievements: jest.fn(),
    listActiveChallenges: jest.fn(),
    listStudentChallengeProgress: jest.fn(),
    replaceChallengeProgress: jest.fn(),
    listStudentsByCategory: jest.fn(),
    listProfilesByStudentIds: jest.fn(),
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
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, fuerza_abdomen: 20 },
      { id: 't2', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, fuerza_abdomen: 32 },
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
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listCategoryLeaderboard.mockResolvedValue([
      { student_id: 's1', categoria: 'iniciacion_hombres', age_band: 'menor', score: 420, current_level: 2, rank_position: 1, snapshot_date: '2026-06-07', public_alias: 'L*** P' },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

    expect(result.status.source).toBe('derived');
    expect(result.profile.totalXp).toBeGreaterThan(0);
    expect(result.profile.summary.totalPayments).toBe(2);
    expect(result.profile.progressPctToNextLevel).toBeGreaterThanOrEqual(0);
    expect(result.achievements.some((achievement) => achievement.achievementSlug === 'first_test')).toBe(true);
    expect(result.achievements.some((achievement) => achievement.achievementSlug === 'first_payment')).toBe(true);
    expect(result.lockedAchievements.some((achievement) => achievement.isUnlocked === false)).toBe(true);
    expect(result.challenges).toHaveLength(5);
    expect(result.leaderboard[0]).toMatchObject({ publicAlias: 'L*** P', isCurrentStudent: true });
  });

  it('processPhysicalTestRecordedUseCase persiste perfil y proyecciones derivadas', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-04-01', brazo_extend_con_impulso: 40, fuerza_abdomen: 20 },
      { id: 't2', fecha_test: '2026-05-01', brazo_extend_con_impulso: 43, fuerza_abdomen: 25 },
      { id: 't3', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, fuerza_abdomen: 31 },
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
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listProfilesByStudentIds.mockResolvedValue([
      { student_id: 's1', total_xp: 680, current_level: 3 },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.processPhysicalTestRecordedUseCase.execute({ studentId: 's1', testId: 't3' });

    expect(repository.upsertProfile).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 's1',
      current_level: expect.any(Number),
      total_xp: expect.any(Number),
    }));
    expect(repository.replaceRewardEvents).toHaveBeenCalledWith('s1', expect.any(Array));
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
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, fuerza_abdomen: 20 },
      { id: 't2', fecha_test: '2026-06-01', brazo_extend_con_impulso: 46, fuerza_abdomen: 32 },
    ]);
    repository.listAttendances.mockResolvedValue([{ id: 'a1', fecha: '2026-06-02' }]);
    repository.listPayments.mockResolvedValue([{ id: 'p1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo' }]);
    repository.getProfile.mockResolvedValue(null);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listCategoryLeaderboard.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([
      buildStudent(),
      {
        id: 's2',
        categoria: 'iniciacion_hombres',
        fecha_nacimiento: '2011-03-11',
        users: { nombre: 'Ian', apellido: 'Lopez', fecha_nacimiento: '2011-03-11' },
      },
    ]);
    repository.listProfilesByStudentIds.mockResolvedValue([
      { student_id: 's2', total_xp: 150, current_level: 1 },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

    expect(result.leaderboard.length).toBeGreaterThan(0);
    expect(result.leaderboard.some((entry) => entry.isCurrentStudent)).toBe(true);
  });

  it('loadStudentGamificationByStudentIdUseCase tolera repositorio sin listAttendances', async () => {
    const repository = buildRepository();
    delete repository.listAttendances;
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, fuerza_abdomen: 20 },
    ]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue(null);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listCategoryLeaderboard.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listProfilesByStudentIds.mockResolvedValue([]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

    expect(result.profile).toBeTruthy();
    expect(result.leaderboard.some((entry) => entry.isCurrentStudent)).toBe(true);
  });
});
