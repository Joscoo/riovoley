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

  async listRecentGamificationAchievements(fechaDesde) {
    const { data, error } = await supabase
      .from('gamification_student_achievements')
      .select('student_id, achievement_slug, earned_at, metadata')
      .gte('earned_at', fechaDesde)
      .order('earned_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error cargando logros gamificados recientes'), error);
    }

    return data || [];
  }

  async listNotificationInboxState(userId, notificationKeys) {
    if (!userId || !notificationKeys?.length) return [];

    const { data, error } = await supabase
      .from('user_notification_inbox_state')
      .select('notification_key, notification_category, read_at, dismissed_at')
      .eq('user_id', userId)
      .in('notification_key', notificationKeys);

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error cargando estado de bandeja de notificaciones'), error);
    }

    return data || [];
  }

  async markNotificationAsRead({ userId, notificationKey, notificationCategory }) {
    const payload = {
      user_id: userId,
      notification_key: notificationKey,
      notification_category: notificationCategory,
      read_at: new Date().toISOString(),
      dismissed_at: null,
    };

    const { data, error } = await supabase
      .from('user_notification_inbox_state')
      .upsert(payload, { onConflict: 'user_id,notification_key' })
      .select()
      .single();

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error marcando notificacion como leida'), error);
    }

    return data;
  }

  async dismissNotification({ userId, notificationKey, notificationCategory }) {
    const now = new Date().toISOString();
    const payload = {
      user_id: userId,
      notification_key: notificationKey,
      notification_category: notificationCategory,
      read_at: now,
      dismissed_at: now,
    };

    const { data, error } = await supabase
      .from('user_notification_inbox_state')
      .upsert(payload, { onConflict: 'user_id,notification_key' })
      .select()
      .single();

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error eliminando notificacion de la bandeja'), error);
    }

    return data;
  }

  async markNotificationsAsReadBulk(userId, notifications) {
    if (!userId || !notifications?.length) return [];

    const now = new Date().toISOString();
    const payload = notifications.map((notification) => ({
      user_id: userId,
      notification_key: notification.notificationKey,
      notification_category: notification.notificationCategory,
      read_at: now,
      dismissed_at: null,
    }));

    const { data, error } = await supabase
      .from('user_notification_inbox_state')
      .upsert(payload, { onConflict: 'user_id,notification_key' })
      .select();

    if (error) {
      throw new NotificationsError(normalizeError(error, 'Error marcando notificaciones como leidas'), error);
    }

    return data || [];
  }
}
