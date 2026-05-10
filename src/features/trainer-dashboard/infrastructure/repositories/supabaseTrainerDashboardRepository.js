import { supabase } from '../../../../config/supabase';
import { TrainerDashboardError } from '../../domain/trainerDashboardError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseTrainerDashboardRepository {
  async countStudents() {
    const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true });
    if (error) throw new TrainerDashboardError(normalizeError(error, 'Error contando atletas'), error);
    return count || 0;
  }

  async countAttendancesByDate(date) {
    const { count, error } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', date);
    if (error) throw new TrainerDashboardError(normalizeError(error, 'Error contando asistencias'), error);
    return count || 0;
  }

  async countPhysicalTestsFromDate(dateFrom) {
    const { count, error } = await supabase
      .from('physical_tests')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_test', dateFrom);
    if (error) throw new TrainerDashboardError(normalizeError(error, 'Error contando tests fisicos'), error);
    return count || 0;
  }

  async countPaymentsFromDate(dateFrom) {
    const { count, error } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_pago', dateFrom);
    if (error) throw new TrainerDashboardError(normalizeError(error, 'Error contando pagos del mes'), error);
    return count || 0;
  }
}
