const { createPhysicalTestsUseCases } = require('./createPhysicalTestsUseCases');

describe('createPhysicalTestsUseCases', () => {
  const buildRepository = () => ({
    listAthletes: jest.fn(),
    listTests: jest.fn(),
    createTest: jest.fn(),
    updateTest: jest.fn(),
    deleteTest: jest.fn(),
  });

  it('loadAtletasUseCase agrega full_name', async () => {
    const repository = buildRepository();
    repository.listAthletes.mockResolvedValue([
      { id: 's1', users: { nombre: 'Ana', apellido: 'Perez' } },
    ]);
    const useCases = createPhysicalTestsUseCases(repository, buildDeps());

    const result = await useCases.loadAtletasUseCase.execute();

    expect(result[0].full_name).toBe('Ana Perez');
  });

  it('loadTestsUseCase filtra por search', async () => {
    const repository = buildRepository();
    repository.listTests.mockResolvedValue([
      { id: 't1', observaciones: 'fuerte', students: { users: { nombre: 'Ana', apellido: 'Perez' } } },
      { id: 't2', observaciones: 'sin registro', students: { users: { nombre: 'Lia', apellido: 'Torres' } } },
    ]);
    const useCases = createPhysicalTestsUseCases(repository, buildDeps());

    const result = await useCases.loadTestsUseCase.execute({
      filters: { atletaId: '', fechaDesde: '', fechaHasta: '', search: 'ana' },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  it('createTestUseCase construye payload numerico', async () => {
    const repository = buildRepository();
    const useCases = createPhysicalTestsUseCases(repository, buildDeps());

    await useCases.createTestUseCase.execute({
      formData: { student_id: 's1', estatura: '1.75', fuerza_brazos: '10', fecha_test: '2026-05-17' },
    });

    expect(repository.createTest).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: 's1',
        estatura: 1.75,
        fuerza_brazos: 10,
        modified_at: expect.any(String),
      })
    );
  });

  it('buildInitialFormUseCase retorna fecha actual en form default', () => {
    const repository = buildRepository();
    const useCases = createPhysicalTestsUseCases(repository, buildDeps());

    const result = useCases.buildInitialFormUseCase.execute();

    expect(result).toMatchObject({
      student_id: '',
      fecha_test: '2026-05-17',
    });
  });

  it('validateTestFormUseCase retorna error cuando faltan mediciones', () => {
    const repository = buildRepository();
    const useCases = createPhysicalTestsUseCases(repository, buildDeps());

    const result = useCases.validateTestFormUseCase.execute({
      formData: { student_id: 's1', fecha_test: '2026-05-17' },
      athletes: [{ id: 's1' }],
    });

    expect(result.ok).toBe(false);
    expect(result.errorMessage).toContain('medici');
  });

  it('calculateStatsUseCase calcula pendientes por categoria', () => {
    const repository = buildRepository();
    const useCases = createPhysicalTestsUseCases(repository, buildDeps());

    const result = useCases.calculateStatsUseCase.execute({
      athletes: [
        { id: 's1', categoria: 'iniciacion_hombres' },
        { id: 's2', categoria: 'master_mujeres' },
      ],
      tests: [{ id: 't1', student_id: 's1', fecha_test: '2026-05-17' }],
    });

    expect(result.stats.totalAtletas).toBe(2);
    expect(result.stats.conTestEsteMes).toBe(1);
    expect(result.pendingAthletes).toHaveLength(1);
    expect(result.pendingByCategory.master_mujeres).toHaveLength(1);
  });
});
  const buildDeps = () => ({
    getEcuadorDate: jest.fn(() => '2026-05-17'),
    getEcuadorDateTime: jest.fn(() => new Date('2026-05-17T10:00:00')),
  });
