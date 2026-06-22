import { getEcuadorDate, calcularDiferenciaDias } from '../../../../utils/dateUtils';
import { getLatestPaymentsList } from '../../../../utils/paymentUtils';

const determinarTipoNotificacion = (diferenciaDias) => {
  if (diferenciaDias <= 0) return 'danger';
  if (diferenciaDias === 1) return 'warning';
  return 'info';
};

const generarMensajePagoBell = (diferenciaDias, nombreCompleto) => {
  if (diferenciaDias === 0) return `${nombreCompleto} - Vence HOY`;
  if (diferenciaDias < 0) return `${nombreCompleto} - Vencio hace ${Math.abs(diferenciaDias)} dia(s)`;
  if (diferenciaDias === 1) return `${nombreCompleto} - Vence MANANA`;
  return `${nombreCompleto} - Vence en ${diferenciaDias} dias`;
};

const generarMensajePagoCard = (diferenciaDias, nombreCompleto) => {
  if (diferenciaDias < 0) {
    return { mensaje: `El periodo de ${nombreCompleto} vencio hace ${Math.abs(diferenciaDias)} dia(s)`, tipo: 'danger' };
  }
  if (diferenciaDias === 0) {
    return { mensaje: `El periodo de ${nombreCompleto} vence HOY`, tipo: 'danger' };
  }
  if (diferenciaDias === 1) {
    return { mensaje: `El periodo de ${nombreCompleto} vence MANANA`, tipo: 'warning' };
  }
  return { mensaje: `El periodo de ${nombreCompleto} vence en ${diferenciaDias} dias`, tipo: 'info' };
};

const generarMensajeGamificacion = (achievement, nombreCompleto) => {
  const achievementTitle = achievement.metadata?.title || achievement.achievement_slug || 'nuevo logro';
  return `${nombreCompleto} desbloqueo ${achievementTitle}`;
};

const NOTIFICATION_CATEGORY = {
  PAYMENTS: 'mensualidades',
  ANNOUNCEMENTS: 'anuncios',
  GAMIFICATION: 'gamificacion',
  GENERAL: 'general',
};

const buildBellNotificationId = (prefix, suffix) => `${prefix}-${suffix}`;

const normalizeBellNotification = (notification, inboxStateMap) => {
  const state = inboxStateMap.get(notification.id);

  return {
    ...notification,
    category: notification.category || NOTIFICATION_CATEGORY.GENERAL,
    isRead: Boolean(state?.read_at),
    readAt: state?.read_at || null,
    dismissedAt: state?.dismissed_at || null,
  };
};

