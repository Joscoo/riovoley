const { createUserManagementUseCases } = require('./createUserManagementUseCases');

describe('createUserManagementUseCases', () => {
  const buildRepository = () => ({
    listAthletes: jest.fn(),
    listTrainers: jest.fn(),
    listAdministrators: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    suspendUser: jest.fn(),
    reactivateUser: jest.fn(),
    resendCredentials: jest.fn(),
    changeRole: jest.fn(),
  });

  it('filterAthletesUseCase filtra por estado/categoria/busqueda', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const result = useCases.filterAthletesUseCase.execute({
      athletes: [
        { id: 'a1', full_name: 'Ana Perez', email: 'ana@demo.com', categoria: 'iniciacion_hombres', suspended: false, apellido: 'Perez' },
        { id: 'a2', full_name: 'Lia Torres', email: 'lia@demo.com', categoria: 'master_mujeres', suspended: true, apellido: 'Torres' },
      ],
      filters: {
        status: 'active',
        categoria: 'iniciacion_hombres',
        search: 'ana',
        sortBy: 'apellido',
        sortOrder: 'asc',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('filterTrainersUseCase filtra y ordena', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const result = useCases.filterTrainersUseCase.execute({
      trainers: [
        { id: 't1', nombre: 'Carlos', apellido: 'Zuluaga', email: 'c@demo.com', suspended: false },
        { id: 't2', nombre: 'Ana', apellido: 'Bravo', email: 'a@demo.com', suspended: false },
      ],
      filters: { search: '', status: 'all', sortBy: 'apellido', sortOrder: 'asc' },
    });

    expect(result[0].id).toBe('t2');
    expect(result[1].id).toBe('t1');
  });

  it('paginateUsersUseCase retorna pagina valida', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const result = useCases.paginateUsersUseCase.execute({
      items: [{ id: '1' }, { id: '2' }, { id: '3' }],
      page: 3,
      pageSize: 2,
    });

    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(2);
    expect(result.paginated).toEqual([{ id: '3' }]);
  });

  it('buildAthletesStatsUseCase y buildTrainersStatsUseCase calculan contadores', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const athleteStats = useCases.buildAthletesStatsUseCase.execute({
      filteredAthletes: [
        { id: 'a1', categoria: 'iniciacion_hombres', suspended: false },
        { id: 'a2', categoria: 'master_mujeres', suspended: true },
      ],
      categories: ['iniciacion_hombres', 'master_mujeres'],
    });

    const trainerStats = useCases.buildTrainersStatsUseCase.execute({
      filteredTrainers: [
        { id: 't1', suspended: false },
        { id: 't2', suspended: true },
      ],
    });

    expect(athleteStats).toEqual({
      total: 2,
      activos: 1,
      suspendidos: 1,
      byCategory: {
        iniciacion_hombres: 1,
        master_mujeres: 1,
      },
    });
    expect(trainerStats).toEqual({
      total: 2,
      activos: 1,
      suspendidos: 1,
    });
  });

  it('filterAdministratorsUseCase y buildAdministratorsStatsUseCase funcionan', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const filtered = useCases.filterAdministratorsUseCase.execute({
      administrators: [
        { id: 'u1', nombre: 'Ana', apellido: 'Bravo', email: 'ana@demo.com' },
        { id: 'u2', nombre: 'Luis', apellido: 'Zamora', email: 'luis@demo.com' },
      ],
      filters: { search: 'ana', sortBy: 'apellido', sortOrder: 'asc' },
    });
    const stats = useCases.buildAdministratorsStatsUseCase.execute({
      filteredAdministrators: filtered,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('u1');
    expect(stats).toEqual({ total: 1 });
  });

  it('performUserActionUseCase enruta acciones soportadas', async () => {
    const repository = buildRepository();
    repository.changeRole.mockResolvedValue({ success: true });
    const useCases = createUserManagementUseCases(repository);

    const result = await useCases.performUserActionUseCase.execute({
      actionType: 'change_role',
      payload: { userId: 'u1', newRole: 'entrenador' },
    });

    expect(repository.changeRole).toHaveBeenCalledWith('u1', 'entrenador');
    expect(result).toEqual({ success: true });
  });

  it('resolvePermissionsUseCase retorna matriz para admin->atleta y default cuando no existe', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const adminAthlete = useCases.resolvePermissionsUseCase.execute({
      userRole: 'administrador',
      targetUserType: 'atleta',
    });
    const adminAdministrator = useCases.resolvePermissionsUseCase.execute({
      userRole: 'administrador',
      targetUserType: 'administrador',
    });
    const unknown = useCases.resolvePermissionsUseCase.execute({
      userRole: 'invitado',
      targetUserType: 'atleta',
    });

    expect(adminAthlete.canDelete).toBe(true);
    expect(adminAdministrator.canChangeRole).toBe(true);
    expect(unknown).toEqual({
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSuspend: false,
      canResendCredentials: false,
      canChangeRole: false,
    });
  });

  it('resolvePanelAccessUseCase identifica acceso admin/trainer', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const admin = useCases.resolvePanelAccessUseCase.execute({ userRole: 'administrador' });
    const trainer = useCases.resolvePanelAccessUseCase.execute({ userRole: 'entrenador' });
    const unknown = useCases.resolvePanelAccessUseCase.execute({ userRole: 'visitante' });

    expect(admin).toEqual({ isAdmin: true, isTrainer: false, hasAccess: true });
    expect(trainer).toEqual({ isAdmin: false, isTrainer: true, hasAccess: true });
    expect(unknown).toEqual({ isAdmin: false, isTrainer: false, hasAccess: false });
  });

  it('buildVisiblePanelTabsUseCase y resolvePanelActiveTabUseCase validan tabs', () => {
    const useCases = createUserManagementUseCases(buildRepository());

    const trainerTabs = useCases.buildVisiblePanelTabsUseCase.execute({ userRole: 'entrenador' });
    const adminTabs = useCases.buildVisiblePanelTabsUseCase.execute({ userRole: 'administrador' });
    const validTab = useCases.resolvePanelActiveTabUseCase.execute({
      userRole: 'entrenador',
      candidateTabId: 'trainers',
    });

    expect(trainerTabs.map((tab) => tab.id)).toEqual(['athletes']);
    expect(adminTabs.map((tab) => tab.id)).toEqual(['athletes', 'trainers', 'administrators']);
    expect(validTab).toBe('athletes');
  });
});
