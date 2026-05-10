import { withEncryptedUserContactFields } from '../../../utils/piiCrypto';
import { MIN_ATHLETE_AGE, validateAthleteBirthDate } from '../../../utils/athleteValidation';
import { deleteAuthUserById } from '../../../shared/infrastructure/auth/deleteAuthUserById';
import { SupabaseAthletesRepository } from '../infrastructure/repositories/supabaseAthletesRepository';

export const createAthletesService = (repository = new SupabaseAthletesRepository()) => {
  const loadAtletas = async () => {
    const studentsData = await repository.listAthletes();
    return (studentsData || []).map((student) => ({
      ...student,
      email: student.users?.email || 'No disponible',
      telefono: student.users?.telefono || 'No disponible',
      full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim() || `Atleta ${student.id}`,
    }));
  };

  const updateAtleta = async ({ editingAtleta, formData }) => {
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
  };

  const deleteAtletaRecords = async ({ atleta }) => {
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
  };

  const listOrphanUsers = async () => {
    const [studentsUserIds, studentRoleUsers] = await Promise.all([
      repository.listStudentUserIds(),
      repository.listStudentRoleUsers(),
    ]);

    const activeUserIds = new Set((studentsUserIds || []).map((entry) => entry.user_id).filter(Boolean));
    return (studentRoleUsers || []).filter((user) => !activeUserIds.has(user.id));
  };

  const deleteUserRecord = async ({ userId }) => {
    await repository.deleteUser(userId);
  };

  const deleteAtletaCompletely = async ({ atleta }) => {
    if (atleta?.user_id) {
      await deleteAuthUserById(atleta.user_id);
    }

    return deleteAtletaRecords({ atleta });
  };

  const cleanOrphanUsers = async () => {
    const orphanUsers = await listOrphanUsers();

    if (!orphanUsers || orphanUsers.length === 0) {
      return { deletedCount: 0, failedCount: 0 };
    }

    let deletedCount = 0;
    let failedCount = 0;

    for (const orphanUser of orphanUsers) {
      try {
        await deleteAuthUserById(orphanUser.id);
        await deleteUserRecord({ userId: orphanUser.id });
        deletedCount += 1;
      } catch (deleteUserError) {
        failedCount += 1;
        console.warn(`No se pudo limpiar el usuario ${orphanUser.email}:`, deleteUserError.message);
      }
    }

    return { deletedCount, failedCount };
  };

  return {
    loadAtletas,
    updateAtleta,
    deleteAtletaRecords,
    deleteAtletaCompletely,
    listOrphanUsers,
    cleanOrphanUsers,
    deleteUserRecord,
  };
};
