import { supabase } from '../../../../config/supabase';
import { userProvisioningService } from '../../../user-provisioning';
import { deleteAuthUserById } from '../../../../shared/infrastructure/auth/deleteAuthUserById';
import { WhatsAppBusinessService } from '../../../../shared/infrastructure/communications';
import { withEncryptedUserContactFields } from '../../../../utils/piiCrypto';
import { getEcuadorISOString } from '../../../../utils/dateUtils';
import { UserManagementError } from '../../domain/userManagementError';
import { isPrimaryAdminUserId } from '../../domain/adminPrivileges';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const normalizeAthletes = (studentsData, usersData, sort = {}) => {
  const usersMap = new Map((usersData || []).map((user) => [user.id, user]));

  const normalized = (studentsData || [])
    .map((student) => {
      const user = usersMap.get(student.user_id) || {};
      return {
        id: student.id,
        user_id: student.user_id,
        categoria: student.categoria,
        fecha_ingreso: student.fecha_ingreso,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        full_name: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
        email: user.email || '',
        telefono: user.telefono || '',
        fecha_nacimiento: user.fecha_nacimiento || student.fecha_nacimiento,
        role: user.role || 'estudiante',
        suspended: user.suspended || false,
        suspension_reason: user.suspension_reason,
        suspension_until: user.suspension_until,
        created_at: user.created_at,
        last_login: user.last_login,
      };
    });

  const directionFactor = sort?.direction === 'desc' ? -1 : 1;
  const sortField = sort?.field || 'apellido';
  normalized.sort((a, b) => {
    const valueA = String(a[sortField] || a.apellido || '');
    const valueB = String(b[sortField] || b.apellido || '');
    if (valueA < valueB) return -1 * directionFactor;
    if (valueA > valueB) return 1 * directionFactor;
    return 0;
  });

  return normalized;
};

const trimNullable = (value) => value?.trim?.() || null;

const getCurrentAuthenticatedUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('No se pudo obtener el usuario autenticado:', error.message);
    return null;
  }

  return data?.user?.id || null;
};

export class SupabaseUserManagementRepository {
  async listAthletes({ query } = {}) {
    let studentsRequest = supabase
      .from('students')
      .select('*')
      .order('id', { ascending: true });

    if (query?.filters?.categoria) {
      studentsRequest = studentsRequest.eq('categoria', query.filters.categoria);
    }

    const { data: studentsData, error: studentsError } = await studentsRequest;

    if (studentsError) {
      throw new UserManagementError(normalizeError(studentsError, 'Error al cargar atletas'), studentsError);
    }

    if (!studentsData || studentsData.length === 0) {
      return [];
    }

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    const userIds = studentsData.map((student) => student.user_id).filter(Boolean);
    if (userIds.length === 0) {
      return normalizeAthletes(studentsData, [], sort);
    }

    let usersRequest = supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (filters.status === 'active') {
      usersRequest = usersRequest.eq('suspended', false);
    } else if (filters.status === 'suspended') {
      usersRequest = usersRequest.eq('suspended', true);
    }

    if (filters.search) {
      const searchValue = String(filters.search).trim();
      usersRequest = usersRequest.or(
        `nombre.ilike.%${searchValue}%,apellido.ilike.%${searchValue}%,email.ilike.%${searchValue}%`
      );
    }

    const allowedSortField = ['nombre', 'apellido', 'created_at', 'fecha_nacimiento'].includes(sort.field)
      ? sort.field
      : 'apellido';
    if (sort.field && sort.direction && sort.direction !== 'none') {
      usersRequest = usersRequest.order(allowedSortField, { ascending: sort.direction === 'asc' });
    }

    const { data: usersData, error: usersError } = await usersRequest;

    if (usersError) {
      console.warn('No se pudieron cargar datos de usuarios para atletas:', usersError);
    }

    return normalizeAthletes(studentsData, usersData || [], sort);
  }

