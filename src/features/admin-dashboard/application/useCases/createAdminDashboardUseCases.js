import { getEcuadorDate, getEcuadorFirstDayOfMonth, getEcuadorLastDayOfMonth, calcularDiferenciaDias } from '../../../../utils/dateUtils';
import { getLatestPaymentsList } from '../../../../utils/paymentUtils';
import { formatCategoryLabel } from '../../../../shared/lib/trainingCategoryFormatting';

const EMPTY_CATEGORY_STATS = { items: [], loading: false };
const DAILY_ATTENDANCE_PAYMENT_AMOUNT = 2;
const FINANCIAL_TREND_MONTHS = 6;

const parseDateOnly = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    key: formatMonthKey(date),
    label: start.toLocaleDateString('es-EC', { month: 'short', year: 'numeric' }),
    firstDay: `${formatMonthKey(start)}-01`,
    lastDay: `${formatMonthKey(end)}-${`${end.getDate()}`.padStart(2, '0')}`,
  };
};

const buildFinancialTrendMonths = (totalMonths = FINANCIAL_TREND_MONTHS) => {
  const base = parseDateOnly(getEcuadorDate()) || new Date();
  const months = [];

  for (let index = totalMonths - 1; index >= 0; index -= 1) {
    const date = new Date(base.getFullYear(), base.getMonth() - index, 1);
    months.push(getMonthRange(date));
  }

  return months;
};

const isPaymentActiveOnDate = (payment, targetDate) => {
  if (!payment?.fecha_inicio || payment.fecha_inicio > targetDate) return false;
  if (!payment?.fecha_fin) return true;
  return payment.fecha_fin >= targetDate;
};

const calculateOverdueMonths = ({ fechaFin, today }) => {
  const dueDate = parseDateOnly(fechaFin);
  const currentDate = parseDateOnly(today);
  if (!dueDate || !currentDate || dueDate >= currentDate) return 0;

  const rawMonths = ((currentDate.getFullYear() - dueDate.getFullYear()) * 12)
    + (currentDate.getMonth() - dueDate.getMonth());

  return Math.max(rawMonths, 1);
};

