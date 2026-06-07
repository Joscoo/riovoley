import { createGamificationUseCases } from '../application/useCases/createGamificationUseCases';
import { SupabaseGamificationRepository } from '../infrastructure/repositories/supabaseGamificationRepository';

export const createGamificationService = (repository = new SupabaseGamificationRepository()) => {
  const useCases = createGamificationUseCases(repository);

  const loadStudentGamification = async (userId) =>
    useCases.loadStudentGamificationUseCase.execute({ userId });

  const loadStudentGamificationByStudentId = async ({ studentId, studentData, physicalTests }) =>
    useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId, studentData, physicalTests });

  const refreshStudentProgress = async ({ studentId }) =>
    useCases.refreshStudentProgressUseCase.execute({ studentId });

  const processPhysicalTestRecorded = async ({ studentId, testId }) =>
    useCases.processPhysicalTestRecordedUseCase.execute({ studentId, testId });

  const getCategoryLeaderboard = async ({ category, ageBand, limit }) =>
    useCases.getCategoryLeaderboardUseCase.execute({ category, ageBand, limit });

  const listStudentAchievements = async ({ studentId }) =>
    useCases.listStudentAchievementsUseCase.execute({ studentId });

  const listActiveChallenges = async ({ studentId }) =>
    useCases.listActiveChallengesUseCase.execute({ studentId });

  return {
    loadStudentGamification,
    loadStudentGamificationByStudentId,
    refreshStudentProgress,
    processPhysicalTestRecorded,
    getCategoryLeaderboard,
    listStudentAchievements,
    listActiveChallenges,
  };
};