  async listTrainers({ query } = {}) {
    let request = supabase
      .from('users')
      .select('*')
      .eq('role', 'entrenador');

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (filters.status === 'active') {
      request = request.eq('suspended', false);
    } else if (filters.status === 'suspended') {
      request = request.eq('suspended', true);
    }

    if (filters.search) {
      const searchValue = String(filters.search).trim();
      request = request.or(`nombre.ilike.%${searchValue}%,apellido.ilike.%${searchValue}%,email.ilike.%${searchValue}%`);
    }

    if (sort.field && sort.direction && sort.direction !== 'none') {
      const allowedSortField = ['nombre', 'apellido', 'email', 'created_at'].includes(sort.field)
        ? sort.field
        : 'apellido';
      request = request.order(allowedSortField, { ascending: sort.direction === 'asc' });
    } else {
      request = request.order('apellido', { ascending: true });
    }

    const { data, error } = await request;

    if (error) {
      throw new UserManagementError(normalizeError(error, 'Error al cargar entrenadores'), error);
    }

    return data || [];
  }

  async listAdministrators({ query } = {}) {
    let request = supabase
      .from('users')
      .select('*')
      .eq('role', 'administrador');

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (filters.search) {
      const searchValue = String(filters.search).trim();
      request = request.or(`nombre.ilike.%${searchValue}%,apellido.ilike.%${searchValue}%,email.ilike.%${searchValue}%`);
    }

    if (sort.field && sort.direction && sort.direction !== 'none') {
      const allowedSortField = ['nombre', 'apellido', 'email', 'created_at'].includes(sort.field)
        ? sort.field
        : 'apellido';
      request = request.order(allowedSortField, { ascending: sort.direction === 'asc' });
    } else {
      request = request.order('apellido', { ascending: true });
    }

    const { data, error } = await request;

    if (error) {
      throw new UserManagementError(normalizeError(error, 'Error al cargar administradores'), error);
    }

    return data || [];
  }

  async createUser(formData, userType) {
    if (userType === 'atleta') {
      return userProvisioningService.createStudent({
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        fecha_nacimiento: formData.fecha_nacimiento,
        categoria: formData.categoria,
      });
    }

    return userProvisioningService.createUser({
      email: formData.email,
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
      fecha_nacimiento: formData.fecha_nacimiento,
      role: userType === 'entrenador' ? 'entrenador' : 'administrador',
    });
  }

  async updateUser(userId, formData, userType) {
    const updateData = {
      nombre: trimNullable(formData.nombre),
      apellido: trimNullable(formData.apellido),
      fecha_nacimiento: formData.fecha_nacimiento,
    };

    if (formData.telefono || formData.email) {
      const encryptedData = await withEncryptedUserContactFields({
        telefono: formData.telefono || null,
        email: trimNullable(formData.email),
      });

      if (encryptedData.telefono_ciphertext) {
        updateData.telefono = formData.telefono;
        updateData.telefono_ciphertext = encryptedData.telefono_ciphertext;
        updateData.telefono_search_exact = encryptedData.telefono_search_exact;
        updateData.telefono_search_partial = encryptedData.telefono_search_partial;
        updateData.telefono_masked = encryptedData.telefono_masked;
      }

      if (encryptedData.email_ciphertext) {
        updateData.email_ciphertext = encryptedData.email_ciphertext;
        updateData.email_search_exact = encryptedData.email_search_exact;
        updateData.email_search_partial = encryptedData.email_search_partial;
        updateData.email_masked = encryptedData.email_masked;
      }
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      throw new UserManagementError(`Error al actualizar usuario: ${normalizeError(updateError, 'Error desconocido')}`, updateError);
    }

    if (userType === 'atleta' && formData.categoria) {
      const { error: studentError } = await supabase
        .from('students')
        .update({ categoria: formData.categoria })
        .eq('user_id', userId);

      if (studentError) {
        console.warn('No se pudo actualizar categoria del atleta:', studentError.message);
      }
    }

    const fullName = `${trimNullable(formData.nombre) || ''} ${trimNullable(formData.apellido) || ''}`.trim();
    await supabase
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', userId);

    return updatedUser;
  }

