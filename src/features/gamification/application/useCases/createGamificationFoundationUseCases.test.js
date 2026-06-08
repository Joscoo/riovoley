const { createGamificationFoundationUseCases } = require('./createGamificationFoundationUseCases');

describe('createGamificationFoundationUseCases', () => {
  const buildRepository = () => ({
    findStudentByUserId: jest.fn(),
    listXpLedger: jest.fn(),
    getCurrencyWallet: jest.fn(),
    listCurrencyLedger: jest.fn(),
    getLoginRewardState: jest.fn(),
    upsertLoginRewardState: jest.fn(),
    appendXpLedgerEntry: jest.fn(),
  });

  const buildDeps = () => ({
    getEcuadorDate: jest.fn(() => '2026-06-07'),
    getEcuadorISOString: jest.fn(() => '2026-06-07T12:00:00.000Z'),
  });

  it('registerDailyLoginRewardUseCase entrega XP una vez por dia', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue({
      id: 's1',
      user_id: 'u1',
      categoria: 'iniciacion_hombres',
      users: { nombre: 'Leo', apellido: 'Perez' },
    });
    repository.getLoginRewardState.mockResolvedValue(null);

    const useCases = createGamificationFoundationUseCases(repository, buildDeps());
    const result = await useCases.registerDailyLoginRewardUseCase.execute({ userId: 'u1' });

    expect(result).toMatchObject({ awarded: true, xpDelta: 8, studentId: 's1' });
    expect(repository.upsertLoginRewardState).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'u1',
      reward_date: '2026-06-07',
    }));
    expect(repository.appendXpLedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 's1',
      source_type: 'daily_login',
      xp_delta: 8,
    }));
  });

  it('registerDailyLoginRewardUseCase no duplica la recompensa en el mismo dia', async () => {
    const repository = buildRepository();
    repository.findStudentByUserId.mockResolvedValue({
      id: 's1',
      user_id: 'u1',
      categoria: 'iniciacion_hombres',
      users: { nombre: 'Leo', apellido: 'Perez' },
    });
    repository.getLoginRewardState.mockResolvedValue({
      user_id: 'u1',
      reward_date: '2026-06-07',
      reward_count: 1,
    });

    const useCases = createGamificationFoundationUseCases(repository, buildDeps());
    const result = await useCases.registerDailyLoginRewardUseCase.execute({ userId: 'u1' });

    expect(result).toEqual({
      awarded: false,
      xpDelta: 0,
      rewardDate: '2026-06-07',
      studentId: 's1',
    });
    expect(repository.upsertLoginRewardState).not.toHaveBeenCalled();
    expect(repository.appendXpLedgerEntry).not.toHaveBeenCalled();
  });

  it('loadXpLedgerUseCase formatea el extracto en camelCase', async () => {
    const repository = buildRepository();
    repository.listXpLedger.mockResolvedValue([{
      id: 'x1',
      student_id: 's1',
      source_type: 'attendance',
      source_ref: 'a1',
      xp_delta: 35,
      label: 'Asistencia registrada',
      description: 'Entrenamiento validado.',
      metadata: { foo: 'bar' },
      occurred_at: '2026-06-07T12:00:00.000Z',
      created_at: '2026-06-07T12:00:00.000Z',
    }]);

    const useCases = createGamificationFoundationUseCases(repository, buildDeps());
    const result = await useCases.loadXpLedgerUseCase.execute({ studentId: 's1', limit: 10 });

    expect(repository.listXpLedger).toHaveBeenCalledWith('s1', 10);
    expect(result).toEqual([expect.objectContaining({
      studentId: 's1',
      sourceType: 'attendance',
      sourceRef: 'a1',
      xpDelta: 35,
      label: 'Asistencia registrada',
    })]);
  });

  it('loadCurrencyWalletUseCase formatea wallet y extracto de monedas', async () => {
    const repository = buildRepository();
    repository.getCurrencyWallet.mockResolvedValue({
      student_id: 's1',
      balance: 24,
      total_earned: 24,
      total_spent: 0,
      last_synced_at: '2026-06-07T12:00:00.000Z',
    });
    repository.listCurrencyLedger.mockResolvedValue([{
      id: 'c1',
      student_id: 's1',
      source_type: 'attendance',
      source_ref: 'a1',
      coins_delta: 2,
      label: 'Asistencia registrada + monedas',
      description: 'Tu progreso verificado tambien te entrego monedas blandas.',
      metadata: {},
      occurred_at: '2026-06-07T12:00:00.000Z',
      created_at: '2026-06-07T12:00:00.000Z',
    }]);

    const useCases = createGamificationFoundationUseCases(repository, buildDeps());
    const result = await useCases.loadCurrencyWalletUseCase.execute({ studentId: 's1', limit: 10 });

    expect(repository.getCurrencyWallet).toHaveBeenCalledWith('s1');
    expect(repository.listCurrencyLedger).toHaveBeenCalledWith('s1', 10);
    expect(result).toMatchObject({
      balance: 24,
      totalEarned: 24,
      totalSpent: 0,
    });
    expect(result.ledger[0]).toMatchObject({
      studentId: 's1',
      sourceType: 'attendance',
      coinsDelta: 2,
    });
  });
});
