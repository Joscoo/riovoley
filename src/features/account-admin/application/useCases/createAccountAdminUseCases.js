import { deleteAuthUserById } from '../../../../shared/infrastructure/auth/deleteAuthUserById';
import { getEcuadorISOString } from '../../../../utils/dateUtils';

const applySearchAndStatusFilters = (users, filters) => {
  let filteredData = users || [];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter((usuarioEntry) =>
      usuarioEntry.nombre?.toLowerCase().includes(searchLower) ||
      usuarioEntry.apellido?.toLowerCase().includes(searchLower) ||
      usuarioEntry.email?.toLowerCase().includes(searchLower));
  }

  if (filters.status === 'activo') {
    filteredData = filteredData.filter((usuarioEntry) => !usuarioEntry.suspended);
  } else if (filters.status === 'suspendido') {
    filteredData = filteredData.filter((usuarioEntry) => usuarioEntry.suspended);
  }

  return filteredData;
};

export const createAccountAdminUseCases = (repository) => {
  const loadUsuariosUseCase = {
    execute: async ({ filters }) => {
      const users = await repository.listUsersByRole(filters.role);
      return applySearchAndStatusFilters(users, filters);
    },
  };

  const updateManagedUserUseCase = {
    execute: async ({ editingUser, formData }) => {
      await repository.updateUser(editingUser.id, {
        role: formData.role,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono
      });

      await repository.upsertUserProfile({
        id: editingUser.id,
        role: formData.role,
        full_name: `${formData.nombre} ${formData.apellido}`.trim()
      });
    },
  };

  const deleteManagedUserUseCase = {
    execute: async ({ userId }) => {
      await deleteAuthUserById(userId);
      await repository.deleteUser(userId);
    },
  };

  const suspendManagedUserUseCase = {
    execute: async ({ userId, reason, until }) => {
      await repository.updateUserSuspension(userId, {
        suspended: true,
        suspension_reason: reason,
        suspension_until: until,
        suspended_at: getEcuadorISOString()
      });
    },
  };

  const reactivateManagedUserUseCase = {
    execute: async ({ userId }) => {
      await repository.updateUserSuspension(userId, {
        suspended: false,
        suspension_reason: null,
        suspension_until: null,
        suspended_at: null
      });
    },
  };

  const loadProfileDataUseCase = {
    execute: async ({ user }) => {
      const [profileData, usersData] = await Promise.all([
        repository.getProfileById(user.id),
        repository.getUserById(user.id)
      ]);

      if (usersData) {
        return {
          userProfile: profileData,
          userData: usersData,
          formData: {
            nombre: usersData.nombre || '',
            apellido: usersData.apellido || '',
            telefono: usersData.telefono || '',
            fecha_nacimiento: usersData.fecha_nacimiento || ''
          }
        };
      }

      const nameParts = profileData.full_name?.split(' ') || [];
      const fallbackData = {
        id: user.id,
        email: user.email,
        nombre: nameParts[0] || '',
        apellido: nameParts.slice(1).join(' ') || '',
        telefono: '',
        fecha_nacimiento: ''
      };

      return {
        userProfile: profileData,
        userData: fallbackData,
        formData: {
          nombre: fallbackData.nombre,
          apellido: fallbackData.apellido,
          telefono: fallbackData.telefono,
          fecha_nacimiento: fallbackData.fecha_nacimiento
        }
      };
    },
  };

  const updateProfileDataUseCase = {
    execute: async ({ user, userProfile, formData }) => {
      const existingUser = await repository.getUserById(user.id);

      if (existingUser) {
        await repository.updateUser(user.id, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento
        });
      } else {
        await repository.insertUser({
          id: user.id,
          email: user.email,
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento,
          role: userProfile?.role || 'usuario'
        });
      }

      const fullName = `${formData.nombre} ${formData.apellido}`.trim();
      await repository.updateUserProfileName(user.id, fullName);
    },
  };

  const changePasswordUseCase = {
    execute: async ({ user, passwordData }) => {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        return { ok: false, code: 'MISSING_FIELDS', message: 'Por favor completa todos los campos' };
      }

      if (passwordData.newPassword.length < 6) {
        return { ok: false, code: 'WEAK_PASSWORD', message: 'La nueva contrasena debe tener al menos 6 caracteres' };
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return { ok: false, code: 'PASSWORD_MISMATCH', message: 'Las contrasenas no coinciden' };
      }

      const verification = await repository.verifyCurrentPassword(user.email, passwordData.currentPassword);
      if (!verification.ok) {
        return { ok: false, code: 'INVALID_CURRENT_PASSWORD', message: 'La contrasena actual es incorrecta' };
      }

      await repository.updatePassword(passwordData.newPassword);
      return { ok: true };
    },
  };

  return {
    loadUsuariosUseCase,
    updateManagedUserUseCase,
    deleteManagedUserUseCase,
    suspendManagedUserUseCase,
    reactivateManagedUserUseCase,
    loadProfileDataUseCase,
    updateProfileDataUseCase,
    changePasswordUseCase,
  };
};
