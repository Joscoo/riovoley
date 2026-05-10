import { supabase } from '../../../../config/supabase';
import { AuthProfileError } from '../../domain/authProfileError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseAuthProfileRepository {
  async findUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, role, organization_id, full_name, created_at')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new AuthProfileError(normalizeError(error, 'Error al consultar user_profiles'), error);
    }

    return data || null;
  }

  async findCoreUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, role, nombre, apellido')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AuthProfileError(normalizeError(error, 'Error al consultar usuarios base'), error);
    }

    return data;
  }

  async upsertUserProfile(profile) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new AuthProfileError(normalizeError(error, 'Error al sincronizar perfil'), error);
    }

    return data;
  }

  async createFallbackProfile(profile) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw new AuthProfileError(normalizeError(error, 'Error al crear perfil base'), error);
    }

    return data;
  }
}
