import { assertUserManagementRepository } from '../application/contracts/userManagementRepositoryContract';
import { createUserManagementUseCases } from '../application/useCases/createUserManagementUseCases';
import { SupabaseUserManagementRepository } from '../infrastructure/repositories/supabaseUserManagementRepository';

export const createUserManagementService = (repository = new SupabaseUserManagementRepository()) => {
  assertUserManagementRepository(repository);
  const useCases = createUserManagementUseCases(repository);

  return {
    listAthletes: ({ query } = {}) => useCases.listAthletesUseCase.execute({ query }),
    listTrainers: ({ query } = {}) => useCases.listTrainersUseCase.execute({ query }),
    listAdministrators: ({ query } = {}) => useCases.listAdministratorsUseCase.execute({ query }),
    createUser: (formData, userType) => useCases.createUserUseCase.execute({ formData, userType }),
    updateUser: (userId, formData, userType) => useCases.updateUserUseCase.execute({ userId, formData, userType }),
    deleteUser: (userId, userType) => useCases.deleteUserUseCase.execute({ userId, userType }),
    suspendUser: (userId, reason, until) => useCases.suspendUserUseCase.execute({ userId, reason, until }),
    reactivateUser: (userId) => useCases.reactivateUserUseCase.execute({ userId }),
    resendCredentials: (userId, channels) => useCases.resendCredentialsUseCase.execute({ userId, channels }),
    changeRole: (userId, newRole) => useCases.changeRoleUseCase.execute({ userId, newRole }),
    performAction: ({ actionType, payload }) => useCases.performUserActionUseCase.execute({ actionType, payload }),
    getPermissions: ({ userRole, targetUserType }) =>
      useCases.resolvePermissionsUseCase.execute({ userRole, targetUserType }),
    getPanelAccess: ({ userRole }) => useCases.resolvePanelAccessUseCase.execute({ userRole }),
    getVisiblePanelTabs: ({ userRole }) => useCases.buildVisiblePanelTabsUseCase.execute({ userRole }),
    getValidPanelActiveTab: ({ userRole, candidateTabId }) =>
      useCases.resolvePanelActiveTabUseCase.execute({ userRole, candidateTabId }),
    filterAthletes: ({ athletes, filters }) => useCases.filterAthletesUseCase.execute({ athletes, filters }),
    filterTrainers: ({ trainers, filters }) => useCases.filterTrainersUseCase.execute({ trainers, filters }),
    filterAdministrators: ({ administrators, filters }) =>
      useCases.filterAdministratorsUseCase.execute({ administrators, filters }),
    paginateUsers: ({ items, page, pageSize }) => useCases.paginateUsersUseCase.execute({ items, page, pageSize }),
    buildAthletesStats: ({ filteredAthletes, categories }) =>
      useCases.buildAthletesStatsUseCase.execute({ filteredAthletes, categories }),
    buildTrainersStats: ({ filteredTrainers }) =>
      useCases.buildTrainersStatsUseCase.execute({ filteredTrainers }),
    buildAdministratorsStats: ({ filteredAdministrators }) =>
      useCases.buildAdministratorsStatsUseCase.execute({ filteredAdministrators }),
  };
};
