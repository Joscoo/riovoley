import { createGamificationAdminUseCases } from '../application/useCases/createGamificationAdminUseCases';
import { SupabaseGamificationRepository } from '../infrastructure/repositories/supabaseGamificationRepository';

export const createGamificationAdminService = (
  repository = new SupabaseGamificationRepository(),
) => {
  const useCases = createGamificationAdminUseCases(repository);

  return {
    // Cosmetics
    listCosmeticCatalog: () => useCases.listCosmeticCatalogUseCase.execute(),
    upsertCosmeticItem: ({ item, isNew }) =>
      useCases.upsertCosmeticItemUseCase.execute({ item, isNew }),
    uploadCosmeticAsset: ({ file, slug }) => repository.uploadCosmeticAsset(file, slug),

    // Achievements
    listAchievementCatalog: () => useCases.listAchievementCatalogUseCase.execute(),
    upsertAchievement: ({ item, isNew }) =>
      useCases.upsertAchievementUseCase.execute({ item, isNew }),

    // Goals / challenges
    listGoalsCatalog: () => useCases.listGoalsCatalogUseCase.execute(),
    upsertGoal: ({ item, isNew }) => useCases.upsertGoalUseCase.execute({ item, isNew }),
  };
};