export const createAdminDashboardUseCases = (repository, activityIconFactory) => {
  const loadFinancialReviewUseCase = {
    execute: async () => {
      const today = getEcuadorDate();
      const firstDayOfMonth = getEcuadorFirstDayOfMonth();
      const lastDayOfMonth = getEcuadorLastDayOfMonth();
      const trendMonths = buildFinancialTrendMonths();
      const oldestTrendMonth = trendMonths[0]?.firstDay || firstDayOfMonth;

      const [students, paymentTypes, payments, attendances] = await Promise.all([
        repository.listStudentsForFinancialReview(),
        repository.listPaymentTypes(),
        repository.listPaymentsForFinancialReview(),
        repository.listAttendancesForFinancialReview({ dateFrom: oldestTrendMonth, dateTo: lastDayOfMonth }),
      ]);

      const latestPayments = getLatestPaymentsList(payments || []);

      const studentById = new Map((students || []).map((student) => [String(student.id), student]));
      const pagoDiarioType = (paymentTypes || []).find((item) => item.nombre === 'pago_diario');
      const pagoDiarioTypeId = pagoDiarioType?.id ?? null;

      const currentMonthAttendances = (attendances || []).filter(
        (attendance) => attendance.fecha >= firstDayOfMonth && attendance.fecha <= lastDayOfMonth
      );
      const currentMonthDailyAttendances = currentMonthAttendances.filter(
        (attendance) => Number(attendance.metodo_pago_id) === Number(pagoDiarioTypeId)
      );

      const monthlyMembershipRevenue = (payments || [])
        .filter((payment) => payment.fecha_pago && payment.fecha_pago >= firstDayOfMonth && payment.fecha_pago <= lastDayOfMonth)
        .reduce((sum, payment) => sum + Number(payment.monto || 0), 0);

      const dailyRevenue = currentMonthDailyAttendances.length * DAILY_ATTENDANCE_PAYMENT_AMOUNT;
      const studentsWithCurrentAttendance = new Set(currentMonthAttendances.map((attendance) => String(attendance.student_id)));

      const overdueStudents = [];
      const activeMonthlyCoverageCount = new Set();
      let totalOverdueMonthlyFees = 0;
      let totalEstimatedDebt = 0;

      latestPayments.forEach((payment) => {
        const studentId = String(payment.student_id || '');
        if (!studentId || !payment.fecha_fin) return;

        if (isPaymentActiveOnDate(payment, today)) {
          activeMonthlyCoverageCount.add(studentId);
          return;
        }

        const overdueMonths = calculateOverdueMonths({ fechaFin: payment.fecha_fin, today });
        if (overdueMonths <= 0) return;

        const attendancesThisMonth = currentMonthAttendances.filter(
          (attendance) => String(attendance.student_id) === studentId
        );
        const dailyAttendancesThisMonth = attendancesThisMonth.filter(
          (attendance) => Number(attendance.metodo_pago_id) === Number(pagoDiarioTypeId)
        );
        const estimatedDebt = overdueMonths * Number(payment.monto || 0);
        const student = studentById.get(studentId);

        totalOverdueMonthlyFees += overdueMonths;
        totalEstimatedDebt += estimatedDebt;

        overdueStudents.push({
          studentId,
          athleteName: `${student?.users?.nombre || ''} ${student?.users?.apellido || ''}`.trim() || 'Atleta sin nombre',
          category: student?.categoria || '',
          lastPaymentDate: payment.fecha_pago || null,
          coverageEnd: payment.fecha_fin,
          overdueMonths,
          estimatedDebt,
          currentMonthAttendances: attendancesThisMonth.length,
          currentMonthDailyPayments: dailyAttendancesThisMonth.length,
          currentMonthDailyRevenue: dailyAttendancesThisMonth.length * DAILY_ATTENDANCE_PAYMENT_AMOUNT,
        });
      });

      overdueStudents.sort((a, b) => {
        if (b.overdueMonths !== a.overdueMonths) return b.overdueMonths - a.overdueMonths;
        if (b.estimatedDebt !== a.estimatedDebt) return b.estimatedDebt - a.estimatedDebt;
        return a.athleteName.localeCompare(b.athleteName, 'es');
      });

      const monthlyTrend = trendMonths.map((month) => {
        const monthlyPaymentsTotal = (payments || [])
          .filter((payment) => payment.fecha_pago && payment.fecha_pago >= month.firstDay && payment.fecha_pago <= month.lastDay)
          .reduce((sum, payment) => sum + Number(payment.monto || 0), 0);

        const monthDailyAttendances = (attendances || []).filter(
          (attendance) => attendance.fecha >= month.firstDay
            && attendance.fecha <= month.lastDay
            && Number(attendance.metodo_pago_id) === Number(pagoDiarioTypeId)
        );

        const dailyPaymentsTotal = monthDailyAttendances.length * DAILY_ATTENDANCE_PAYMENT_AMOUNT;

        return {
          key: month.key,
          label: month.label,
          monthlyPaymentsTotal,
          dailyPaymentsTotal,
          combinedTotal: monthlyPaymentsTotal + dailyPaymentsTotal,
          dailyPaymentsCount: monthDailyAttendances.length,
        };
      });

      return {
        summary: {
          monthlyMembershipRevenue,
          dailyAttendanceRevenue: dailyRevenue,
          totalRevenue: monthlyMembershipRevenue + dailyRevenue,
          overdueStudentsCount: overdueStudents.length,
          overdueMonthlyFeesCount: totalOverdueMonthlyFees,
          estimatedDebtTotal: totalEstimatedDebt,
          currentMonthAttendancesCount: currentMonthAttendances.length,
          currentMonthDailyPaymentsCount: currentMonthDailyAttendances.length,
          currentMonthStudentsWithAttendance: studentsWithCurrentAttendance.size,
          activeMonthlyCoverageCount: activeMonthlyCoverageCount.size,
        },
        overdueStudents,
        monthlyTrend,
      };
    },
  };

  const loadStatsUseCase = {
    execute: async () => {
      const today = getEcuadorDate();
      const firstDayOfMonth = getEcuadorFirstDayOfMonth();
      const lastDayOfMonth = getEcuadorLastDayOfMonth();

      const [totalStudents, activePayers, monthlyPayments, paymentsForExpiration, todayAttendanceCount, paymentTypes, monthAttendances] = await Promise.all([
        repository.countStudents(),
        repository.listActivePayers(),
        repository.listMonthlyPayments({ firstDayOfMonth, lastDayOfMonth }),
        repository.listPaymentsForExpiration(),
        repository.countAttendancesByDate(today),
        repository.listPaymentTypes(),
        repository.listAttendancesForFinancialReview({ dateFrom: firstDayOfMonth, dateTo: lastDayOfMonth }),
      ]);

      const activeStudents = new Set((activePayers || []).map((payer) => payer.student_id)).size;
      const pagoDiarioType = (paymentTypes || []).find((item) => item.nombre === 'pago_diario');
      const pagoDiarioTypeId = pagoDiarioType?.id ?? null;
      const ingresosMensualidades = (monthlyPayments || []).reduce((sum, payment) => sum + Number(payment.monto || 0), 0);
      const ingresosPagoDiario = (monthAttendances || []).filter(
        (attendance) => Number(attendance.metodo_pago_id) === Number(pagoDiarioTypeId)
      ).length * DAILY_ATTENDANCE_PAYMENT_AMOUNT;
      const ingresos = ingresosMensualidades + ingresosPagoDiario;

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
    loadFinancialReviewUseCase,
    loadStatsUseCase,
    loadCategoriesStatsUseCase,
    loadRecentActivityUseCase,
    loadDashboardUseCase,
  };
};
