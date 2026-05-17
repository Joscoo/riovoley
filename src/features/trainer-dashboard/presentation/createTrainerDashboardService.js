import { createTrainerDashboardUseCases } from '../application/useCases/createTrainerDashboardUseCases';
import { SupabaseTrainerDashboardRepository } from '../infrastructure/repositories/supabaseTrainerDashboardRepository';

export const createTrainerDashboardService = (repository = new SupabaseTrainerDashboardRepository()) => {
  const useCases = createTrainerDashboardUseCases(repository);
  const loadStats = async () => useCases.loadStatsUseCase.execute();

  return { loadStats };
};
