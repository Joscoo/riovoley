const COSMETIC_RARITIES   = ['common', 'rare', 'epic', 'legendary'];
const COSMETIC_CATEGORIES = ['frame', 'background', 'badge', 'effect', 'custom_frame', 'riovoley'];
const WINDOW_TYPES        = ['rolling', 'calendar-month'];


const toSlug = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const createGamificationAdminUseCases = (repository) => {
  // ── Cosmetics ─────────────────────────────────────────────────────────────

  const listCosmeticCatalogUseCase = {
    execute: () => repository.listAllCosmeticItems(),
  };

  const upsertCosmeticItemUseCase = {
    execute: async ({ item, isNew }) => {
      if (!item.name?.trim()) throw new Error('El nombre del cosmético es requerido.');
      if (!item.description?.trim()) throw new Error('La descripción es requerida.');
      if (!COSMETIC_RARITIES.includes(item.rarity)) throw new Error('Rareza inválida.');
      if (!COSMETIC_CATEGORIES.includes(item.category)) throw new Error('Categoría inválida.');
      if (item.price_coins == null || Number(item.price_coins) < 0) throw new Error('El precio debe ser ≥ 0.');
      if (isNew && !item.slug?.trim()) throw new Error('El slug es requerido.');

      const payload = {
        slug: isNew ? toSlug(item.slug) : item.slug,
        name: item.name.trim(),
        description: item.description.trim(),
        rarity: item.rarity,
        category: item.category,
        price_coins: Number(item.price_coins),
        sort_order: Number(item.sort_order ?? 0),
        is_active: item.is_active !== false,
        metadata: item.metadata || {},
      };

      return repository.upsertCosmeticItem(payload);
    },
  };

  // ── Achievements ──────────────────────────────────────────────────────────

  const listAchievementCatalogUseCase = {
    execute: () => repository.listAllAchievements(),
  };

  const upsertAchievementUseCase = {
    execute: async ({ item, isNew }) => {
      if (!item.title?.trim()) throw new Error('El título del logro es requerido.');
      if (!item.description?.trim()) throw new Error('La descripción es requerida.');
      if (!item.core_driver?.trim()) throw new Error('El driver principal es requerido.');
      if (item.xp_reward == null || Number(item.xp_reward) < 0) throw new Error('La recompensa XP debe ser ≥ 0.');
      if (isNew && !item.slug?.trim()) throw new Error('El slug es requerido.');

      const payload = {
        slug: isNew ? toSlug(item.slug) : item.slug,
        title: item.title.trim(),
        description: item.description.trim(),
        core_driver: item.core_driver.trim(),
        xp_reward: Number(item.xp_reward),
        sort_order: Number(item.sort_order ?? 0),
        is_active: item.is_active !== false,
        criteria: item.criteria || {},
      };

      return repository.upsertAchievement(payload);
    },
  };

  // ── Goals (challenges) ────────────────────────────────────────────────────

  const listGoalsCatalogUseCase = {
    execute: () => repository.listAllGoals(),
  };

  const upsertGoalUseCase = {
    execute: async ({ item, isNew }) => {
      if (!item.title?.trim()) throw new Error('El título de la meta es requerido.');
      if (!item.description?.trim()) throw new Error('La descripción es requerida.');
      if (!item.core_driver?.trim()) throw new Error('El driver principal es requerido.');
      if (!item.target_metric?.trim()) throw new Error('La métrica objetivo es requerida.');
      if (item.target_value == null || Number(item.target_value) < 0) throw new Error('El valor objetivo debe ser ≥ 0.');
      if (!WINDOW_TYPES.includes(item.window_type)) throw new Error('Tipo de ventana inválido.');
      if (isNew && !item.slug?.trim()) throw new Error('El slug es requerido.');

      const payload = {
        slug: isNew ? toSlug(item.slug) : item.slug,
        title: item.title.trim(),
        description: item.description.trim(),
        core_driver: item.core_driver.trim(),
        target_metric: item.target_metric.trim(),
        target_value: Number(item.target_value),
        window_type: item.window_type,
        is_active: item.is_active !== false,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
      };

      return repository.upsertGoal(payload);
    },
  };

  return {
    listCosmeticCatalogUseCase,
    upsertCosmeticItemUseCase,
    listAchievementCatalogUseCase,
    upsertAchievementUseCase,
    listGoalsCatalogUseCase,
    upsertGoalUseCase,
  };
};
