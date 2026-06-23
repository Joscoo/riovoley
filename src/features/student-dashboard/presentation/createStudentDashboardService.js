import { createStudentDashboardUseCases } from '../application/useCases/createStudentDashboardUseCases';
import { SupabaseStudentDashboardRepository } from '../infrastructure/repositories/supabaseStudentDashboardRepository';
import { gamificationService } from '../../gamification';

export const createStudentDashboardService = (
  repository = new SupabaseStudentDashboardRepository(),
  deps = { gamificationService }
) => {
  const useCases = createStudentDashboardUseCases(repository, deps);

  const loadStudentPanelData = async (userId) => useCases.loadStudentPanelDataUseCase.execute({ userId });
  const loadStudentViewData = async (userId) => useCases.loadStudentViewDataUseCase.execute({ userId });
  const loadPaymentStatus = async (studentId) => useCases.loadPaymentStatusUseCase.execute({ studentId });
  const loadPaymentsHistory = async (studentId) => useCases.loadPaymentsHistoryUseCase.execute({ studentId });
  const loadAttendanceStats = async (studentId) => useCases.loadAttendanceStatsUseCase.execute({ studentId });
  const loadPhysicalTests = async (studentId) => useCases.loadPhysicalTestsUseCase.execute({ studentId });
  const subscribeToPaymentChanges = ({ studentId, onChange }) =>
    useCases.subscribeToPaymentChangesUseCase.execute({ studentId, onChange });

  return {
    loadStudentPanelData,
    loadStudentViewData,
    loadPaymentStatus,
    loadPaymentsHistory,
    loadAttendanceStats,
    loadPhysicalTests,
    subscribeToPaymentChanges,
  };
};
