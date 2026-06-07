const { createAttendanceUseCases } = require('./createAttendanceUseCases');

describe('createAttendanceUseCases', () => {
  const buildRepository = () => ({
    listAthletesWithRole: jest.fn(),
    listAttendances: jest.fn(),
    getStudentById: jest.fn(),
    listPaymentTypes: jest.fn(),
    findAttendanceByStudentAndDate: jest.fn(),
    updateAttendance: jest.fn(),
    createAttendance: jest.fn(),
    deleteAttendanceByStudentAndDate: jest.fn(),
    deleteAttendancesByDate: jest.fn(),
  });

  const buildDeps = () => ({
    getEcuadorDate: jest.fn(() => '2026-05-17'),
    getEcuadorDateMinusDays: jest.fn(() => '2026-05-10'),
    formatDateString: jest.fn((value) => `fmt-${value}`),
    gamificationService: {
      refreshStudentProgress: jest.fn(),
    },
  });

  it('loadAthletesUseCase filtra solo estudiantes', async () => {
    const repository = buildRepository();
    repository.listAthletesWithRole.mockResolvedValue([
      { id: 's1', users: { role: 'estudiante' } },
      { id: 't1', users: { role: 'entrenador' } },
    ]);
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = await useCases.loadAthletesUseCase.execute();

    expect(result).toEqual([{ id: 's1', users: { role: 'estudiante' } }]);
  });

  it('loadAttendanceDataUseCase agrupa y completa students por cache/fallback', async () => {
    const repository = buildRepository();
    repository.listAttendances.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-05-17' },
      { id: 'a2', student_id: 's2', fecha: '2026-05-17' },
    ]);
    repository.getStudentById.mockResolvedValue({ id: 's2', users: { nombre: 'Lia' } });

    const useCases = createAttendanceUseCases(repository, buildDeps());
    const athletes = [{ id: 's1', users: { nombre: 'Ana' }, categoria: 'iniciacion_hombres' }];

    const result = await useCases.loadAttendanceDataUseCase.execute({
      filters: { fecha_inicio: '2026-05-01', fecha_fin: '2026-05-31', categoria: '' },
      athletes,
    });

    expect(repository.listAttendances).toHaveBeenCalled();
    expect(result.attendances).toHaveLength(2);
    expect(result.attendances[0].students.id).toBe('s1');
    expect(result.attendances[1].students.id).toBe('s2');
    expect(result.groupedByDate['2026-05-17']).toHaveLength(2);
  });

  it('loadAttendanceDataUseCase aplica filtro dinamico de busqueda en historial', async () => {
    const repository = buildRepository();
    repository.listAttendances.mockResolvedValue([
      { id: 'a1', student_id: 's1', fecha: '2026-05-17', metodo_pago_id: 1 },
      { id: 'a2', student_id: 's2', fecha: '2026-05-17', metodo_pago_id: 2 },
    ]);

    const useCases = createAttendanceUseCases(repository, buildDeps());
    const athletes = [
      { id: 's1', categoria: 'iniciacion_hombres', users: { nombre: 'Ana', apellido: 'Lopez', email: 'ana@rio.test' } },
      { id: 's2', categoria: 'master_mujeres', users: { nombre: 'Sofia', apellido: 'Perez', email: 'sofia@rio.test' } },
    ];

    const result = await useCases.loadAttendanceDataUseCase.execute({
      filters: {
        fecha_inicio: '2026-05-01',
        fecha_fin: '2026-05-31',
        categoria: '',
        search: 'sofia perez',
      },
      athletes,
    });

    expect(result.attendances).toHaveLength(1);
    expect(result.attendances[0].student_id).toBe('s2');
  });

  it('registerAttendanceWithPaymentUseCase actualiza si ya existe', async () => {
    const repository = buildRepository();
    repository.findAttendanceByStudentAndDate.mockResolvedValue({ id: 'a1' });
    const deps = buildDeps();
    const useCases = createAttendanceUseCases(repository, deps);

    await useCases.registerAttendanceWithPaymentUseCase.execute({
      athleteId: 's1',
      selectedDate: '2026-05-17',
      paymentTypeId: 2,
    });

    expect(repository.updateAttendance).toHaveBeenCalledWith('a1', { metodo_pago_id: 2 });
    expect(deps.gamificationService.refreshStudentProgress).toHaveBeenCalledWith({ studentId: 's1' });
    expect(repository.createAttendance).not.toHaveBeenCalled();
  });

  it('toggleAttendanceUseCase elimina cuando ya estaba presente', async () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createAttendanceUseCases(repository, deps);

    await useCases.toggleAttendanceUseCase.execute({
      athleteId: 's1',
      selectedDate: '2026-05-17',
      isCurrentlyPresent: true,
    });

    expect(repository.deleteAttendanceByStudentAndDate).toHaveBeenCalledWith('s1', '2026-05-17');
    expect(deps.gamificationService.refreshStudentProgress).toHaveBeenCalledWith({ studentId: 's1' });
  });

  it('getDefaultDatesUseCase devuelve fechas iniciales para filtros', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.getDefaultDatesUseCase.execute();

    expect(result).toEqual({
      selectedDate: '2026-05-17',
      dateFrom: '2026-05-10',
      dateTo: '2026-05-17',
    });
  });

  it('calculateStatsUseCase calcula resumen en modo bulk', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.calculateStatsUseCase.execute({
      attendances: [{ id: 'a1', fecha: '2026-05-17', students: { categoria: 'iniciacion_hombres' } }],
      athletes: [{ id: 's1', categoria: 'iniciacion_hombres' }, { id: 's2', categoria: 'master_mujeres' }],
      todayAttendance: [{ id: 's1', attendance: { id: 'a1' } }, { id: 's2', attendance: null }],
      bulkMode: true,
      categories: ['iniciacion_hombres', 'master_mujeres'],
    });

    expect(result.total).toBe(2);
    expect(result.presentes).toBe(1);
    expect(result.ausentes).toBe(1);
    expect(result.categoriaStats.master_mujeres.total).toBe(1);
  });

  it('markAllPresentWithMensualidadUseCase registra solo ausentes', async () => {
    const repository = buildRepository();
    repository.findAttendanceByStudentAndDate.mockResolvedValue(null);
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = await useCases.markAllPresentWithMensualidadUseCase.execute({
      selectedDate: '2026-05-17',
      paymentTypes: [{ id: 2, nombre: 'mensualidad' }],
      todayAttendance: [
        { id: 's1', attendance: { id: 'a1' } },
        { id: 's2', attendance: null },
      ],
    });

    expect(repository.createAttendance).toHaveBeenCalledWith({
      student_id: 's2',
      fecha: '2026-05-17',
      metodo_pago_id: 2,
    });
    expect(result).toEqual({ updatedCount: 1 });
  });

  it('filterTodayAttendanceUseCase filtra por categoria y busqueda', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.filterTodayAttendanceUseCase.execute({
      todayAttendance: [
        { id: 's1', categoria: 'iniciacion_hombres', users: { nombre: 'Ana' } },
        { id: 's2', categoria: 'master_mujeres', users: { nombre: 'Lia' } },
      ],
      selectedCategory: 'iniciacion',
      searchTerm: 'ana',
      searchPredicate: (athlete, term) => athlete.users.nombre.toLowerCase().includes(term),
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('getCategoryStatsUseCase calcula presentes/ausentes', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.getCategoryStatsUseCase.execute({
      filteredAthletes: [
        { id: 's1', attendance: { id: 'a1' } },
        { id: 's2', attendance: null },
      ],
    });

    expect(result).toEqual({
      total: 2,
      presentes: 1,
      ausentes: 1,
      porcentaje: '50.0',
    });
  });

  it('buildExportSummaryUseCase usa fecha seleccionada y formatea salida', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.buildExportSummaryUseCase.execute({
      asistenciasByDate: {
        '2026-05-17': [
          { metodo_pago_id: 2, students: { id: 's1' } },
        ],
      },
      dateToExport: null,
      selectedDate: '2026-05-17',
      todayAttendance: [],
    });

    expect(result.formattedDate).toBe('fmt-2026-05-17');
    expect(result.totalAttendances).toBe(1);
    expect(result.attendancesData[0]).toMatchObject({
      id: 's1',
      attendance: { metodo_pago_id: 2 },
    });
  });

  it('getPaymentTypeDisplayUseCase traduce labels de metodos comunes', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.getPaymentTypeDisplayUseCase.execute({
      paymentTypes: [{ id: 3, nombre: 'tarjeta' }],
      metodoPagoId: 3,
    });

    expect(result).toEqual({ key: 'tarjeta', label: 'Tarjeta' });
  });

  it('buildDayAttendanceBreakdownUseCase agrupa por bloques de categoria', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());

    const result = useCases.buildDayAttendanceBreakdownUseCase.execute({
      dayAttendances: [
        { id: 'a1', students: { categoria: 'iniciacion_hombres' } },
        { id: 'a2', students: { categoria: 'master_mujeres' } },
      ],
    });

    expect(result.total).toBe(2);
    expect(result.iniciacionHombres).toHaveLength(1);
    expect(result.perfMujeres).toHaveLength(1);
  });

  it('casos de uso de nombres construyen homonimos, display e iniciales', () => {
    const repository = buildRepository();
    const useCases = createAttendanceUseCases(repository, buildDeps());
    const athleteUser = { nombre: 'Ana Maria', apellido: 'Lopez Perez' };

    const parts = useCases.getAthleteNamePartsUseCase.execute({ athleteUser });
    const key = useCases.getHomonymKeyUseCase.execute({ athleteUser });
    const compact = useCases.getCompactDisplayNameUseCase.execute({ athleteUser, isHomonym: true });
    const searchBlob = useCases.getSearchNameBlobUseCase.execute({ athleteUser });
    const initials = useCases.getAthleteInitialsUseCase.execute({ athleteUser });
    const homonyms = useCases.buildHomonymsByCompactNameUseCase.execute({
      athletes: [
        { users: { nombre: 'Ana Sofia', apellido: 'Lopez Ruiz' } },
        { users: { nombre: 'Ana Maria', apellido: 'Lopez Perez' } },
      ],
    });

    expect(parts.primerNombre).toBe('Ana');
    expect(parts.primerApellido).toBe('Lopez');
    expect(key).toBe('ana|lopez');
    expect(compact).toBe('Ana Lopez Perez');
    expect(searchBlob).toContain('ana maria lopez');
    expect(initials).toBe('AL');
    expect(homonyms['ana|lopez']).toBe(2);
  });
});
