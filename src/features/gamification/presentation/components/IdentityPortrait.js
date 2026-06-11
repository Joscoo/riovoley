import React from 'react';
import PropTypes from 'prop-types';
import { FaBolt, FaFire, FaMedal, FaShieldAlt, FaStar, FaUserCircle } from 'react-icons/fa';
import { cn } from '../../../../lib/cn';

const SIZE_MAP = {
  sm: {
    shell: 'h-12 w-12 rounded-2xl p-0.5',
    inner: 'rounded-[14px]',
    image: 'rounded-[12px]',
    badge: 'h-6 min-w-6 -bottom-1.5 -right-1.5 px-1.5 text-[10px]',
  },
  md: {
    shell: 'h-16 w-16 rounded-[22px] p-0.5',
    inner: 'rounded-[18px]',
    image: 'rounded-[16px]',
    badge: 'h-7 min-w-7 -bottom-2 -right-2 px-2 text-[10px]',
  },
  lg: {
    shell: 'h-28 w-28 rounded-[32px] p-1',
    inner: 'rounded-[28px]',
    image: 'rounded-[24px]',
    badge: 'h-9 min-w-9 -bottom-2.5 -right-2.5 px-2.5 text-[11px]',
  },
};

const pickVariant = (slug, variants) => {
  if (!slug || !variants.length) {
    return variants[0];
  }

  const hash = Array.from(String(slug)).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

const FRAME_VARIANTS = [
  'bg-[linear-gradient(135deg,_rgba(226,232,240,0.92),_rgba(148,163,184,0.72))]',
  'bg-[linear-gradient(135deg,_rgba(253,230,138,0.98),_rgba(180,83,9,0.9))] shadow-[0_0_28px_rgba(245,158,11,0.24)]',
  'bg-[linear-gradient(135deg,_rgba(103,232,249,0.95),_rgba(8,145,178,0.8))] shadow-[0_0_28px_rgba(34,211,238,0.28)]',
  'bg-[linear-gradient(135deg,_rgba(251,146,60,0.98),_rgba(190,24,93,0.88))] shadow-[0_0_30px_rgba(251,146,60,0.26)]',
  'bg-[linear-gradient(135deg,_rgba(192,132,252,0.98),_rgba(79,70,229,0.88))] shadow-[0_0_30px_rgba(168,85,247,0.24)]',
];

const BACKGROUND_VARIANTS = [
  'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_32%),linear-gradient(145deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92))]',
  'bg-[radial-gradient(circle_at_top_left,_rgba(254,240,138,0.55),_transparent_38%),linear-gradient(145deg,_rgba(120,53,15,0.78),_rgba(245,158,11,0.36)_55%,_rgba(15,23,42,0.9))]',
  'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),linear-gradient(145deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.94)_55%,_rgba(8,47,73,0.88))]',
  'bg-[radial-gradient(circle_at_top_left,_rgba(248,113,113,0.18),_transparent_34%),linear-gradient(145deg,_rgba(69,10,10,0.96),_rgba(127,29,29,0.92)_55%,_rgba(15,23,42,0.9))]',
  'bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_34%),linear-gradient(145deg,_rgba(30,27,75,0.96),_rgba(49,46,129,0.92)_55%,_rgba(17,24,39,0.9))]',
];

const EFFECT_VARIANTS = [
  '',
  "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-amber-300/18 before:blur-xl before:content-['']",
  "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-cyan-300/18 before:blur-xl before:content-['']",
  "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-rose-400/18 before:blur-xl before:content-['']",
  "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-violet-400/18 before:blur-xl before:content-['']",
];

const getFrameClasses = (slug) => {
  switch (slug) {
    case 'frame_cian_ruta':
      return 'bg-[linear-gradient(135deg,_rgba(103,232,249,0.95),_rgba(8,145,178,0.8))] shadow-[0_0_28px_rgba(34,211,238,0.28)]';
    case 'frame_bronce_club':
      return 'bg-[linear-gradient(135deg,_rgba(253,230,138,0.98),_rgba(180,83,9,0.9))] shadow-[0_0_28px_rgba(245,158,11,0.24)]';
    default:
      return pickVariant(slug, FRAME_VARIANTS);
  }
};

const getBackgroundClasses = (slug) => {
  switch (slug) {
    case 'background_cancha_dorada':
      return 'bg-[radial-gradient(circle_at_top_left,_rgba(254,240,138,0.55),_transparent_38%),linear-gradient(145deg,_rgba(120,53,15,0.78),_rgba(245,158,11,0.36)_55%,_rgba(15,23,42,0.9))]';
    case 'background_olas_noche':
      return 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),linear-gradient(145deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.94)_55%,_rgba(8,47,73,0.88))]';
    default:
      return pickVariant(slug, BACKGROUND_VARIANTS);
  }
};

