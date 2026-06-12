import { createGamificationUseCases } from '../application/useCases/createGamificationUseCases';
import { SupabaseGamificationRepository } from '../infrastructure/repositories/supabaseGamificationRepository';
import { pushNotificationGateway } from '../../../shared/infrastructure/mobile';

export const createGamificationService = (
  repository = new SupabaseGamificationRepository(),
  deps = {},
) => {
  const useCases = createGamificationUseCases(repository, {
    notificationService: deps.notificationService || pushNotificationGateway,
  });

  const loadStudentGamification = async (userId) =>
    useCases.loadStudentGamificationUseCase.execute({ userId });

  const loadStudentGamificationByStudentId = async ({ studentId, studentData, physicalTests }) =>
    useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId, studentData, physicalTests });

  const refreshStudentProgress = async ({ studentId }) =>
    useCases.refreshStudentProgressUseCase.execute({ studentId });

  const processPhysicalTestRecorded = async ({ studentId, testId }) =>
    useCases.processPhysicalTestRecordedUseCase.execute({ studentId, testId });

  const getCategoryLeaderboard = async ({ category, ageBand, limit, leaderboardType }) =>
    useCases.getCategoryLeaderboardUseCase.execute({ category, ageBand, limit, leaderboardType });

  const listCategoryLeaderboards = async ({ category, ageBand, limit }) =>
    useCases.listCategoryLeaderboardsUseCase.execute({ category, ageBand, limit });

  const listStudentAchievements = async ({ studentId }) =>
    useCases.listStudentAchievementsUseCase.execute({ studentId });

  const listActiveChallenges = async ({ studentId }) =>
    useCases.listActiveChallengesUseCase.execute({ studentId });

  const loadXpLedger = async ({ studentId, limit }) =>
    useCases.loadXpLedgerUseCase.execute({ studentId, limit });

  const loadCurrencyWallet = async ({ studentId, limit }) =>
    useCases.loadCurrencyWalletUseCase.execute({ studentId, limit });

  const registerDailyLoginReward = async ({ userId }) =>
    useCases.registerDailyLoginRewardUseCase.execute({ userId });

  const updateStudentIdentity = async ({
    userId,
    nickname,
    selectedTitleSlug,
    avatarStyle,
    avatarModelSlug,
    profileImageMode,
    profilePhotoFile,
    removeProfilePhoto,
  }) =>
    useCases.updateStudentIdentityUseCase.execute({
      userId,
      nickname,
      selectedTitleSlug,
      avatarStyle,
      avatarModelSlug,
      profileImageMode,
      profilePhotoFile,
      removeProfilePhoto,
    });

  const purchaseCosmeticItem = async ({ userId, itemSlug }) =>
    useCases.purchaseCosmeticItemUseCase.execute({ userId, itemSlug });

  const equipCosmeticItem = async ({ userId, itemSlug }) =>
    useCases.equipCosmeticItemUseCase.execute({ userId, itemSlug });

  const unequipCosmeticItem = async ({ userId, category }) =>
    useCases.unequipCosmeticItemUseCase.execute({ userId, category });

  return {
    loadStudentGamification,
    loadStudentGamificationByStudentId,
    refreshStudentProgress,
    processPhysicalTestRecorded,
    getCategoryLeaderboard,
    listCategoryLeaderboards,
    listStudentAchievements,
    listActiveChallenges,
    loadXpLedger,
    loadCurrencyWallet,
    registerDailyLoginReward,
    updateStudentIdentity,
    purchaseCosmeticItem,
    equipCosmeticItem,
    unequipCosmeticItem,
  };
};
