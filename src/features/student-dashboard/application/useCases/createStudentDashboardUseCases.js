import { getEcuadorDate, getEcuadorFirstDayOfMonth } from '../../../../utils/dateUtils';
import { PagoStatusService } from '../../../../shared/domain/payments';

const buildMonthName = () =>
  new Date().toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Guayaquil',
  });

export const createStudentDashboardUseCases = (repository, deps = {}) => {
  const statusService = deps.PagoStatusService || PagoStatusService;

  const loadPaymentStatusUseCase = {
    execute: async ({ studentId }) => {
      const today = getEcuadorDate();
      const payments = await repository.listCurrentPayments(studentId, today);
      const currentPayment = payments && payments.length > 0 ? payments[0] : null;

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

      return {
        studentData: student,
        paymentStatus,
        attendanceStats,
        physicalTests,
      };
    },
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
  };
};
