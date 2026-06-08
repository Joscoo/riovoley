import { createTrainerDashboardUseCases } from '../application/useCases/createTrainerDashboardUseCases';
import { SupabaseTrainerDashboardRepository } from '../infrastructure/repositories/supabaseTrainerDashboardRepository';

export const createTrainerDashboardService = (repository = new SupabaseTrainerDashboardRepository()) => {
  const useCases = createTrainerDashboardUseCases(repository);
  const loadStats = async () => useCases.loadStatsUseCase.execute();
  const loadDashboard = async () => useCases.loadDashboardUseCase.execute();

  return { loadStats, loadDashboard };
};
