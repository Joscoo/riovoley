import { supabase } from '../../../config/supabase';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const readFunctionErrorDetails = async (error) => {
  const response = error?.context || error?.response;
  if (!response || typeof response.clone !== 'function') {
    return null;
  }

  try {
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers?.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return await clonedResponse.json();
    }

    return await clonedResponse.text();
  } catch (_readError) {
    return null;
  }
};

const buildAthleteName = (athleteName = '') => athleteName.trim() || 'Tu progreso';

export class SupabasePushNotificationGateway {
  async sendNotification({
    title,
    body,
    type,
    userIds = [],
    audience = [],
    route,
    channelId,
    priority,
    data = {},
  }) {
    if (!title || !body) return { skipped: true };
    if (!Array.isArray(userIds) && !Array.isArray(audience)) return { skipped: true };
    if ((userIds?.length || 0) === 0 && (audience?.length || 0) === 0) return { skipped: true };

    try {
      const { data: responseData, error } = await supabase.functions.invoke('send-push', {
        body: {
          title,
          body,
          type,
          userIds,
          audience,
          route,
          channelId,
          priority,
          data,
        },
      });

      if (error) {
        throw error;
      }

      if (responseData?.success === false) {
        throw new Error(responseData?.message || 'No se pudo enviar la notificacion push.');
      }

      return responseData;
    } catch (error) {
      const details = await readFunctionErrorDetails(error);
      // eslint-disable-next-line no-console
      console.error('Error enviando push:', error, details);
      throw new Error(normalizeError(error, 'No se pudo enviar la notificacion push.'));
    }
  }

  async sendPaymentRegisteredNotification({ userId, athleteName, payment }) {
    if (!userId || !payment?.id) return { skipped: true };

    return this.sendNotification({
      title: 'Mensualidad registrada',
      body: `${buildAthleteName(athleteName)}, registramos tu mensualidad hasta el ${payment.fecha_fin}.`,
      type: 'payment_registered',
      userIds: [userId],
      channelId: 'payments',
      priority: 'high',
      data: {
        payment_id: payment.id,
        fecha_inicio: payment.fecha_inicio,
        fecha_fin: payment.fecha_fin,
        monto: payment.monto,
        user_role: 'estudiante',
      },
    });
  }

  async sendAttendanceRecordedNotification({ userId, athleteName, attendanceDate, paymentTypeId = null }) {
    if (!userId || !attendanceDate) return { skipped: true };

    return this.sendNotification({
      title: 'Asistencia registrada',
      body: `${buildAthleteName(athleteName)}, registramos tu asistencia del ${attendanceDate}.`,
      type: 'attendance_recorded',
      userIds: [userId],
      channelId: 'attendance',
      priority: 'normal',
      data: {
        attendance_date: attendanceDate,
        payment_type_id: paymentTypeId,
        user_role: 'estudiante',
      },
    });
  }

  async sendGamificationProgressNotifications({
    userId,
    athleteName,
    levelUp = null,
    achievements = [],
    challenges = [],
  }) {
    if (!userId) return [];

    const deliveries = [];
    const safeName = buildAthleteName(athleteName);

    if (levelUp?.toLevel) {
      deliveries.push(
        this.sendNotification({
          title: 'Subiste de nivel',
          body: `${safeName}, ahora estas en nivel ${levelUp.toLevel}: ${levelUp.title || 'nuevo nivel'}.`,
          type: 'level_up',
          userIds: [userId],
          channelId: 'progress',
          priority: 'high',
          data: {
            previous_level: levelUp.fromLevel || 0,
            current_level: levelUp.toLevel,
            level_title: levelUp.title || '',
            user_role: 'estudiante',
          },
        }),
      );
    }

    if (achievements.length > 0) {
      const [firstAchievement] = achievements;
      deliveries.push(
        this.sendNotification({
          title: achievements.length > 1 ? 'Nuevos logros desbloqueados' : 'Logro desbloqueado',
          body: achievements.length > 1
            ? `${safeName}, desbloqueaste ${achievements.length} logros nuevos.`
            : `${safeName}, desbloqueaste "${firstAchievement.title}".`,
          type: 'achievement_unlocked',
          userIds: [userId],
          channelId: 'progress',
          priority: 'high',
          data: {
            achievement_slug: firstAchievement.slug,
            achievement_title: firstAchievement.title,
            unlocked_count: achievements.length,
            user_role: 'estudiante',
          },
        }),
      );
    }

    if (challenges.length > 0) {
      const [firstChallenge] = challenges;
      deliveries.push(
        this.sendNotification({
          title: challenges.length > 1 ? 'Retos completados' : 'Reto completado',
          body: challenges.length > 1
            ? `${safeName}, completaste ${challenges.length} retos nuevos.`
            : `${safeName}, completaste "${firstChallenge.title}".`,
          type: 'challenge_completed',
          userIds: [userId],
          channelId: 'progress',
          priority: 'high',
          data: {
            challenge_slug: firstChallenge.slug,
            challenge_title: firstChallenge.title,
            completed_count: challenges.length,
            user_role: 'estudiante',
          },
        }),
      );
    }

    return Promise.allSettled(deliveries);
  }
}

export const pushNotificationGateway = new SupabasePushNotificationGateway();
