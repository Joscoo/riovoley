import { DEFAULT_AVATAR_STYLE, resolveAvatarModelMeta } from './avatarCatalog';

const encode = (value) => encodeURIComponent(String(value || ''));

const getBackgroundPalette = (equipment = {}) => {
  if (equipment.effect === 'effect_aura_oro') {
    return 'fef3c7,d97706';
  }
  if (equipment.effect === 'effect_rayo_cian') {
    return 'cffafe,0891b2';
  }
  if (equipment.background === 'background_cancha_dorada') {
    return 'fde68a,f59e0b';
  }
  if (equipment.background === 'background_olas_noche') {
    return '1e293b,0f172a';
  }
  return 'e2e8f0,94a3b8';
};

export const buildAvatarUrl = ({
  seed,
  style = DEFAULT_AVATAR_STYLE,
  modelSlug,
  equipment = {},
}) => {
  const { resolvedStyleSlug, model } = resolveAvatarModelMeta(style, modelSlug);
  const safeSeed = `${seed || 'Riovoley'}:${model.visualParams?.seedSuffix || model.slug}`;
  const backgroundColor = getBackgroundPalette(equipment);

  return `https://api.dicebear.com/10.x/${encode(resolvedStyleSlug)}/svg?seed=${encode(safeSeed)}&backgroundColor=${backgroundColor}&radius=50`;
};