const getEffectClasses = (slug) => {
  switch (slug) {
    case 'effect_aura_oro':
      return "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-amber-300/18 before:blur-xl before:content-['']";
    case 'effect_rayo_cian':
      return "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-cyan-300/18 before:blur-xl before:content-['']";
    default:
      return pickVariant(slug, EFFECT_VARIANTS);
  }
};

const getBadgeVisual = (badgeItem) => {
  const slug = badgeItem?.slug || '';
  const metadata = badgeItem?.metadata || {};

  if (metadata.icon === 'shield' || slug.includes('muro')) {
    return {
      icon: <FaShieldAlt />,
      classes: 'bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(148,163,184,0.9))] text-white ring-2 ring-slate-200/35',
      shortLabel: 'MC',
    };
  }

  if (slug.includes('record') || slug.includes('medalla')) {
    return {
      icon: <FaMedal />,
      classes: 'bg-[linear-gradient(135deg,_rgba(120,53,15,0.98),_rgba(245,158,11,0.92))] text-amber-50 ring-2 ring-amber-200/35',
      shortLabel: 'REC',
    };
  }

  if (slug.includes('fuego') || slug.includes('impacto')) {
    return {
      icon: <FaFire />,
      classes: 'bg-[linear-gradient(135deg,_rgba(127,29,29,0.98),_rgba(251,146,60,0.92))] text-orange-50 ring-2 ring-orange-200/30',
      shortLabel: 'IGN',
    };
  }

  return {
    icon: <FaStar />,
    classes: 'bg-[linear-gradient(135deg,_rgba(120,53,15,0.98),_rgba(245,158,11,0.92))] text-amber-50 ring-2 ring-amber-200/35',
    shortLabel: 'PI',
  };
};

const normalizeEquipment = (equipment = {}) => ({
  frame: equipment?.frame || equipment?.frame_item_slug || null,
  background: equipment?.background || equipment?.background_item_slug || null,
  badge: equipment?.badge || equipment?.badge_item_slug || null,
  effect: equipment?.effect || equipment?.effect_item_slug || null,
});

const IdentityPortrait = ({
  imageUrl,
  displayName,
  equipment,
  equippedItems,
  size = 'md',
  className,
  imageClassName,
  showBadgeLabel = false,
}) => {
  const normalizedEquipment = normalizeEquipment(equipment);
  const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md;
  const badgeItem = equippedItems?.badge || (normalizedEquipment.badge ? { slug: normalizedEquipment.badge } : null);
  const badgeVisual = badgeItem ? getBadgeVisual(badgeItem) : null;

  return (
    <div className={cn('relative isolate', className)}>
      <div
        className={cn(
          'relative overflow-visible',
          sizeStyles.shell,
          getFrameClasses(normalizedEquipment.frame),
          getEffectClasses(normalizedEquipment.effect)
        )}
      >
        <div className={cn('relative h-full w-full overflow-hidden border border-white/10', sizeStyles.inner, getBackgroundClasses(normalizedEquipment.background))}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_28%)]" />
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName ? `Perfil de ${displayName}` : 'Imagen de perfil'}
              className={cn('relative z-[1] h-full w-full object-cover', sizeStyles.image, imageClassName)}
            />
          ) : (
            <div className={cn('relative z-[1] flex h-full w-full items-center justify-center bg-white/5 text-slate-400', sizeStyles.image)}>
              <FaUserCircle className={cn(size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-xl' : 'text-3xl')} />
            </div>
          )}
          {normalizedEquipment.effect ? (
            <div className="pointer-events-none absolute right-2 top-2 z-[2] rounded-full border border-white/15 bg-black/25 p-1 text-[10px] text-white/85">
              <FaBolt />
            </div>
          ) : null}
        </div>

        {badgeVisual ? (
          <div
            className={cn(
              'absolute z-[3] inline-flex items-center justify-center gap-1 rounded-full border border-white/15 font-black shadow-lg backdrop-blur-sm',
              sizeStyles.badge,
              badgeVisual.classes
            )}
            title={equippedItems?.badge?.name || 'Insignia equipada'}
          >
            <span className="shrink-0">{badgeVisual.icon}</span>
            {showBadgeLabel ? <span>{badgeVisual.shortLabel}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

IdentityPortrait.propTypes = {
  imageUrl: PropTypes.string,
  displayName: PropTypes.string,
  equipment: PropTypes.shape({
    frame: PropTypes.string,
    background: PropTypes.string,
    badge: PropTypes.string,
    effect: PropTypes.string,
    frame_item_slug: PropTypes.string,
    background_item_slug: PropTypes.string,
    badge_item_slug: PropTypes.string,
    effect_item_slug: PropTypes.string,
  }),
  equippedItems: PropTypes.shape({
    badge: PropTypes.shape({
      slug: PropTypes.string,
      name: PropTypes.string,
      metadata: PropTypes.object,
    }),
  }),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  showBadgeLabel: PropTypes.bool,
};

export default IdentityPortrait;
