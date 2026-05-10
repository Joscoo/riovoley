import { supabase } from '../../../../config/supabase';
import { TrainerManagementError } from '../../domain/trainerManagementError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseTrainerManagementRepository {
  async listTrainers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'entrenador')
      .order('created_at', { ascending: false });

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
