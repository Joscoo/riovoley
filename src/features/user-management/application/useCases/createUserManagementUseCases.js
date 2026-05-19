const normalizeText = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const calculateAge = (birthDateString) => {
  if (!birthDateString) return 0;

  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : 0;
};

const DEFAULT_PERMISSIONS = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canSuspend: false,
  canResendCredentials: false,
  canChangeRole: false,
};

const PERMISSION_MATRIX = {
  administrador: {
    atleta: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canSuspend: true,
      canResendCredentials: true,
      canChangeRole: true,
    },
    entrenador: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canSuspend: true,
      canResendCredentials: true,
      canChangeRole: true,
    },
    administrador: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canSuspend: false,
      canResendCredentials: false,
      canChangeRole: true,
    },
  },
  entrenador: {
    atleta: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canSuspend: true,
      canResendCredentials: true,
      canChangeRole: false,
    },
    entrenador: { ...DEFAULT_PERMISSIONS },
    administrador: { ...DEFAULT_PERMISSIONS },
  },
};

const PANEL_TABS = [
  { id: 'athletes', label: 'Estudiantes' },
  { id: 'trainers', label: 'Entrenadores' },
  { id: 'administrators', label: 'Administradores' },
];

export const createUserManagementUseCases = (repository) => {
  const listAthletesUseCase = {
    execute: async ({ query } = {}) => repository.listAthletes({ query }),
  };

  const listTrainersUseCase = {
    execute: async ({ query } = {}) => repository.listTrainers({ query }),
  };

  const listAdministratorsUseCase = {
    execute: async ({ query } = {}) => repository.listAdministrators({ query }),
  };

  const createUserUseCase = {
    execute: async ({ formData, userType }) => repository.createUser(formData, userType),
  };

  const updateUserUseCase = {
    execute: async ({ userId, formData, userType }) => repository.updateUser(userId, formData, userType),
  };

  const deleteUserUseCase = {
    execute: async ({ userId, userType }) => repository.deleteUser(userId, userType),
  };

  const suspendUserUseCase = {
    execute: async ({ userId, reason, until }) => repository.suspendUser(userId, reason, until),
  };

  const reactivateUserUseCase = {
    execute: async ({ userId }) => repository.reactivateUser(userId),
  };

  const resendCredentialsUseCase = {
    execute: async ({ userId, channels }) => repository.resendCredentials(userId, channels),
  };

  const changeRoleUseCase = {
    execute: async ({ userId, newRole }) => repository.changeRole(userId, newRole),
  };

  const performUserActionUseCase = {
    execute: async ({ actionType, payload }) => {
      switch (actionType) {
        case 'create':
          return createUserUseCase.execute({ formData: payload.formData, userType: payload.userType });
        case 'edit':
          return updateUserUseCase.execute({
            userId: payload.userId,
            formData: payload.formData,
            userType: payload.userType,
          });
        case 'delete':
          return deleteUserUseCase.execute({ userId: payload.userId, userType: payload.userType });
        case 'suspend':
          return suspendUserUseCase.execute({
            userId: payload.userId,
            reason: payload.reason,
            until: payload.until,
          });
        case 'reactivate':
          return reactivateUserUseCase.execute({ userId: payload.userId });
        case 'resend_credentials':
          return resendCredentialsUseCase.execute({
            userId: payload.userId,
            channels: payload.channels,
          });
        case 'change_role':
          return changeRoleUseCase.execute({
            userId: payload.userId,
            newRole: payload.newRole,
          });
        default:
          throw new Error(`Accion no soportada: ${actionType}`);
      }
    },
  };

  const resolvePermissionsUseCase = {
    execute: ({ userRole, targetUserType }) => {
      const normalizedRole = (userRole || '').toLowerCase();
      const normalizedTarget = (targetUserType || '').toLowerCase();

      if (!normalizedRole || !normalizedTarget) {
        return { ...DEFAULT_PERMISSIONS };
      }

      const rolePermissions = PERMISSION_MATRIX[normalizedRole];
      if (!rolePermissions) {
        return { ...DEFAULT_PERMISSIONS };
      }

      return rolePermissions[normalizedTarget] || { ...DEFAULT_PERMISSIONS };
    },
  };

  const resolvePanelAccessUseCase = {
    execute: ({ userRole }) => {
      const normalizedRole = (userRole || '').toLowerCase();
      const isAdmin = normalizedRole === 'administrador';
      const isTrainer = normalizedRole === 'entrenador';

      return {
        isAdmin,
        isTrainer,
        hasAccess: isAdmin || isTrainer,
      };
    },
  };

  const buildVisiblePanelTabsUseCase = {
    execute: ({ userRole }) => {
      const access = resolvePanelAccessUseCase.execute({ userRole });
      return PANEL_TABS.filter((tab) => {
        if (tab.id === 'athletes') return true;
        if (tab.id === 'trainers') return access.isAdmin;
        if (tab.id === 'administrators') return access.isAdmin;
        return false;
      });
    },
  };

  const resolvePanelActiveTabUseCase = {
    execute: ({ userRole, candidateTabId }) => {
      const visibleTabs = buildVisiblePanelTabsUseCase.execute({ userRole });
      if (visibleTabs.length === 0) return 'athletes';

      const fallbackTab = visibleTabs[0].id;
      if (!candidateTabId) return fallbackTab;

      const isVisible = visibleTabs.some((tab) => tab.id === candidateTabId);
      return isVisible ? candidateTabId : fallbackTab;
    },
  };

  const filterAthletesUseCase = {
    execute: ({ athletes, filters }) => {
      let result = [...(athletes || [])];

      if (filters?.status === 'active') {
        result = result.filter((athlete) => !athlete.suspended);
      } else if (filters?.status === 'suspended') {
        result = result.filter((athlete) => athlete.suspended);
      }

      if (filters?.categoria) {
        result = result.filter((athlete) => athlete.categoria === filters.categoria);
      }

      if (filters?.search) {
        const searchLower = normalizeText(filters.search);
        result = result.filter((athlete) => (
          normalizeText(athlete.full_name).includes(searchLower)
          || normalizeText(athlete.email).includes(searchLower)
          || normalizeText(athlete.categoria || '').includes(searchLower)
        ));
      }

      result.sort((a, b) => {
        let valueA;
        let valueB;

        switch (filters?.sortBy) {
          case 'nombre':
            valueA = normalizeText(a.nombre);
            valueB = normalizeText(b.nombre);
            break;
          case 'categoria':
            valueA = a.categoria || '';
            valueB = b.categoria || '';
            break;
          case 'edad':
            valueA = calculateAge(a.fecha_nacimiento);
            valueB = calculateAge(b.fecha_nacimiento);
            break;
          case 'created_at':
            valueA = new Date(a.created_at || 0);
            valueB = new Date(b.created_at || 0);
            break;
          case 'apellido':
          default:
            valueA = normalizeText(a.apellido);
            valueB = normalizeText(b.apellido);
        }

        if (valueA < valueB) return filters?.sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return filters?.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    },
  };

  const filterTrainersUseCase = {
    execute: ({ trainers, filters }) => {
      let result = [...(trainers || [])];

      if (filters?.status === 'active') {
        result = result.filter((trainer) => !trainer.suspended);
      } else if (filters?.status === 'suspended') {
        result = result.filter((trainer) => trainer.suspended);
      }

      if (filters?.search) {
        const searchLower = normalizeText(filters.search);
        result = result.filter((trainer) => {
          const fullName = `${trainer.nombre || ''} ${trainer.apellido || ''}`.trim();
          return (
            normalizeText(fullName).includes(searchLower)
            || normalizeText(trainer.email || '').includes(searchLower)
          );
        });
      }

      result.sort((a, b) => {
        const valueA = normalizeText(filters?.sortBy === 'nombre' ? a.nombre : a.apellido) || '';
        const valueB = normalizeText(filters?.sortBy === 'nombre' ? b.nombre : b.apellido) || '';

        if (valueA < valueB) return filters?.sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return filters?.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    },
  };

  const filterAdministratorsUseCase = {
    execute: ({ administrators, filters }) => {
      let result = [...(administrators || [])];

      if (filters?.search) {
        const searchLower = normalizeText(filters.search);
        result = result.filter((administrator) => {
          const fullName = `${administrator.nombre || ''} ${administrator.apellido || ''}`.trim();
          return (
            normalizeText(fullName).includes(searchLower)
            || normalizeText(administrator.email || '').includes(searchLower)
          );
        });
      }

      result.sort((a, b) => {
        const valueA = normalizeText(filters?.sortBy === 'nombre' ? a.nombre : a.apellido) || '';
        const valueB = normalizeText(filters?.sortBy === 'nombre' ? b.nombre : b.apellido) || '';

        if (valueA < valueB) return filters?.sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return filters?.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    },
  };

  const paginateUsersUseCase = {
    execute: ({ items, page, pageSize }) => {
      const safePageSize = pageSize > 0 ? pageSize : 1;
      const totalPages = Math.max(1, Math.ceil((items || []).length / safePageSize));
      const currentPage = Math.min(Math.max(page || 1, 1), totalPages);
      const paginated = (items || []).slice((currentPage - 1) * safePageSize, currentPage * safePageSize);

      return { totalPages, currentPage, paginated };
    },
  };

  const buildAthletesStatsUseCase = {
    execute: ({ filteredAthletes, categories }) => {
      const athletes = filteredAthletes || [];
      const total = athletes.length;
      const activos = athletes.filter((athlete) => !athlete.suspended).length;
      const suspendidos = athletes.filter((athlete) => athlete.suspended).length;
      const byCategory = (categories || []).reduce((accumulator, category) => {
        accumulator[category] = athletes.filter((athlete) => athlete.categoria === category).length;
        return accumulator;
      }, {});

      return { total, activos, suspendidos, byCategory };
    },
  };

  const buildTrainersStatsUseCase = {
    execute: ({ filteredTrainers }) => {
      const trainers = filteredTrainers || [];
      const total = trainers.length;
      const activos = trainers.filter((trainer) => !trainer.suspended).length;
      const suspendidos = trainers.filter((trainer) => trainer.suspended).length;

      return { total, activos, suspendidos };
    },
  };

  const buildAdministratorsStatsUseCase = {
    execute: ({ filteredAdministrators }) => {
      const administrators = filteredAdministrators || [];
      return {
        total: administrators.length,
      };
    },
  };

  return {
    listAthletesUseCase,
    listTrainersUseCase,
    listAdministratorsUseCase,
    createUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    suspendUserUseCase,
    reactivateUserUseCase,
    resendCredentialsUseCase,
    changeRoleUseCase,
    performUserActionUseCase,
    resolvePermissionsUseCase,
    resolvePanelAccessUseCase,
    buildVisiblePanelTabsUseCase,
    resolvePanelActiveTabUseCase,
    filterAthletesUseCase,
    filterTrainersUseCase,
    filterAdministratorsUseCase,
    paginateUsersUseCase,
    buildAthletesStatsUseCase,
    buildTrainersStatsUseCase,
    buildAdministratorsStatsUseCase,
  };
};
