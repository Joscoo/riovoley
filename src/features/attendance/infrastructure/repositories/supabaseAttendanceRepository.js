import { supabase } from '../../../../config/supabase';
import { AttendanceError } from '../../domain/attendanceError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseAttendanceRepository {
  async listAthletesWithRole() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users(id, nombre, apellido, email, role)
      `)
      .order('users(apellido)', { ascending: true });

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error cargando atletas'), error);
    }

    return data || [];
  }

  async listAttendances({ dateFrom, dateTo, studentIds, studentId } = {}) {
    let query = supabase
      .from('attendances')
      .select('*')
      .order('fecha', { ascending: false });

    if (dateFrom && dateTo) {
      query = query.gte('fecha', dateFrom).lte('fecha', dateTo);
    }
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;
    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error cargando asistencias'), error);
    }

    return data || [];
  }

  async getStudentById(studentId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users!inner(id, nombre, apellido, email, role)
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error consultando estudiante'), error);
    }

    return data;
  }

  async listPaymentTypes() {
    const { data, error } = await supabase
      .from('payment_types')
      .select('*')
      .order('id');

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error cargando metodos de pago'), error);
    }

    return data || [];
  }

  async findAttendanceByStudentAndDate(studentId, date) {
    const { data, error } = await supabase
      .from('attendances')
      .select('id, metodo_pago_id')
      .eq('student_id', studentId)
      .eq('fecha', date)
      .maybeSingle();

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error consultando asistencia existente'), error);
    }

    return data || null;
  }

  async createAttendance(payload) {
    const { error } = await supabase
      .from('attendances')
      .insert(payload);

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error creando asistencia'), error);
    }
  }

  async updateAttendance(attendanceId, payload) {
    const { error } = await supabase
      .from('attendances')
      .update(payload)
      .eq('id', attendanceId);

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error actualizando asistencia'), error);
    }
  }

  async deleteAttendanceByStudentAndDate(studentId, date) {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('student_id', studentId)
      .eq('fecha', date);

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error eliminando asistencia'), error);
    }
  }

  async deleteAttendancesByDate(date) {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('fecha', date);

    if (error) {
      throw new AttendanceError(normalizeError(error, 'Error limpiando asistencias'), error);
    }
  }
}
