process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../infrastructure/repositories/supabaseUserManagementRepository', () => ({
  __esModule: true,
  SupabaseUserManagementRepository: jest.fn().mockImplementation(() => ({
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
  })),
}));

jest.mock('../application/useCases/createUserManagementUseCases', () => ({
  __esModule: true,
  createUserManagementUseCases: jest.fn(),
}));

const { createUserManagementUseCases } = require('../application/useCases/createUserManagementUseCases');
const { createUserManagementService } = require('./createUserManagementService');

describe('createUserManagementService', () => {
  const mockListAthletesExecute = jest.fn();
  const mockCreateUserExecute = jest.fn();
  const mockChangeRoleExecute = jest.fn();
  const mockPerformActionExecute = jest.fn();
  const mockResolvePermissionsExecute = jest.fn();
  const mockResolvePanelAccessExecute = jest.fn();
  const mockVisibleTabsExecute = jest.fn();
  const mockResolveActiveTabExecute = jest.fn();
  const mockFilterAthletesExecute = jest.fn();
  const mockFilterAdministratorsExecute = jest.fn();
  const mockPaginateExecute = jest.fn();
  const mockBuildAdministratorsStatsExecute = jest.fn();

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

  beforeEach(() => {
    jest.clearAllMocks();
    createUserManagementUseCases.mockReturnValue({
      listAthletesUseCase: { execute: mockListAthletesExecute },
      listTrainersUseCase: { execute: jest.fn() },
      listAdministratorsUseCase: { execute: jest.fn() },
      createUserUseCase: { execute: mockCreateUserExecute },
      updateUserUseCase: { execute: jest.fn() },
      deleteUserUseCase: { execute: jest.fn() },
      suspendUserUseCase: { execute: jest.fn() },
      reactivateUserUseCase: { execute: jest.fn() },
      resendCredentialsUseCase: { execute: jest.fn() },
      changeRoleUseCase: { execute: mockChangeRoleExecute },
      performUserActionUseCase: { execute: mockPerformActionExecute },
      resolvePermissionsUseCase: { execute: mockResolvePermissionsExecute },
      resolvePanelAccessUseCase: { execute: mockResolvePanelAccessExecute },
      buildVisiblePanelTabsUseCase: { execute: mockVisibleTabsExecute },
      resolvePanelActiveTabUseCase: { execute: mockResolveActiveTabExecute },
      filterAthletesUseCase: { execute: mockFilterAthletesExecute },
      filterTrainersUseCase: { execute: jest.fn() },
      filterAdministratorsUseCase: { execute: mockFilterAdministratorsExecute },
      paginateUsersUseCase: { execute: mockPaginateExecute },
      buildAthletesStatsUseCase: { execute: jest.fn() },
      buildTrainersStatsUseCase: { execute: jest.fn() },
      buildAdministratorsStatsUseCase: { execute: mockBuildAdministratorsStatsExecute },
    });
  });

  it('listAthletes delega al use case', async () => {
    mockListAthletesExecute.mockResolvedValue([{ id: 'a1' }]);
    const service = createUserManagementService(buildRepository());

    const result = await service.listAthletes();

    expect(mockListAthletesExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('createUser delega payload completo al use case', async () => {
    mockCreateUserExecute.mockResolvedValue({ success: true });
    const service = createUserManagementService(buildRepository());
    const formData = { email: 'ana@demo.com', nombre: 'Ana' };

    const result = await service.createUser(formData, 'entrenador');

    expect(mockCreateUserExecute).toHaveBeenCalledWith({
      formData,
      userType: 'entrenador',
    });
    expect(result).toEqual({ success: true });
  });

  it('changeRole delega userId y newRole al use case', async () => {
    mockChangeRoleExecute.mockResolvedValue({ success: true });
    const service = createUserManagementService(buildRepository());

    const result = await service.changeRole('u1', 'administrador');

    expect(mockChangeRoleExecute).toHaveBeenCalledWith({
      userId: 'u1',
      newRole: 'administrador',
    });
    expect(result).toEqual({ success: true });
  });

  it('performAction delega actionType y payload al use case', async () => {
    mockPerformActionExecute.mockResolvedValue({ ok: true });
    const service = createUserManagementService(buildRepository());

    const result = await service.performAction({
      actionType: 'delete',
      payload: { userId: 'u1', userType: 'atleta' },
    });

    expect(mockPerformActionExecute).toHaveBeenCalledWith({
      actionType: 'delete',
      payload: { userId: 'u1', userType: 'atleta' },
    });
    expect(result).toEqual({ ok: true });
  });

  it('getPermissions delega userRole y targetUserType al use case', () => {
    mockResolvePermissionsExecute.mockReturnValue({ canView: true });
    const service = createUserManagementService(buildRepository());

    const result = service.getPermissions({
      userRole: 'administrador',
      targetUserType: 'atleta',
    });

    expect(mockResolvePermissionsExecute).toHaveBeenCalledWith({
      userRole: 'administrador',
      targetUserType: 'atleta',
    });
    expect(result).toEqual({ canView: true });
  });

  it('getPanelAccess/getVisiblePanelTabs/getValidPanelActiveTab delegan al use case', () => {
    mockResolvePanelAccessExecute.mockReturnValue({ hasAccess: true });
    mockVisibleTabsExecute.mockReturnValue([{ id: 'athletes', label: 'Atletas' }]);
    mockResolveActiveTabExecute.mockReturnValue('athletes');
    const service = createUserManagementService(buildRepository());

    const access = service.getPanelAccess({ userRole: 'entrenador' });
    const tabs = service.getVisiblePanelTabs({ userRole: 'entrenador' });
    const activeTab = service.getValidPanelActiveTab({
      userRole: 'entrenador',
      candidateTabId: 'trainers',
    });

    expect(mockResolvePanelAccessExecute).toHaveBeenCalledWith({ userRole: 'entrenador' });
    expect(mockVisibleTabsExecute).toHaveBeenCalledWith({ userRole: 'entrenador' });
    expect(mockResolveActiveTabExecute).toHaveBeenCalledWith({
      userRole: 'entrenador',
      candidateTabId: 'trainers',
    });
    expect(access).toEqual({ hasAccess: true });
    expect(tabs).toEqual([{ id: 'athletes', label: 'Atletas' }]);
    expect(activeTab).toBe('athletes');
  });

  it('filterAthletes y paginateUsers delegan payload', () => {
    mockFilterAthletesExecute.mockReturnValue([{ id: 'a1' }]);
    mockPaginateExecute.mockReturnValue({ totalPages: 1, currentPage: 1, paginated: [{ id: 'a1' }] });
    const service = createUserManagementService(buildRepository());

    const filtered = service.filterAthletes({
      athletes: [{ id: 'a1' }],
      filters: { search: 'ana' },
    });
    const paginated = service.paginateUsers({
      items: filtered,
      page: 1,
      pageSize: 9,
    });

    expect(mockFilterAthletesExecute).toHaveBeenCalledWith({
      athletes: [{ id: 'a1' }],
      filters: { search: 'ana' },
    });
    expect(mockPaginateExecute).toHaveBeenCalledWith({
      items: [{ id: 'a1' }],
      page: 1,
      pageSize: 9,
    });
    expect(paginated.totalPages).toBe(1);
  });

  it('filterAdministrators y buildAdministratorsStats delegan payload', () => {
    mockFilterAdministratorsExecute.mockReturnValue([{ id: 'u1' }]);
    mockBuildAdministratorsStatsExecute.mockReturnValue({ total: 1 });
    const service = createUserManagementService(buildRepository());

    const filtered = service.filterAdministrators({
      administrators: [{ id: 'u1' }],
      filters: { search: 'ana' },
    });
    const stats = service.buildAdministratorsStats({
      filteredAdministrators: filtered,
    });

    expect(mockFilterAdministratorsExecute).toHaveBeenCalledWith({
      administrators: [{ id: 'u1' }],
      filters: { search: 'ana' },
    });
    expect(mockBuildAdministratorsStatsExecute).toHaveBeenCalledWith({
      filteredAdministrators: [{ id: 'u1' }],
    });
    expect(stats).toEqual({ total: 1 });
  });
});
