const { createGamificationUseCases } = require('./createGamificationUseCases');
const {
  AVATAR_STYLE_OPTIONS,
  getAvatarModelMeta,
  getAvatarModelOptions,
  resolveAvatarModelMeta,
} = require('../../domain/avatarCatalog');
const { buildAvatarUrl } = require('../../domain/buildAvatarUrl');

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
    getCurrencyWallet: jest.fn(),
    getAthleteStageCatalog: jest.fn(),
    getCurrentStage: jest.fn(),
    listStageHistory: jest.fn(),
    upsertProfile: jest.fn(),
    upsertIdentity: jest.fn(),
    upsertCurrentStage: jest.fn(),
    insertStageHistory: jest.fn().mockImplementation(async (payload) => ({
      id: 'stage-history-1',
      studentId: payload.studentId,
      stageSlug: payload.stageSlug,
      awardedAt: payload.awardedAt,
      awardedReason: payload.awardedReason,
      metadata: payload.metadata || {},
      createdAt: payload.awardedAt,
    })),
    upsertCurrencyWallet: jest.fn(),
    listAchievementCatalog: jest.fn(),
    listTitleCatalog: jest.fn(),
    listCosmeticCatalog: jest.fn(),
    listStudentAchievements: jest.fn(),
    replaceRewardEvents: jest.fn(),
    listXpLedger: jest.fn(),
    listCurrencyLedger: jest.fn(),
    appendXpLedgerEntry: jest.fn(),
    replaceXpLedger: jest.fn(),
    replaceCurrencyLedger: jest.fn(),
    getLoginRewardState: jest.fn(),
    upsertLoginRewardState: jest.fn(),
    replaceStudentAchievements: jest.fn(),
    listActiveChallenges: jest.fn(),
    listActiveCampaigns: jest.fn(),
    listActiveHiddenRewards: jest.fn(),
    listStudentChallengeProgress: jest.fn(),
    listStudentCampaignProgress: jest.fn(),
    listStudentHiddenRewards: jest.fn(),
    replaceChallengeProgress: jest.fn(),
    replaceCampaignProgress: jest.fn(),
    replaceHiddenRewards: jest.fn(),
    listStudentsByCategory: jest.fn(),
    listProfilesByStudentIds: jest.fn(),
    listIdentitiesByStudentIds: jest.fn(),
    listStudentCosmeticItems: jest.fn(),
    listStudentCosmeticEquipmentByStudentIds: jest.fn(),
    getStudentCosmeticEquipment: jest.fn(),
    purchaseCosmeticItem: jest.fn(),
    equipCosmeticItem: jest.fn(),
    unequipCosmeticItem: jest.fn(),
    uploadProfilePhoto: jest.fn(),
    deleteProfilePhoto: jest.fn(),
    getPublicProfilePhotoUrl: jest.fn((path) => path ? `https://example.supabase.co/storage/v1/object/public/profile-images/${path}` : null),
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
    repository.getIdentity.mockResolvedValue({ student_id: 's1', nickname: 'RayoLeo', selected_title_slug: 'primer_impulso', avatar_style: 'thumbs' });
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.getAthleteStageCatalog.mockResolvedValue([
      { slug: 'semilla', name: 'Semilla', description: 'Base', progress_hint_template: 'Base', sort_order: 10, min_level: 1, min_tests: 0, min_attendances: 0, min_payments: 0, min_achievements: 0, requires_leaderboard_presence: false, is_active: true },
      { slug: 'en_marcha', name: 'En Marcha', description: 'Actividad', progress_hint_template: 'Actividad', sort_order: 20, min_level: 1, min_tests: 1, min_attendances: 4, min_payments: 1, min_achievements: 0, requires_leaderboard_presence: false, is_active: true },
      { slug: 'constante', name: 'Constante', description: 'Ritmo', progress_hint_template: 'Ritmo', sort_order: 30, min_level: 2, min_tests: 2, min_attendances: 8, min_payments: 1, min_achievements: 1, requires_leaderboard_presence: false, is_active: true },
    ]);
    repository.getCurrentStage.mockResolvedValue({ currentStageSlug: 'semilla', progressHint: 'Base', metadata: {} });
    repository.listStageHistory.mockResolvedValue([{ stageSlug: 'semilla', stageName: 'Semilla', awardedAt: '2026-05-01T12:00:00.000Z', awardedReason: 'Ascenso a Semilla', metadata: {} }]);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      { slug: 'frame_bronce_club', name: 'Marco Bronce Club', description: 'Inicial', rarity: 'common', category: 'frame', price_coins: 0 },
      { slug: 'frame_cian_ruta', name: 'Marco Ruta Cian', description: 'Compra', rarity: 'common', category: 'frame', price_coins: 14 },
    ]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listActiveCampaigns.mockResolvedValue([
      {
        slug: 'weekly_attendance_burst',
        name: 'Semana de presencia',
        description: 'Suma 3 asistencias en esta semana.',
        focus_area: 'Constancia',
        window_type: 'weekly',
        target_metric: 'attendance_window',
        target_value: 3,
        reward_label: 'Impulso extra de presencia',
        reward_payload: { xp: 35, coins: 10 },
        hint: 'Te conviene cerrar este bloque antes de que acabe la semana.',
        start_date: '2026-06-01',
        end_date: '2026-06-30',
        is_active: true,
      },
    ]);
    repository.listActiveHiddenRewards.mockResolvedValue([
      {
        slug: 'secret_dual_focus',
        name: 'Doble Enfoque',
        teaser: 'Hay algo oculto cuando combinas progreso fisico y constancia mensual.',
        description: 'Premia una combinacion real de constancia y base fisica.',
        hint: 'Se activa cuando entrenas con constancia y ya tienes base de mediciones.',
        target_metric: 'dual_focus_combo',
        target_value: 2,
        reward_label: 'Huella de progreso mixto',
        reward_payload: { xp: 45, coins: 12 },
        is_active: true,
      },
    ]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listStudentCampaignProgress.mockResolvedValue([]);
    repository.listStudentHiddenRewards.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.listStudentCosmeticItems.mockResolvedValue([
      { student_id: 's1', item_slug: 'frame_bronce_club', acquired_at: '2026-06-07T12:00:00.000Z' },
    ]);
    repository.getStudentCosmeticEquipment.mockResolvedValue({
      student_id: 's1',
      frame_item_slug: 'frame_bronce_club',
    });
    repository.listCategoryLeaderboard.mockResolvedValue([
      { student_id: 's1', categoria: 'iniciacion_hombres', age_band: 'menor', score: 420, current_level: 2, rank_position: 1, snapshot_date: '2026-06-07', public_alias: 'L*** P' },
    ]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listStudentCosmeticEquipmentByStudentIds.mockResolvedValue([
      { student_id: 's1', frame_item_slug: 'frame_bronce_club' },
    ]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([
      { student_id: 's1', nickname: 'RayoLeo', selected_title_slug: 'primer_impulso', avatar_style: 'thumbs' },
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
    expect(result.challenges.length).toBeGreaterThanOrEqual(15);
    expect(result.challenges.some((challenge) => challenge.slug === 'attendance_weekday_chain')).toBe(true);
    expect(result.challenges.some((challenge) => challenge.slug === 'monthly_combo_ready')).toBe(true);
    expect(result.challenges.some((challenge) => challenge.slug === 'competition_overall_top3')).toBe(true);
    expect(result.strategicRoutes.length).toBeGreaterThan(0);
    expect(result.campaigns.length).toBeGreaterThan(0);
    expect(result.discoveredHiddenRewards.length).toBe(0);
    expect(result.hiddenRewardHints.length).toBeGreaterThan(0);
    expect(result.hiddenRewardHints[0]).toMatchObject({
      slug: 'secret_dual_focus',
      rewardLabel: 'Huella de progreso mixto',
    });
    expect(result.surpriseChains.length).toBeGreaterThan(0);
    expect(result.surpriseChains[0]).toMatchObject({
      title: expect.any(String),
      status: expect.any(String),
    });
    expect(result.campaigns[0]).toMatchObject({
      slug: 'weekly_attendance_burst',
      rewardLabel: 'Impulso extra de presencia',
    });
    expect(result.strategicRoutes[0]).toMatchObject({
      priority: 'primary',
    });
    expect(Array.isArray(result.strategicRoutes[0].immediateRewards)).toBe(true);
    expect(result.identity.currentStage).toMatchObject({
      currentStageSlug: 'constante',
      currentStageName: 'Constante',
    });
    expect(result.identity.stageHistory.some((entry) => entry.stageSlug === 'constante')).toBe(true);
    expect(repository.upsertCurrentStage).toHaveBeenCalled();
    expect(repository.replaceCampaignProgress).toHaveBeenCalled();
    expect(repository.replaceHiddenRewards).toHaveBeenCalled();
    expect(repository.insertStageHistory).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 's1',
      stageSlug: 'constante',
    }));
    expect(result.leaderboard[0]).toMatchObject({ publicAlias: 'RayoLeo', isCurrentStudent: true });
    expect(result.identity).toMatchObject({
      nickname: 'RayoLeo',
      displayName: 'RayoLeo',
      selectedTitleSlug: 'primer_impulso',
      avatarStyle: 'thumbs',
    });
    expect(result.currency).toMatchObject({
      balance: expect.any(Number),
      totalEarned: expect.any(Number),
      totalSpent: 0,
    });
    expect(result.cosmetics).toMatchObject({
      inventoryCount: 1,
      equipment: { frame: 'frame_bronce_club' },
    });
    expect(result.leaderboard[0].equippedTitle?.slug).toBe('primer_impulso');
    expect(result.leaderboard[0].equippedCosmeticItems?.frame).toMatchObject({
      slug: 'frame_bronce_club',
      name: 'Marco Bronce Club',
    });
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
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      {
        slug: 'badge_asistencia_top',
        name: 'Insignia Asistencia Top',
        description: 'Prestigio por constancia.',
        rarity: 'epic',
        category: 'badge',
        price_coins: 32,
        metadata: {
          unlockType: 'streak',
          unlockTarget: 3,
          unlockHint: 'Desbloquea al mantener una racha mensual de 3 meses.',
        },
      },
    ]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listActiveCampaigns.mockResolvedValue([]);
    repository.listActiveHiddenRewards.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
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
    expect(repository.upsertCurrencyWallet).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 's1',
      balance: expect.any(Number),
    }));
    expect(repository.replaceCurrencyLedger).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceStudentAchievements).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceChallengeProgress).toHaveBeenCalledWith('s1', expect.any(Array));
    expect(repository.replaceLeaderboardSnapshots).toHaveBeenCalledWith(expect.objectContaining({
      category: 'iniciacion_hombres',
      rows: expect.any(Array),
    }));
    expect(result.studentId).toBe('s1');
  });

  it('refreshStudentProgressUseCase construye currency ledger sin timestamps nulos', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-06-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendances.mockResolvedValue([
      { id: 'a1', fecha: '2026-06-02', created_at: '2026-06-02T12:00:00.000Z' },
    ]);
    repository.listPayments.mockResolvedValue([
      { id: 'p1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo', created_at: '2026-06-01T12:00:00.000Z' },
    ]);
    repository.getProfile.mockResolvedValue(null);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listActiveCampaigns.mockResolvedValue([]);
    repository.listActiveHiddenRewards.mockResolvedValue([]);
    repository.getAthleteStageCatalog.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-06-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-06-02', created_at: '2026-06-02T12:00:00.000Z' },
    ]);
    repository.listPaymentsByStudentIds.mockResolvedValue([
      { id: 'p1', student_id: 's1', fecha_inicio: '2026-06-01', fecha_pago: '2026-06-01', estado: 'activo', created_at: '2026-06-01T12:00:00.000Z' },
    ]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([]);
    repository.listStudentCosmeticEquipmentByStudentIds.mockResolvedValue([]);
    repository.replaceCurrencyLedger.mockResolvedValue([]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    await useCases.refreshStudentProgressUseCase.execute({ studentId: 's1' });

    expect(repository.replaceCurrencyLedger).toHaveBeenCalledWith(
      's1',
      expect.arrayContaining([
        expect.objectContaining({
          source_type: 'level_reward',
          occurred_at: '2026-06-07T12:00:00.000Z',
          created_at: '2026-06-07T12:00:00.000Z',
        }),
      ]),
    );
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
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      {
        slug: 'badge_asistencia_top',
        name: 'Insignia Asistencia Top',
        description: 'Prestigio por constancia.',
        rarity: 'epic',
        category: 'badge',
        price_coins: 32,
        metadata: {
          unlockType: 'streak',
          unlockTarget: 3,
          unlockHint: 'Desbloquea al mantener una racha mensual de 3 meses.',
        },
      },
    ]);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
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
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([]);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
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

  it('listCategoryLeaderboardsUseCase prioriza la categoria aunque reciba un ageBand', async () => {
    const repository = buildRepository();
    repository.listStudentsByCategory.mockResolvedValue([
      buildStudent(),
      {
        id: 's2',
        categoria: 'iniciacion_hombres',
        fecha_nacimiento: '2000-03-11',
        users: { nombre: 'Ian', apellido: 'Lopez', fecha_nacimiento: '2000-03-11' },
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
    repository.listIdentitiesByStudentIds.mockResolvedValue([]);
    repository.listStudentCosmeticEquipmentByStudentIds.mockResolvedValue([
      { student_id: 's2', frame_item_slug: 'frame_cian_ruta' },
    ]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      { slug: 'frame_cian_ruta', name: 'Marco Ruta Cian', rarity: 'common', category: 'frame', metadata: { accent: 'cobalt', frameVariant: 'arc-double' } },
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
    expect(result.find((board) => board.type === 'overall')?.rows[0].equippedCosmeticItems?.frame).toMatchObject({
      slug: 'frame_cian_ruta',
      name: 'Marco Ruta Cian',
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
    repository.listAttendances.mockResolvedValue([
      { id: 'a1', fecha: '2026-06-05' },
    ]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue(null);
    repository.getIdentity
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        student_id: 's1',
        nickname: 'Capi Leo',
        selected_title_slug: 'primer_impulso',
        avatar_style: 'lorelei-neutral',
        avatar_model_slug: 'lorelei-02',
      });
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-06-05' },
    ]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([
      {
        student_id: 's1',
        nickname: 'Capi Leo',
        selected_title_slug: 'primer_impulso',
        avatar_style: 'lorelei-neutral',
        avatar_model_slug: 'lorelei-02',
      },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.updateStudentIdentityUseCase.execute({
      userId: 'u1',
      nickname: 'Capi Leo',
      selectedTitleSlug: 'primer_impulso',
      avatarStyle: 'lorelei-neutral',
      avatarModelSlug: 'lorelei-02',
    });

    expect(repository.upsertIdentity).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 's1',
      nickname: 'Capi Leo',
      selected_title_slug: 'primer_impulso',
      avatar_style: 'lorelei-neutral',
      avatar_model_slug: 'lorelei-02',
    }));
    expect(result.identity).toMatchObject({
      nickname: 'Capi Leo',
      displayName: 'Capi Leo',
      selectedTitleSlug: 'primer_impulso',
      avatarStyle: 'lorelei-neutral',
      avatarModelSlug: 'lorelei-02',
    });
  });

  it('purchaseCosmeticItemUseCase compra sin recargar el agregado completo', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue(buildStudent());
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([
      { id: 't1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendances.mockResolvedValue([]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue(null);
    repository.getIdentity.mockResolvedValue(null);
    repository.getCurrencyWallet
      .mockResolvedValueOnce({ student_id: 's1', balance: 20, total_earned: 20, total_spent: 0 })
      .mockResolvedValueOnce({ student_id: 's1', balance: 6, total_earned: 20, total_spent: 14 });
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      { slug: 'frame_cian_ruta', name: 'Marco Ruta Cian', description: 'Compra', rarity: 'common', category: 'frame', price_coins: 14 },
    ]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ student_id: 's1', source_type: 'cosmetic_purchase', source_ref: 'frame_cian_ruta', coins_delta: -14, label: 'Compra cosmetica', description: 'Compraste Marco Ruta Cian para tu perfil.' }]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([
      { id: 't1', student_id: 's1', fecha_test: '2026-05-01', brazo_extend_con_impulso: 40, brazo_extend_sin_impulso: 35, fuerza_abdomen: 20, elevaciones_barra: 3, fuerza_explosiva_salto_largo: 180 },
    ]);
    repository.listAttendancesByStudentIds.mockResolvedValue([]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([]);
    repository.listStudentCosmeticItems
      .mockResolvedValue([{ student_id: 's1', item_slug: 'frame_cian_ruta', acquired_at: '2026-06-07T12:00:00.000Z' }]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
    repository.purchaseCosmeticItem.mockResolvedValue({ ok: true, itemSlug: 'frame_cian_ruta', priceCoins: 14 });

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.purchaseCosmeticItemUseCase.execute({ userId: 'u1', itemSlug: 'frame_cian_ruta' });

    expect(repository.purchaseCosmeticItem).toHaveBeenCalledWith('s1', 'frame_cian_ruta');
    expect(repository.replaceLeaderboardSnapshots).not.toHaveBeenCalled();
    expect(repository.upsertProfile).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      itemSlug: 'frame_cian_ruta',
      priceCoins: 14,
    }));
  });

  it('purchaseCosmeticItemUseCase bloquea cosmeticos de prestigio que aun no se han desbloqueado', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue(buildStudent());
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([]);
    repository.listAttendances.mockResolvedValue([]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue({
      student_id: 's1',
      total_xp: 120,
      current_xp: 120,
      current_level: 2,
      active_streak: 1,
      longest_streak: 1,
      summary: {},
    });
    repository.getIdentity.mockResolvedValue(null);
    repository.getCurrencyWallet.mockResolvedValue({ student_id: 's1', balance: 80, total_earned: 80, total_spent: 0 });
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      {
        slug: 'effect_pulso_record',
        name: 'Pulso de Record',
        description: 'Premio competitivo.',
        rarity: 'legendary',
        category: 'effect',
        price_coins: 0,
        metadata: {
          unlockType: 'leaderboard_top',
          unlockTarget: 1,
          boardType: 'jump_approach',
          unlockHint: 'Desbloquea al liderar la tabla de salto con carrera.',
        },
      },
    ]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([]);
    repository.listAttendancesByStudentIds.mockResolvedValue([]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([]);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);

    const useCases = createGamificationUseCases(repository, buildDeps());

    await expect(
      useCases.purchaseCosmeticItemUseCase.execute({ userId: 'u1', itemSlug: 'effect_pulso_record' })
    ).rejects.toThrow('Desbloquea al liderar la tabla de salto con carrera.');

    expect(repository.purchaseCosmeticItem).not.toHaveBeenCalled();
  });

  it('equipCosmeticItemUseCase equipa un item ya adquirido sin recargar el agregado', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue(buildStudent());
    repository.equipCosmeticItem.mockResolvedValue({ ok: true, itemSlug: 'frame_cian_ruta', category: 'frame' });

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.equipCosmeticItemUseCase.execute({ userId: 'u1', itemSlug: 'frame_cian_ruta' });

    expect(repository.equipCosmeticItem).toHaveBeenCalledWith('s1', 'frame_cian_ruta');
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      itemSlug: 'frame_cian_ruta',
      category: 'frame',
    }));
  });

  it('unequipCosmeticItemUseCase retira un slot equipado sin recargar el agregado', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue(buildStudent());
    repository.unequipCosmeticItem.mockResolvedValue({ ok: true, category: 'frame' });

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.unequipCosmeticItemUseCase.execute({ userId: 'u1', category: 'frame' });

    expect(repository.unequipCosmeticItem).toHaveBeenCalledWith('s1', 'frame');
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      category: 'frame',
    }));
  });

  it('avatarCatalog expone modelos fijos por estilo con opciones disponibles y bloqueadas', () => {
    AVATAR_STYLE_OPTIONS.forEach((style) => {
      const modelOptions = getAvatarModelOptions(style.slug);

      expect(style.models.length).toBeGreaterThanOrEqual(3);
      expect(modelOptions.available.length).toBeGreaterThan(0);
      expect(modelOptions.blocked.length).toBeGreaterThan(0);
      expect(modelOptions.available.every((model) => model.isLocked === false)).toBe(true);
      expect(modelOptions.blocked.every((model) => model.isLocked === true)).toBe(true);
    });

    expect(getAvatarModelMeta('adventurer-neutral', 'adventurer-03')).toEqual(
      expect.objectContaining({
        slug: 'adventurer-03',
        unlockHint: expect.any(String),
      }),
    );
  });

  it('buildAvatarUrl varia de forma determinista por modelSlug', () => {
    const baseUrl = buildAvatarUrl({
      seed: 'student-1',
      style: 'adventurer-neutral',
      modelSlug: 'adventurer-01',
    });
    const eliteUrl = buildAvatarUrl({
      seed: 'student-1',
      style: 'adventurer-neutral',
      modelSlug: 'adventurer-03',
    });
    const repeatedUrl = buildAvatarUrl({
      seed: 'student-1',
      style: 'adventurer-neutral',
      modelSlug: 'adventurer-01',
    });

    expect(baseUrl).toEqual(repeatedUrl);
    expect(baseUrl).not.toEqual(eliteUrl);
    expect(baseUrl).toContain('api.dicebear.com/10.x/adventurer-neutral/svg');

    const fallbackUrl = buildAvatarUrl({
      seed: 'student-1',
      style: 'invalid-style',
      modelSlug: 'missing-model',
    });
    const fallbackResolution = resolveAvatarModelMeta('invalid-style', 'missing-model');

    expect(fallbackUrl).toContain(`api.dicebear.com/10.x/${fallbackResolution.resolvedStyleSlug}/svg`);
    expect(fallbackResolution).toEqual(
      expect.objectContaining({
        requestedStyleSlug: 'invalid-style',
        requestedModelSlug: 'missing-model',
        resolvedStyleSlug: 'adventurer-neutral',
        resolvedModelSlug: 'adventurer-01',
        isStyleFallback: true,
        isModelFallback: true,
        model: expect.objectContaining({
          slug: 'adventurer-01',
          unlockHint: expect.any(String),
          isBase: true,
        }),
      }),
    );
  });

  it('proyecta el shape esperado para avatarModelOptions con grupos disponibles y bloqueados', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([]);
    repository.listAttendances.mockResolvedValue([]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue({
      student_id: 's1',
      total_xp: 820,
      current_xp: 220,
      current_level: 5,
      active_streak: 3,
      longest_streak: 3,
      summary: {},
    });
    repository.getIdentity.mockResolvedValue({
      student_id: 's1',
      nickname: 'RayoLeo',
      selected_title_slug: 'primer_impulso',
      avatar_style: 'adventurer-neutral',
      avatar_model_slug: 'adventurer-01',
    });
    repository.getCurrencyWallet.mockResolvedValue(null);
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([]);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([]);
    repository.listAttendancesByStudentIds.mockResolvedValue([]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([
      {
        student_id: 's1',
        nickname: 'RayoLeo',
        selected_title_slug: 'primer_impulso',
        avatar_style: 'adventurer-neutral',
        avatar_model_slug: 'adventurer-01',
      },
    ]);
    repository.listCategoryLeaderboard.mockResolvedValue([]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({
      studentId: 's1',
    });
    expect(result.identity).toEqual(
      expect.objectContaining({
        avatarStyle: 'adventurer-neutral',
        avatarModelSlug: 'adventurer-01',
        avatarUrl: expect.any(String),
        avatarModelsByStyle: expect.any(Object),
        avatarModelOptions: expect.objectContaining({
          available: expect.any(Array),
          blocked: expect.any(Array),
        }),
      }),
    );
    expect(result.identity.avatarModelOptions).toEqual(
      expect.objectContaining({
        available: expect.arrayContaining([
          expect.objectContaining({
            slug: 'adventurer-03',
            unlockHint: expect.any(String),
            isLocked: false,
          }),
        ]),
        blocked: expect.any(Array),
      }),
    );
    expect(result.identity.avatarModelsByStyle.thumbs.available).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'thumbs-03',
          isLocked: false,
        }),
      ]),
    );
    expect(result.identity.avatarModelsByStyle['pixel-art-neutral'].available).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'pixel-art-03',
          isLocked: false,
        }),
      ]),
    );
    expect(result.secretAchievements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          achievementSlug: expect.any(String),
          isHidden: true,
          hint: expect.any(String),
        }),
      ]),
    );
  });

  it('preserves a readable variant label for expanded cosmetics inside the projected catalog', async () => {
    const repository = buildRepository();
    repository.findStudentById.mockResolvedValue(buildStudent());
    repository.listPhysicalTests.mockResolvedValue([]);
    repository.listAttendances.mockResolvedValue([]);
    repository.listPayments.mockResolvedValue([]);
    repository.getProfile.mockResolvedValue(null);
    repository.getIdentity.mockResolvedValue(null);
    repository.getCurrencyWallet.mockResolvedValue({ student_id: 's1', balance: 120, total_earned: 120, total_spent: 0 });
    repository.listStudentAchievements.mockResolvedValue([]);
    repository.listAchievementCatalog.mockResolvedValue([]);
    repository.listTitleCatalog.mockResolvedValue([]);
    repository.listActiveChallenges.mockResolvedValue([]);
    repository.listActiveCampaigns.mockResolvedValue([]);
    repository.listActiveHiddenRewards.mockResolvedValue([]);
    repository.listStudentChallengeProgress.mockResolvedValue([]);
    repository.listStudentCampaignProgress.mockResolvedValue([]);
    repository.listStudentHiddenRewards.mockResolvedValue([]);
    repository.listXpLedger.mockResolvedValue([]);
    repository.listCurrencyLedger.mockResolvedValue([]);
    repository.listStudentCosmeticItems.mockResolvedValue([]);
    repository.getStudentCosmeticEquipment.mockResolvedValue(null);
    repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
    repository.listPhysicalTestsByStudentIds.mockResolvedValue([]);
    repository.listAttendancesByStudentIds.mockResolvedValue([]);
    repository.listPaymentsByStudentIds.mockResolvedValue([]);
    repository.listIdentitiesByStudentIds.mockResolvedValue([]);
    repository.listCosmeticCatalog.mockResolvedValue([
      {
        slug: 'frame_prestige_arc',
        name: 'Marco Prestige Arc',
        rarity: 'epic',
        category: 'frame',
        price_coins: 42,
        sort_order: 10,
        metadata: {
          accent: 'cobalt',
          frameVariant: 'arc-double',
          unlockType: 'purchase',
          unlockHint: 'Disponible para comprar con monedas.',
        },
      },
    ]);

    const useCases = createGamificationUseCases(repository, buildDeps());
    const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });
    const item = result.cosmetics.items.find((entry) => entry.slug === 'frame_prestige_arc');

    expect(item.metadata.frameVariant).toBe('arc-double');
    expect(item.rarity).toBe('epic');
    expect(item.canPurchase).toBe(true);
    expect(item.variantLabel).toBe('arc double');
  });
});