export const createNotificationsUseCases = (repository) => {
  const buildPaymentsBaseUseCase = {
    execute: async () => {
      const pagos = await repository.listPaymentsForNotifications();
      const ultimosPagos = getLatestPaymentsList(pagos || []);
      const studentIds = ultimosPagos.map((pago) => pago.student_id).filter(Boolean);
      const estudiantes = await repository.listStudentsByIds(studentIds);
      const estudiantesMap = new Map((estudiantes || []).map((est) => [est.id, est]));
      return { ultimosPagos, estudiantesMap };
    },
  };

  const loadBellNotificationsUseCase = {
    execute: async ({ userId } = {}) => {
      const hoy = getEcuadorDate();
      const { ultimosPagos, estudiantesMap } = await buildPaymentsBaseUseCase.execute();
      const notificacionesPagos = [];

      for (const pago of ultimosPagos) {
        if (!pago.fecha_fin) continue;
        const diferenciaDias = calcularDiferenciaDias(pago.fecha_fin, hoy);
        if (diferenciaDias <= 5) {
          const estudiante = estudiantesMap.get(pago.student_id);
          if (!estudiante) continue;
          const nombreCompleto = `${estudiante.users.nombre} ${estudiante.users.apellido}`;
          notificacionesPagos.push({
            id: buildBellNotificationId('pago', pago.student_id),
            tipo_notificacion: 'pago',
            category: NOTIFICATION_CATEGORY.PAYMENTS,
            mensaje: generarMensajePagoBell(diferenciaDias, nombreCompleto),
            tipo: determinarTipoNotificacion(diferenciaDias),
            fecha: pago.fecha_fin,
            orden: diferenciaDias
          });
        }
      }

      const hoyDate = getEcuadorDate();
      const hace7Dias = new Date(hoyDate);
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const fecha7DiasAtras = hace7Dias.toISOString().split('T')[0];

      const anuncios = await repository.listRecentActiveAnnouncements(fecha7DiasAtras);
      const notifAnuncios = (anuncios || []).map((anuncio) => ({
        id: buildBellNotificationId('anuncio', anuncio.id),
        tipo_notificacion: 'anuncio',
        category: NOTIFICATION_CATEGORY.ANNOUNCEMENTS,
        mensaje: anuncio.title,
        descripcion: anuncio.content.length > 80 ? `${anuncio.content.substring(0, 80)}...` : anuncio.content,
        tipo: 'info',
        fecha: anuncio.created_at,
        orden: 100
      }));

      const gamificationAchievements = repository.listRecentGamificationAchievements
        ? await repository.listRecentGamificationAchievements(fecha7DiasAtras)
        : [];
      const achievementStudentIds = gamificationAchievements.map((achievement) => achievement.student_id).filter(Boolean);
      const studentsForAchievements = achievementStudentIds.length > 0
        ? await repository.listStudentsByIds(achievementStudentIds)
        : [];
      const achievementStudentsMap = new Map((studentsForAchievements || []).map((student) => [student.id, student]));
      const notifGamification = gamificationAchievements
        .map((achievement) => {
          const student = achievementStudentsMap.get(achievement.student_id);
          if (!student) return null;
          const nombreCompleto = `${student.users.nombre} ${student.users.apellido}`;
          return {
            id: buildBellNotificationId('gamification', `${achievement.student_id}-${achievement.achievement_slug}`),
            tipo_notificacion: 'gamificacion',
            category: NOTIFICATION_CATEGORY.GAMIFICATION,
            mensaje: generarMensajeGamificacion(achievement, nombreCompleto),
            descripcion: `Categoria: ${student.categoria || 'sin categoria'}`,
            tipo: 'info',
            fecha: achievement.earned_at,
            orden: 50,
          };
        })
        .filter(Boolean);

      const todasNotificaciones = [...notificacionesPagos, ...notifGamification, ...notifAnuncios];
      const inboxStates = userId && repository.listNotificationInboxState
        ? await repository.listNotificationInboxState(userId, todasNotificaciones.map((notification) => notification.id))
        : [];
      const inboxStateMap = new Map((inboxStates || []).map((entry) => [entry.notification_key, entry]));

      return todasNotificaciones
        .map((notification) => normalizeBellNotification(notification, inboxStateMap))
        .filter((notification) => !notification.dismissedAt)
        .sort((left, right) => {
          if (left.isRead !== right.isRead) return left.isRead ? 1 : -1;
          if (left.orden !== right.orden) return left.orden - right.orden;
          return new Date(right.fecha).getTime() - new Date(left.fecha).getTime();
        });
    },
  };

  const markBellNotificationReadUseCase = {
    execute: async ({ userId, notificationId, category }) => {
      if (!userId || !notificationId) {
        throw new Error('userId y notificationId son requeridos para marcar una notificacion como leida.');
      }

      if (!repository.markNotificationAsRead) {
        throw new Error('El repositorio no soporta marcado de notificaciones.');
      }

      return repository.markNotificationAsRead({
        userId,
        notificationKey: notificationId,
        notificationCategory: category || NOTIFICATION_CATEGORY.GENERAL,
      });
    },
  };

  const dismissBellNotificationUseCase = {
    execute: async ({ userId, notificationId, category }) => {
      if (!userId || !notificationId) {
        throw new Error('userId y notificationId son requeridos para eliminar una notificacion.');
      }

      if (!repository.dismissNotification) {
        throw new Error('El repositorio no soporta descarte de notificaciones.');
      }

      return repository.dismissNotification({
        userId,
        notificationKey: notificationId,
        notificationCategory: category || NOTIFICATION_CATEGORY.GENERAL,
      });
    },
  };

  const markBellNotificationsReadBulkUseCase = {
    execute: async ({ userId, notifications }) => {
      if (!userId || !Array.isArray(notifications) || notifications.length === 0) {
        return [];
      }

      if (!repository.markNotificationsAsReadBulk) {
        throw new Error('El repositorio no soporta marcado masivo de notificaciones.');
      }

      return repository.markNotificationsAsReadBulk(
        userId,
        notifications.map((notification) => ({
          notificationKey: notification.id,
          notificationCategory: notification.category || NOTIFICATION_CATEGORY.GENERAL,
        })),
      );
    },
  };

  const loadPaymentNotificationsUseCase = {
    execute: async () => {
      const hoy = getEcuadorDate();
      const { ultimosPagos, estudiantesMap } = await buildPaymentsBaseUseCase.execute();
      const notificaciones = [];

      for (const pago of ultimosPagos) {
        if (!pago.fecha_fin) continue;
        const diferenciaDias = calcularDiferenciaDias(pago.fecha_fin, hoy);
        if (diferenciaDias <= 3) {
          const estudiante = estudiantesMap.get(pago.student_id);
          if (!estudiante) continue;
          const nombreCompleto = `${estudiante.users.nombre} ${estudiante.users.apellido}`;
          const { mensaje, tipo } = generarMensajePagoCard(diferenciaDias, nombreCompleto);
          notificaciones.push({
            id: pago.student_id,
            mensaje,
            tipo,
            fecha_fin: pago.fecha_fin,
            diasRestantes: diferenciaDias,
            atleta: nombreCompleto,
            categoria: estudiante.categoria
          });
        }
      }

      notificaciones.sort((a, b) => a.diasRestantes - b.diasRestantes);
      return notificaciones;
    },
  };

  return {
    loadBellNotificationsUseCase,
    markBellNotificationReadUseCase,
    dismissBellNotificationUseCase,
    markBellNotificationsReadBulkUseCase,
    loadPaymentNotificationsUseCase,
  };
};
