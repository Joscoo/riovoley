import {
  FaChalkboardTeacher,
  FaCog,
  FaUser,
  FaUserCircle,
  FaUserShield,
  FaUsers,
  FaVolleyballBall,
} from 'react-icons/fa';

const normalizeKey = (value = '') => value.toLowerCase();

const ICONS = Object.freeze({
  user: FaUser,
  users: FaUsers,
  userAvatar: FaUserCircle,
  student: FaUser,
  trainer: FaChalkboardTeacher,
  administrator: FaUserShield,
  sports: FaVolleyballBall,
  settings: FaCog,
});

const ROLE_ICONS = Object.freeze({
  estudiante: ICONS.student,
  usuario: ICONS.student,
  entrenador: ICONS.trainer,
  administrador: ICONS.administrator,
});

const USER_TYPE_ICONS = Object.freeze({
  atleta: ICONS.student,
  entrenador: ICONS.trainer,
  administrador: ICONS.administrator,
});

export const iconRegistry = Object.freeze({
  ...ICONS,
  roles: ROLE_ICONS,
  userTypes: USER_TYPE_ICONS,
});

export const getRoleIcon = (role) => {
  const normalizedRole = normalizeKey(role);
  return ROLE_ICONS[normalizedRole] || ICONS.user;
};

export const getUserTypeIcon = (userType) => {
  const normalizedUserType = normalizeKey(userType);
  return USER_TYPE_ICONS[normalizedUserType] || ICONS.user;
};
