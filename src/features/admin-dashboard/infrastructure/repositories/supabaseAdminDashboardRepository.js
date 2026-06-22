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
      .select('student_id, fecha_fin, fecha_inicio, fecha_pago, monto')
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

  async listPaymentTypes() {
    const { data, error } = await supabase
      .from('payment_types')
      .select('id, nombre, descripcion, precio')
      .order('id', { ascending: true });

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando metodos de pago'), error);
    return data || [];
  }

  async listPaymentsForFinancialReview({ dateFrom } = {}) {
    let query = supabase
      .from('payments')
      .select('id, student_id, monto, fecha_pago, fecha_inicio, fecha_fin, estado, membership_type_id')
      .is('deleted_at', null)
      .order('fecha_pago', { ascending: false });

    if (dateFrom) {
      query = query.or(`fecha_pago.gte.${dateFrom},fecha_fin.gte.${dateFrom}`);
    }

    const { data, error } = await query;
    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando pagos para revision financiera'), error);
    return data || [];
  }

  async listAttendancesForFinancialReview({ dateFrom, dateTo } = {}) {
    let query = supabase
      .from('attendances')
      .select('id, student_id, fecha, metodo_pago_id')
      .order('fecha', { ascending: false });

    if (dateFrom) {
      query = query.gte('fecha', dateFrom);
    }

    if (dateTo) {
      query = query.lte('fecha', dateTo);
    }

    const { data, error } = await query;
    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando asistencias para revision financiera'), error);
    return data || [];
  }

  async listStudentCategories() {
    const { data, error } = await supabase.from('students').select('categoria');
    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando categorias'), error);
    return data || [];
  }

  async listTrainingCategoriesForStudents() {
    const { data, error } = await supabase
      .from('training_categories')
      .select('code, label')
      .eq('for_students', true)
      .eq('is_active', true)
      .order('label', { ascending: true });

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error consultando catalogo de categorias'), error);
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

  async listStudentsForFinancialReview() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users!inner(id, nombre, apellido)
      `);

    if (error) throw new AdminDashboardError(normalizeError(error, 'Error cargando estudiantes para revision financiera'), error);
    return data || [];
  }
}
