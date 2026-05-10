import { supabase } from '../../../../config/supabase';
import { AdminDashboardError } from '../../domain/adminDashboardError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseAdminDashboardRepository {
  async countStudents() {
    const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true });
    if (error) throw new AdminDashboardError(normalizeError(error, 'Error contando atletas'), error);
    return count || 0;
  }

  async listActivePayers() {
    const { data, error } = await supabase.from('payments').select('student_id').eq('estado', 'activo');
    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando pagadores activos'), error);
    return data || [];
  }

  async listMonthlyPayments({ firstDayOfMonth, lastDayOfMonth }) {
    const { data, error } = await supabase
      .from('payments')
      .select('monto')
      .not('fecha_pago', 'is', null)
      .gte('fecha_pago', firstDayOfMonth)
      .lte('fecha_pago', lastDayOfMonth)
      .is('deleted_at', null);

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando pagos del mes'), error);
    return data || [];
  }

  async listPaymentsForExpiration() {
    const { data, error } = await supabase
      .from('payments')
      .select('student_id, fecha_fin, fecha_inicio')
      .is('deleted_at', null)
      .order('fecha_fin', { ascending: false });

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando vencimientos'), error);
    return data || [];
  }

  async countAttendancesByDate(date) {
    const { count, error } = await supabase
      .from('attendances')
      .select('*', { count: 'exact', head: true })
      .eq('fecha', date);

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error contando asistencias'), error);
    return count || 0;
  }

  async listStudentCategories() {
    const { data, error } = await supabase.from('students').select('categoria');
    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando categorias'), error);
    return data || [];
  }

  async listRecentAttendances() {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(3);

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando asistencias recientes'), error);
    return data || [];
  }

  async listRecentPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .not('fecha_pago', 'is', null)
      .order('fecha_pago', { ascending: false })
      .limit(2);

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando pagos recientes'), error);
    return data || [];
  }

  async getStudentName(studentId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        users!inner(nombre, apellido)
      `)
      .eq('id', studentId)
      .single();

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error cargando estudiante para actividad'), error);
    return data;
  }
}
