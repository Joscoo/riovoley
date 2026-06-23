import { supabase } from '../../../../config/supabase';
import { StudentDashboardError } from '../../domain/studentDashboardError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseStudentDashboardRepository {
  async findStudentByUserId(userId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users!inner(
          id,
          nombre,
          apellido,
          email,
          telefono,
          role
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new StudentDashboardError(normalizeError(error, 'Error cargando estudiante'), error);
    }

    return data;
  }

  async listCurrentPayments(studentId, today) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .lte('fecha_inicio', today)
      .gte('fecha_fin', today)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      throw new StudentDashboardError(normalizeError(error, 'Error cargando estado de pago'), error);
    }

    return data || [];
  }

  async listPaymentsByStudentId(studentId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      throw new StudentDashboardError(normalizeError(error, 'Error cargando historial de pagos'), error);
    }

    return data || [];
  }

  async listPhysicalTests(studentId) {
    const { data, error } = await supabase
      .from('physical_tests')
      .select('*')
      .eq('student_id', studentId)
      .order('fecha_test', { ascending: true });

    if (error) {
      throw new StudentDashboardError(normalizeError(error, 'Error cargando tests fisicos'), error);
    }

    return data || [];
  }

  async listAttendancesFromDate(studentId, dateFrom) {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('student_id', studentId)
      .gte('fecha', dateFrom)
      .order('fecha', { ascending: false });

    if (error) {
      throw new StudentDashboardError(normalizeError(error, 'Error cargando asistencias'), error);
    }

    return data || [];
  }

  subscribeToPaymentChanges(studentId, onChange) {
    if (!studentId || typeof onChange !== 'function') {
      return () => {};
    }

    const channel = supabase
      .channel(`student-dashboard-payments-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `student_id=eq.${studentId}`,
        },
        onChange
      )
      .subscribe();

    return () => {
      if (typeof channel?.unsubscribe === 'function') {
        channel.unsubscribe();
      } else if (typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel);
      }
    };
  }
}
