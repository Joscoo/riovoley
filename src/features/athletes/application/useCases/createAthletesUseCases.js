import { withEncryptedUserContactFields } from '../../../../utils/piiCrypto';
import { MIN_ATHLETE_AGE, calculateAgeFromDate, validateAthleteBirthDate } from '../../../../utils/athleteValidation';
import { deleteAuthUserById } from '../../../../shared/infrastructure/auth/deleteAuthUserById';

const buildAthleteViewModel = (student) => ({
  ...student,
  email: student.users?.email || 'No disponible',
  telefono: student.users?.telefono || 'No disponible',
  full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim() || `Atleta ${student.id}`,
});

export const createAthletesUseCases = (repository) => {
  const normalizeText = (value = '') =>
    value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const loadAtletasUseCase = {
    execute: async ({ query } = {}) => {
      const studentsData = await repository.listAthletes({ query });
      return (studentsData || []).map(buildAthleteViewModel);
    },
  };

  const updateAtletaUseCase = {
    execute: async ({ editingAtleta, formData }) => {
      const birthDateValidation = validateAthleteBirthDate(formData.fecha_nacimiento, MIN_ATHLETE_AGE);
      if (!birthDateValidation.isValid) {
        throw new Error(birthDateValidation.error);
      }

      const userUpdatePayload = await withEncryptedUserContactFields({
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento,
      });

      await repository.updateUser(editingAtleta.user_id, userUpdatePayload);
      await repository.updateStudent(editingAtleta.id, {
        categoria: formData.categoria,
        fecha_nacimiento: formData.fecha_nacimiento,
      });
    },
  };

  const validateAthleteFormUseCase = {
    execute: ({ formData }) => {
      if (!formData?.nombre?.trim()) {
        return { isValid: false, error: 'El nombre del usuario es requerido' };
      }

      if (!formData?.apellido?.trim()) {
        return { isValid: false, error: 'El apellido del usuario es requerido' };
      }

      if (!formData?.email?.trim()) {
        return { isValid: false, error: 'El email es requerido para crear la cuenta de usuario' };
      }

      if (!formData?.fecha_nacimiento) {
        return { isValid: false, error: 'La fecha de nacimiento es requerida' };
      }

      const birthDateValidation = validateAthleteBirthDate(formData.fecha_nacimiento, MIN_ATHLETE_AGE);
      if (!birthDateValidation.isValid) {
        return { isValid: false, error: birthDateValidation.error };
      }

      if (!formData?.categoria) {
        return { isValid: false, error: 'La categoria deportiva es requerida para el atleta' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return { isValid: false, error: 'Por favor ingrese un email valido' };
      }

      return { isValid: true, error: null };
    },
  };

  const filterAndSortAtletasUseCase = {
    execute: ({ athletes, filters }) => {
      const getSortableValue = (athlete) => {
        switch (filters?.sortBy) {
          case 'nombre':
            return normalizeText(athlete.users?.nombre || athlete.full_name || '');
          case 'categoria':
            return normalizeText(athlete.categoria || '');
          case 'edad': {
            const age = calculateAgeFromDate(athlete.fecha_nacimiento);
            return Number.isFinite(age) ? age : Number.MAX_SAFE_INTEGER;
          }
          case 'ingreso': {
            const ingresoDate = athlete.users?.created_at
              ? new Date(athlete.users.created_at).getTime()
              : Number.MAX_SAFE_INTEGER;
            return Number.isFinite(ingresoDate) ? ingresoDate : Number.MAX_SAFE_INTEGER;
          }
          case 'apellido':
          default:
            return normalizeText(athlete.users?.apellido || athlete.full_name || '');
        }
      };

      let result = [...(athletes || [])];

      if (filters?.categoria) {
        result = result.filter((athlete) => athlete.categoria === filters.categoria);
      }

      if (filters?.search) {
        const searchLower = normalizeText(filters.search);
        result = result.filter((athlete) => (
          normalizeText(athlete.full_name).includes(searchLower)
          || normalizeText(athlete.users?.nombre).includes(searchLower)
          || normalizeText(athlete.users?.apellido).includes(searchLower)
          || normalizeText(athlete.categoria).includes(searchLower)
          || normalizeText(athlete.email).includes(searchLower)
        ));
      }

      result.sort((a, b) => {
        const valueA = getSortableValue(a);
        const valueB = getSortableValue(b);

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return filters?.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        }

        if (valueA < valueB) {
          return filters?.sortOrder === 'asc' ? -1 : 1;
        }

        if (valueA > valueB) {
          return filters?.sortOrder === 'asc' ? 1 : -1;
        }

        return 0;
      });

      return result;
    },
  };

  const paginateAtletasUseCase = {
    execute: ({ athletes, page, pageSize }) => {
      const safePageSize = pageSize > 0 ? pageSize : 1;
      const totalPages = Math.max(1, Math.ceil((athletes || []).length / safePageSize));
      const currentPage = Math.min(Math.max(page || 1, 1), totalPages);
      const paginated = (athletes || []).slice(
        (currentPage - 1) * safePageSize,
        (currentPage - 1) * safePageSize + safePageSize
      );

      return { totalPages, currentPage, paginated };
    },
  };

  const calculateAthleteAgeDisplayUseCase = {
    execute: ({ birthDate }) => {
      if (!birthDate) return '--';

      try {
        const age = calculateAgeFromDate(birthDate);
        if (age === null || age < 0) return '--';
        return age;
      } catch (_error) {
        return '--';
      }
    },
  };

  const formatIngresoDateUseCase = {
    execute: ({ athlete }) => {
      try {
        if (athlete?.users?.created_at) {
          const date = new Date(athlete.users.created_at);
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        }
      } catch (_error) {
        return 'No registrado';
      }

      return 'No registrado';
    },
  };

  const formatCategoriaUseCase = {
    execute: ({ categoria }) => {
      if (!categoria) return '--';
      return categoria.replaceAll('_', ' ').toUpperCase();
    },
  };

  const deleteAtletaRecordsUseCase = {
    execute: async ({ atleta }) => {
      await repository.deleteStudent(atleta.id);
      let userDeletionError = null;

      if (atleta.user_id) {
        try {
          await repository.deleteUser(atleta.user_id);
        } catch (error) {
          userDeletionError = error.message;
        }
      }

      return { userDeletionError };
    },
  };

  const listOrphanUsersUseCase = {
    execute: async () => {
      const [studentsUserIds, studentRoleUsers] = await Promise.all([
        repository.listStudentUserIds(),
        repository.listStudentRoleUsers(),
      ]);

      const activeUserIds = new Set((studentsUserIds || []).map((entry) => entry.user_id).filter(Boolean));
      return (studentRoleUsers || []).filter((user) => !activeUserIds.has(user.id));
    },
  };

  const deleteUserRecordUseCase = {
    execute: async ({ userId }) => repository.deleteUser(userId),
  };

  const deleteAtletaCompletelyUseCase = {
    execute: async ({ atleta }) => {
      if (atleta?.user_id) {
        await deleteAuthUserById(atleta.user_id);
      }

      return deleteAtletaRecordsUseCase.execute({ atleta });
    },
  };

  const cleanOrphanUsersUseCase = {
    execute: async () => {
      const orphanUsers = await listOrphanUsersUseCase.execute();

      if (!orphanUsers || orphanUsers.length === 0) {
        return { deletedCount: 0, failedCount: 0 };
      }

      let deletedCount = 0;
      let failedCount = 0;

      for (const orphanUser of orphanUsers) {
        try {
          await deleteAuthUserById(orphanUser.id);
          await deleteUserRecordUseCase.execute({ userId: orphanUser.id });
          deletedCount += 1;
        } catch (deleteUserError) {
          failedCount += 1;
          console.warn(`No se pudo limpiar el usuario ${orphanUser.email}:`, deleteUserError.message);
        }
      }

      return { deletedCount, failedCount };
    },
  };

  return {
    loadAtletasUseCase,
    updateAtletaUseCase,
    validateAthleteFormUseCase,
    filterAndSortAtletasUseCase,
    paginateAtletasUseCase,
    calculateAthleteAgeDisplayUseCase,
    formatIngresoDateUseCase,
    formatCategoriaUseCase,
    deleteAtletaRecordsUseCase,
    listOrphanUsersUseCase,
    deleteUserRecordUseCase,
    deleteAtletaCompletelyUseCase,
    cleanOrphanUsersUseCase,
  };
};
