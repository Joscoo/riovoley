import { supabase } from '../../../../config/supabase';
import { AccountAdminError } from '../../domain/accountAdminError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseAccountAdminRepository {
  async listUsersByRole(role) {
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        nombre,
        apellido,
        telefono,
        fecha_nacimiento,
        last_login,
        created_at,
        suspended,
        suspension_reason,
        suspension_until,
        suspended_at
      `)
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error cargando usuarios'), error);
    }

    return data || [];
  }

  async updateUser(userId, payload) {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId);

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error actualizando usuario'), error);
    }
  }

  async upsertUserProfile(payload) {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error actualizando perfil de usuario'), error);
    }
  }

  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error eliminando usuario'), error);
    }
  }

  async updateUserSuspension(userId, payload) {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId);

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error actualizando suspension'), error);
    }
  }

  async getProfileById(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error cargando perfil'), error);
    }

    return data;
  }

  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AccountAdminError(normalizeError(error, 'Error cargando usuario'), error);
    }

    return data || null;
  }

  async insertUser(payload) {
    const { error } = await supabase
      .from('users')
      .insert(payload);

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error insertando usuario'), error);
    }
  }

  async updateUserProfileName(userId, fullName) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', userId);

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error actualizando nombre de perfil'), error);
    }
  }

  async verifyCurrentPassword(email, currentPassword) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword
    });

    return { ok: !error, error };
  }

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new AccountAdminError(normalizeError(error, 'Error actualizando Contraseña'), error);
    }
  }
}
