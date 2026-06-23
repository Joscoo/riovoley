import { getEcuadorDate, getEcuadorFirstDayOfMonth } from '../../../../utils/dateUtils';
import { PagoStatusService } from '../../../../shared/domain/payments';

const buildMonthName = () =>
  new Date().toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Guayaquil',
  });

const parseDateOnly = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateOnly = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateString, days) => {
  const parsed = parseDateOnly(dateString);
  if (!parsed) return null;
  parsed.setDate(parsed.getDate() + days);
  return formatDateOnly(parsed);
};

const toRecencyTimestamp = (value) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const comparePaymentsByCoverage = (left, right) => {
  const keys = ['fecha_fin', 'fecha_inicio', 'fecha_pago', 'created_at'];

  for (const key of keys) {
    const diff = toRecencyTimestamp(right?.[key]) - toRecencyTimestamp(left?.[key]);
    if (diff !== 0) {
      return diff;
    }
  }

  return Number(right?.id || 0) - Number(left?.id || 0);
};

const resolveLatestCoveredPayment = (payments = [], today) => {
  return (payments || [])
    .filter((payment) => {
      if (!payment) return false;
      if (!payment.fecha_fin) return true;
      return payment.fecha_fin >= today;
    })
    .sort(comparePaymentsByCoverage)[0] || null;
};

const resolveCurrentCoveragePayment = (payments = [], today) => {
  return (payments || []).find((payment) => {
    if (!payment?.fecha_inicio) return false;
    if (payment.fecha_inicio > today) return false;
    if (!payment.fecha_fin) return true;
    return payment.fecha_fin >= today;
  }) || null;
};

const buildCoverageAggregate = (payments = [], today) => {
  const validPayments = (payments || [])
    .filter((payment) => payment?.fecha_inicio && (!payment.fecha_fin || payment.fecha_fin >= today))
    .sort((left, right) => {
      const startDiff = toRecencyTimestamp(left?.fecha_inicio) - toRecencyTimestamp(right?.fecha_inicio);
      if (startDiff !== 0) return startDiff;
      return comparePaymentsByCoverage(left, right);
    });

  const activePayment = resolveCurrentCoveragePayment(validPayments, today);
  if (activePayment) {
    const activeIndex = validPayments.findIndex((payment) => payment.id === activePayment.id);
    const chain = [activePayment];
    let coverageEnd = activePayment.fecha_fin || activePayment.fecha_inicio;

    for (let index = activeIndex + 1; index < validPayments.length; index += 1) {
      const nextPayment = validPayments[index];
      const nextStart = nextPayment?.fecha_inicio;
      if (!nextStart || !coverageEnd) {
        continue;
      }

      const maxAllowedStart = addDays(coverageEnd, 1);
      if (maxAllowedStart && nextStart > maxAllowedStart) {
        break;
      }

      chain.push(nextPayment);
      coverageEnd = nextPayment.fecha_fin || coverageEnd;
    }

    const latestPayment = [...chain].sort(comparePaymentsByCoverage)[0];
    return {
      ...latestPayment,
      fecha_inicio: chain[0].fecha_inicio,
      fecha_fin: coverageEnd,
      coverage_payment_count: chain.length,
      coverage_total_amount: chain.reduce((sum, payment) => sum + Number(payment?.monto || 0), 0),
      coverage_is_aggregated: chain.length > 1,
      latest_payment_amount: latestPayment?.monto || null,
      latest_payment_date: latestPayment?.fecha_pago || null,
      latest_payment_status: latestPayment?.estado || null,
    };
  }

  const latestPayment = resolveLatestCoveredPayment(validPayments, today);
  if (!latestPayment) {
    return null;
  }

  return {
    ...latestPayment,
    coverage_payment_count: 1,
    coverage_total_amount: Number(latestPayment?.monto || 0),
    coverage_is_aggregated: false,
    latest_payment_amount: latestPayment?.monto || null,
    latest_payment_date: latestPayment?.fecha_pago || null,
    latest_payment_status: latestPayment?.estado || null,
  };
};

export const createStudentDashboardUseCases = (repository, deps = {}) => {
  const statusService = deps.PagoStatusService || PagoStatusService;
  const gamificationGateway = deps.gamificationService || null;

  const loadPaymentStatusUseCase = {
    execute: async ({ studentId }) => {
      const today = getEcuadorDate();
      const payments = await repository.listPaymentsByStudentId(studentId);
      const currentPayment = buildCoverageAggregate(payments, today);

      return {
        hasPaid: Boolean(currentPayment),
        payment: currentPayment,
        monthName: buildMonthName(),
      };
    },
  };

  const loadPhysicalTestsUseCase = {
    execute: async ({ studentId }) => repository.listPhysicalTests(studentId),
  };

  const loadPaymentsHistoryUseCase = {
    execute: async ({ studentId }) => repository.listPaymentsByStudentId(studentId),
  };

  const loadAttendanceStatsUseCase = {
    execute: async ({ studentId }) => {
      const firstDayOfMonth = getEcuadorFirstDayOfMonth();
      const attendances = await repository.listAttendancesFromDate(studentId, firstDayOfMonth);

      const totalDays = attendances?.length || 0;
      const presentDays = totalDays;
      const absentDays = 0;
      const attendanceRate = totalDays > 0 ? '100.0' : '0.0';

      return {
        totalDays,
        presentDays,
        absentDays,
        attendanceRate,
        recentAttendances: attendances?.slice(0, 10) || [],
      };
    },
  };

  const loadStudentPanelDataUseCase = {
    execute: async ({ userId }) => {
      const student = await repository.findStudentByUserId(userId);

      const [paymentStatus, attendanceStats, physicalTests] = await Promise.all([
        loadPaymentStatusUseCase.execute({ studentId: student.id }),
        loadAttendanceStatsUseCase.execute({ studentId: student.id }),
        loadPhysicalTestsUseCase.execute({ studentId: student.id }),
      ]);
      const gamification = gamificationGateway?.loadStudentGamificationByStudentId
        ? await gamificationGateway.loadStudentGamificationByStudentId({
            studentId: student.id,
            studentData: student,
            physicalTests,
          })
        : null;

      return {
        studentData: student,
        paymentStatus,
        attendanceStats,
        physicalTests,
        gamification,
      };
    },
  };

  const subscribeToPaymentChangesUseCase = {
    execute: ({ studentId, onChange }) => repository.subscribeToPaymentChanges(studentId, onChange),
  };

  const loadStudentViewDataUseCase = {
    execute: async ({ userId }) => {
      const student = await repository.findStudentByUserId(userId);
      const [payments, physicalTests] = await Promise.all([
        loadPaymentsHistoryUseCase.execute({ studentId: student.id }),
        loadPhysicalTestsUseCase.execute({ studentId: student.id }),
      ]);

      const paymentsWithStatus = (payments || []).map((payment) => ({
        ...payment,
        statusInfo: statusService.getStatusInfo(payment),
      }));

      return {
        studentData: student,
        payments: paymentsWithStatus,
        physicalTests,
      };
    },
  };

  return {
    loadPaymentStatusUseCase,
    loadPhysicalTestsUseCase,
    loadPaymentsHistoryUseCase,
    loadAttendanceStatsUseCase,
    loadStudentPanelDataUseCase,
    loadStudentViewDataUseCase,
    subscribeToPaymentChangesUseCase,
  };
};
