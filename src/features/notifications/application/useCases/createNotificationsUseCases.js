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
    execute: async () => {
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
            id: `pago-${pago.student_id}`,
            tipo_notificacion: 'pago',
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
        id: `anuncio-${anuncio.id}`,
        tipo_notificacion: 'anuncio',
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
            id: `gamification-${achievement.student_id}-${achievement.achievement_slug}`,
            tipo_notificacion: 'gamificacion',
            mensaje: generarMensajeGamificacion(achievement, nombreCompleto),
            descripcion: `Categoria: ${student.categoria || 'sin categoria'}`,
            tipo: 'info',
            fecha: achievement.earned_at,
            orden: 50,
          };
        })
        .filter(Boolean);

      const todasNotificaciones = [...notificacionesPagos, ...notifGamification, ...notifAnuncios];
      todasNotificaciones.sort((a, b) => a.orden - b.orden);
      return todasNotificaciones;
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
    loadPaymentNotificationsUseCase,
  };
};
