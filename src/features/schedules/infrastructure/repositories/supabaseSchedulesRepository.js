import { supabase } from '../../../../config/supabase';
import { SchedulesError } from '../../domain/schedulesError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseSchedulesRepository {
  async listSchedules() {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      throw new SchedulesError(normalizeError(error, 'Error cargando horarios'), error);
    }

    return data || [];
  }

  async updateSchedule(scheduleId, payload) {
    const { error } = await supabase
      .from('schedules')
      .update(payload)
      .eq('id', scheduleId);

    if (error) {
      throw new SchedulesError(normalizeError(error, 'Error actualizando horario'), error);
    }
  }

  async createSchedules(payloads) {
    const { error } = await supabase
      .from('schedules')
      .insert(payloads);

    if (error) {
      throw new SchedulesError(normalizeError(error, 'Error creando horarios'), error);
    }
  }

  async deleteSchedule(scheduleId) {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      throw new SchedulesError(normalizeError(error, 'Error eliminando horario'), error);
    }
  }
}
