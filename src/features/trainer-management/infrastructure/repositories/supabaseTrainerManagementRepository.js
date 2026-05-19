import { supabase } from '../../../../config/supabase';
import { TrainerManagementError } from '../../domain/trainerManagementError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseTrainerManagementRepository {
  async listTrainers({ query } = {}) {
    let request = supabase
      .from('users')
      .select('*')
      .eq('role', 'entrenador');

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (filters.search) {
      const searchValue = String(filters.search).trim();
      request = request.or(`nombre.ilike.%${searchValue}%,apellido.ilike.%${searchValue}%,email.ilike.%${searchValue}%`);
    }

    if (filters.status === 'active') {
      request = request.eq('suspended', false);
    } else if (filters.status === 'suspended') {
      request = request.eq('suspended', true);
    }

    if (sort.field && sort.direction && sort.direction !== 'none') {
      const allowedField = ['nombre', 'apellido', 'email', 'created_at'].includes(sort.field)
        ? sort.field
        : 'created_at';
      request = request.order(allowedField, { ascending: sort.direction === 'asc' });
    } else {
      request = request.order('created_at', { ascending: false });
    }

    const { data, error } = await request;

    if (error) {
      throw new TrainerManagementError(normalizeError(error, 'Error cargando entrenadores'), error);
    }

    return data || [];
  }

  async updateTrainer(trainerId, payload) {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', trainerId);

    if (error) {
      throw new TrainerManagementError(normalizeError(error, 'Error actualizando entrenador'), error);
    }
  }

  async deleteTrainer(trainerId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', trainerId);

    if (error) {
      throw new TrainerManagementError(normalizeError(error, 'Error eliminando entrenador'), error);
    }
  }
}
