import { FaCheckCircle, FaClipboardList, FaDollarSign } from 'react-icons/fa';
import { createAdminDashboardUseCases } from '../application/useCases/createAdminDashboardUseCases';
import { SupabaseAdminDashboardRepository } from '../infrastructure/repositories/supabaseAdminDashboardRepository';

export const createAdminDashboardService = (repository = new SupabaseAdminDashboardRepository()) => {
  const useCases = createAdminDashboardUseCases(repository, {
    attendance: () => <FaCheckCircle className="text-emerald-400" />,
    payment: () => <FaDollarSign className="text-cyan-400" />,
    empty: () => <FaClipboardList className="text-slate-400" />,
  });

  const loadDashboard = async () => {
    return useCases.loadDashboardUseCase.execute();
  };

  const loadFinancialReview = async () => {
    return useCases.loadFinancialReviewUseCase.execute();
  };

  return {
    loadDashboard,
    loadFinancialReview,
  };
};
