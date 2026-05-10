import { supabase } from '../../../../config/supabase';
import { NotificationsError } from '../../domain/notificationsError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseNotificationsRepository {
  async listPaymentsForNotifications() {
    const { data, error } = await supabase
      .from('payments')
      .select('student_id, fecha_fin, fecha_inicio')
      .is('deleted_at', null)
      .order('fecha_fin', { ascending: false });

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error cargando pagos para notificaciones'), error);
    }

    return data || [];
  }

  async listStudentsByIds(studentIds) {
    if (!studentIds?.length) return [];

    const { data, error } = await supabase
      .from('students')
      .select('id, categoria, users!inner(nombre, apellido, email)')
      .in('id', studentIds);

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error cargando estudiantes para notificaciones'), error);
    }

    return data || [];
  }

  async listRecentActiveAnnouncements(fechaDesde) {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, content, created_at, is_active')
      .eq('is_active', true)
      .gte('created_at', fechaDesde)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error cargando anuncios para notificaciones'), error);
    }

    return data || [];
  }
}