  async deleteUser(userId, userType) {
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (targetUserError || !targetUser) {
      throw new UserManagementError(
        `Error al validar el usuario a eliminar: ${normalizeError(targetUserError, 'Usuario no encontrado')}`,
        targetUserError,
      );
    }

    if (targetUser.role === 'administrador') {
      throw new UserManagementError('No se puede eliminar una cuenta de administrador desde este módulo.');
    }

    if (userType === 'atleta') {
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('user_id', userId);

      if (studentError) {
        console.warn('Error eliminando estudiante:', studentError.message);
      }
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.warn('Error eliminando perfil:', profileError.message);
    }

    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      throw new UserManagementError(
        `Error al eliminar usuario de la base de datos: ${normalizeError(userError, 'Error desconocido')}`,
        userError,
      );
    }

    await deleteAuthUserById(userId);

    return { success: true };
  }

  async suspendUser(userId, reason, until) {
    const updateData = {
      suspended: true,
      suspension_reason: reason,
      suspended_at: getEcuadorISOString(),
    };

    if (until) {
      updateData.suspension_until = until;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new UserManagementError(`Error al suspender usuario: ${normalizeError(error, 'Error desconocido')}`, error);
    }

    return data;
  }

  async reactivateUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .update({
        suspended: false,
        suspension_reason: null,
        suspension_until: null,
        suspended_at: null,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new UserManagementError(`Error al reactivar usuario: ${normalizeError(error, 'Error desconocido')}`, error);
    }

    return data;
  }

  async resendCredentials(userId, channels = ['email']) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, nombre, apellido')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new UserManagementError('No se pudo obtener la informacion del usuario', userError);
    }

    const result = await userProvisioningService.resendCredentials({
      user_id: userData.id,
      email: userData.email,
      nombre: userData.nombre,
      apellido: userData.apellido,
    });

    if (channels.includes('whatsapp')) {
      const { data: userWithPhone } = await supabase
        .from('users')
        .select('telefono')
        .eq('id', userId)
        .single();

      if (userWithPhone?.telefono) {
        try {
          const whatsappBusiness = new WhatsAppBusinessService();
          await whatsappBusiness.sendCredentials(
            {
              telefono: userWithPhone.telefono,
              nombre: userData.nombre,
              apellido: userData.apellido,
              email: userData.email,
            },
            result?.credentials?.password,
          );
        } catch (whatsappError) {
          console.warn('Error enviando por WhatsApp:', whatsappError?.message || whatsappError);
        }
      }
    }

    return result;
  }

  async changeRole(userId, newRole) {
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (targetUserError || !targetUser) {
      throw new UserManagementError(
        `Error al validar el usuario para cambio de rol: ${normalizeError(targetUserError, 'Usuario no encontrado')}`,
        targetUserError,
      );
    }

    if (targetUser.role === 'administrador' && newRole !== 'administrador') {
      const currentUserId = await getCurrentAuthenticatedUserId();
      if (currentUserId && currentUserId === userId) {
        throw new UserManagementError('No puedes quitarte a ti mismo el rol de administrador.');
      }

      if (!isPrimaryAdminUserId(currentUserId)) {
        throw new UserManagementError('Solo el administrador principal puede cambiar el rol de otro administrador.');
      }
    }

    const { data: updatedUser, error: userError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new UserManagementError(`Error al cambiar rol en usuarios: ${normalizeError(userError, 'Error desconocido')}`, userError);
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (profileError) {
      console.warn('Error actualizando rol en perfiles:', profileError.message);
    }

    if (newRole === 'estudiante') {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingStudent) {
        const { data: userData } = await supabase
          .from('users')
          .select('fecha_nacimiento')
          .eq('id', userId)
          .single();

        if (userData?.fecha_nacimiento) {
          await supabase
            .from('students')
            .insert({
              user_id: userId,
              categoria: 'iniciacion_hombres',
              fecha_nacimiento: userData.fecha_nacimiento,
            });
        }
      }
    }

    return updatedUser;
  }
}
