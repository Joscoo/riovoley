const ROLE_LABELS = Object.freeze({
  administrador: 'Administrador',
  entrenador: 'Entrenador',
  estudiante: 'Estudiante',
  usuario: 'Estudiante',
});

const USER_TYPE_LABELS = Object.freeze({
  atleta: 'Estudiante',
  entrenador: 'Entrenador',
  administrador: 'Administrador',
});

const PANEL_LABELS = Object.freeze({
  admin: 'Panel de Administración',
  trainer: 'Panel de Entrenador',
  student: 'Panel de Estudiante',
});

const UI_LABELS = Object.freeze({
  usersManagementTitle: 'Gestión de Usuarios',
  usersManagementAdminDescription: 'Administrar estudiantes, entrenadores y administradores del club',
  usersManagementTrainerDescription: 'Administrar estudiantes del club',
  usersTabStudents: 'Estudiantes',
  usersTabTrainers: 'Entrenadores',
  usersTabAdministrators: 'Administradores',
  myProfile: 'Mi Perfil',
  dashboard: 'Dashboard',
});

const normalizeRole = (value = '') => value.toLowerCase();

export const semanticCatalog = Object.freeze({
  ROLE_LABELS,
  USER_TYPE_LABELS,
  PANEL_LABELS,
  UI_LABELS,
});

export const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_LABELS[normalizedRole] || role || 'Usuario';
};

export const getUserTypeLabel = (userType) => {
  const normalizedUserType = normalizeRole(userType);
  return USER_TYPE_LABELS[normalizedUserType] || userType || 'Usuario';
};
