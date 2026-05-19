import { supabase } from '../../../../config/supabase';
import { SchedulesError } from '../../domain/schedulesError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseSchedulesRepository {
  async listSchedules({ query } = {}) {
    let request = supabase
      .from('schedules')
      .select('*');

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (filters.dia_semana && filters.dia_semana !== 'todos') {
      request = request.eq('dia_semana', filters.dia_semana);
    }

    if (filters.categoria && filters.categoria !== 'todos') {
      request = request.eq('categoria', filters.categoria);
    }

    if (sort.field && sort.direction && sort.direction !== 'none') {
      const allowedField = ['dia_semana', 'hora_inicio', 'hora_fin', 'categoria'].includes(sort.field)
        ? sort.field
        : 'dia_semana';
      request = request.order(allowedField, { ascending: sort.direction === 'asc' });
      if (allowedField !== 'hora_inicio') {
        request = request.order('hora_inicio', { ascending: true });
      }
    } else {
      request = request
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });
    }

    const { data, error } = await request;

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
