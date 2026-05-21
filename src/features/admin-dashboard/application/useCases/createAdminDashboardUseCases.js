import { getEcuadorDate, getEcuadorFirstDayOfMonth, getEcuadorLastDayOfMonth, calcularDiferenciaDias } from '../../../../utils/dateUtils';
import { getLatestPaymentsList } from '../../../../utils/paymentUtils';
import { formatCategoryLabel } from '../../../../shared/lib/trainingCategoryFormatting';

const EMPTY_CATEGORY_STATS = { items: [], loading: false };

export const createAdminDashboardUseCases = (repository, activityIconFactory) => {
  const loadStatsUseCase = {
    execute: async () => {
      const today = getEcuadorDate();
      const firstDayOfMonth = getEcuadorFirstDayOfMonth();
      const lastDayOfMonth = getEcuadorLastDayOfMonth();

      const [totalStudents, activePayers, monthlyPayments, paymentsForExpiration, todayAttendanceCount] = await Promise.all([
        repository.countStudents(),
        repository.listActivePayers(),
        repository.listMonthlyPayments({ firstDayOfMonth, lastDayOfMonth }),
        repository.listPaymentsForExpiration(),
        repository.countAttendancesByDate(today),
      ]);

      const activeStudents = new Set((activePayers || []).map((payer) => payer.student_id)).size;
      const ingresos = (monthlyPayments || []).reduce((sum, payment) => sum + (payment.monto || 0), 0);

      let vencidos = 0;
      let proximosVencer = 0;
      const latestPayments = getLatestPaymentsList(paymentsForExpiration || []);
      latestPayments.forEach((payment) => {
        if (!payment.fecha_fin) return;
        const diffDays = calcularDiferenciaDias(payment.fecha_fin, today);
        if (diffDays <= 0) vencidos += 1;
        else if (diffDays <= 5) proximosVencer += 1;
      });

      return {
        totalAtletas: totalStudents || 0,
        atletasActivos: activeStudents || 0,
        ingresosDelMes: ingresos || 0,
        pagosVencidos: vencidos,
        renovacionesPendientes: proximosVencer,
        asistenciasHoy: todayAttendanceCount || 0,
        loading: false,
      };
    },
  };

  const loadCategoriesStatsUseCase = {
    execute: async () => {
      const [students, categoriesCatalog] = await Promise.all([
        repository.listStudentCategories(),
        typeof repository.listTrainingCategoriesForStudents === 'function'
          ? repository.listTrainingCategoriesForStudents()
          : Promise.resolve([]),
      ]);

      const countsByCode = new Map();
      (students || []).forEach((student) => {
        if (!student?.categoria) return;
        countsByCode.set(student.categoria, (countsByCode.get(student.categoria) || 0) + 1);
      });

      const labelsByCode = new Map(
        (categoriesCatalog || []).map((category) => [
          category.code,
          category.label || formatCategoryLabel(category.code),
        ])
      );

      const allCodes = new Set([
        ...labelsByCode.keys(),
        ...countsByCode.keys(),
      ]);

      const items = Array.from(allCodes)
        .map((code) => ({
          code,
          label: labelsByCode.get(code) || formatCategoryLabel(code),
          total: countsByCode.get(code) || 0,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));

      return {
        items,
        loading: false,
      };
    },
  };

  const loadRecentActivityUseCase = {
    execute: async () => {
      const [attendances, payments] = await Promise.all([
        repository.listRecentAttendances(),
        repository.listRecentPayments(),
      ]);

      const activity = [];

      for (const [index, attendance] of (attendances || []).entries()) {
        try {
          const student = await repository.getStudentName(attendance.student_id);
          activity.push({
            id: attendance.id || `asistencia-${index}`,
            tipo: 'asistencia',
            descripcion: `${student?.users?.nombre} ${student?.users?.apellido} asistio al entrenamiento`,
            fecha: new Date(attendance.fecha).toLocaleDateString(),
            icono: activityIconFactory.attendance(),
          });
        } catch (_error) {
          // Ignorar fallos puntuales de actividad para no bloquear todo el dashboard.
        }
      }

      for (const [index, payment] of (payments || []).entries()) {
        try {
          const student = await repository.getStudentName(payment.student_id);
          activity.push({
            id: payment.id || `pago-${index}`,
            tipo: 'pago',
            descripcion: `${student?.users?.nombre} ${student?.users?.apellido} realizo un pago de $${payment.monto}`,
            fecha: new Date(payment.fecha_pago).toLocaleDateString(),
            icono: activityIconFactory.payment(),
          });
        } catch (_error) {
          // Ignorar fallos puntuales de actividad para no bloquear todo el dashboard.
        }
      }

      if (activity.length === 0) {
        return [{
          id: 'no-activity',
          tipo: 'info',
          descripcion: 'No hay actividad reciente registrada',
          fecha: 'Hoy',
          icono: activityIconFactory.empty(),
        }];
      }

      return activity.slice(0, 5);
    },
  };

  const loadDashboardUseCase = {
    execute: async () => {
      const [stats, categoriesStats, recentActivity] = await Promise.all([
        loadStatsUseCase.execute(),
        loadCategoriesStatsUseCase.execute(),
        loadRecentActivityUseCase.execute(),
      ]);

      return {
        stats,
        categoriesStats: categoriesStats || EMPTY_CATEGORY_STATS,
        recentActivity,
      };
    },
  };

  return {
    loadStatsUseCase,
    loadCategoriesStatsUseCase,
    loadRecentActivityUseCase,
    loadDashboardUseCase,
  };
};
