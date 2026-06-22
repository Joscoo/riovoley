import React from 'react';
import PropTypes from 'prop-types';
import { FaBolt, FaMedal, FaShieldAlt, FaStar, FaUserCircle } from 'react-icons/fa';
import { cn } from '../../../../lib/cn';
import {
  normalizeCosmeticItem,
  resolveBackgroundVisual,
  resolveBadgeVisual,
  resolveEffectVisual,
  resolveFrameVisual,
} from './cosmeticVisuals';

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

const normalizeEquipment = (equipment = {}) => ({
  frame: equipment?.frame || equipment?.frame_item_slug || null,
  background: equipment?.background || equipment?.background_item_slug || null,
  badge: equipment?.badge || equipment?.badge_item_slug || null,
  effect: equipment?.effect || equipment?.effect_item_slug || null,
});

const getBadgeIcon = (iconKey) => {
  switch (iconKey) {
    case 'shield':
      return <FaShieldAlt />;
    case 'medal':
      return <FaMedal />;
    default:
      return <FaStar />;
  }
};

const renderEffectFrontLayer = (layer, index, effectVisual) => {
  switch (layer) {
    case 'sparkle':
      return (
        <div
          key={`effect-front-${index}`}
          className={cn(
            'pointer-events-none absolute inset-x-2 top-1 z-[2] h-2 rounded-full bg-gradient-to-r from-transparent to-transparent',
            effectVisual.glow?.front || 'via-cyan-100/90'
          )}
        />
      );
    case 'pulse':
      return (
        <div
          key={`effect-front-${index}`}
          className={cn(
            'pointer-events-none absolute inset-x-1 top-0 z-[2] h-3 rounded-full bg-gradient-to-r from-transparent to-transparent',
            effectVisual.glow?.front || 'via-amber-100/95'
          )}
        />
      );
    case 'halo-ring':
      return (
        <div
          key={`effect-front-${index}`}
          className={cn(
            'pointer-events-none absolute inset-1 z-[2] rounded-[inherit] border',
            effectVisual.glow?.ring || 'border-cyan-200/35'
          )}
        />
      );
    case 'sparkle-orbit':
      return (
        <div
          key={`effect-front-${index}`}
          className="pointer-events-none absolute inset-0 z-[2]"
        >
          <span className={cn('absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full', effectVisual.glow?.back || 'bg-cyan-300/18')} />
          <span className={cn('absolute right-1.5 top-2 h-1 w-1 rounded-full', effectVisual.glow?.backWide || 'bg-sky-400/12')} />
          <span className={cn('absolute bottom-1.5 left-2 h-1 w-1 rounded-full', effectVisual.glow?.backWide || 'bg-sky-400/12')} />
        </div>
      );
    case 'pulse-orbit':
      return (
        <div
          key={`effect-front-${index}`}
          className={cn(
            'pointer-events-none absolute inset-0 z-[2] rounded-[inherit] border border-dashed',
            effectVisual.glow?.ring || 'border-cyan-200/35'
          )}
        />
      );
    case 'crown-burst':
      return (
        <div
          key={`effect-front-${index}`}
          data-testid="legendary-effect-front"
          className={cn(
            'pointer-events-none absolute inset-x-1 top-0 z-[2] h-3 rounded-full bg-gradient-to-r from-transparent to-transparent',
            effectVisual.glow?.front || 'via-amber-100/95'
          )}
        />
      );
    default:
      return null;
  }
};

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

  const frameItem = normalizeCosmeticItem(
    equippedItems?.frame || (normalizedEquipment.frame ? { slug: normalizedEquipment.frame } : null)
  );
  const backgroundItem = normalizeCosmeticItem(
    equippedItems?.background || (normalizedEquipment.background ? { slug: normalizedEquipment.background } : null)
  );
  const effectItem = normalizeCosmeticItem(
    equippedItems?.effect || (normalizedEquipment.effect ? { slug: normalizedEquipment.effect } : null)
  );
  const badgeItem = normalizeCosmeticItem(
    equippedItems?.badge || (normalizedEquipment.badge ? { slug: normalizedEquipment.badge } : null)
  );

  const frameVisual = resolveFrameVisual(frameItem);
  const backgroundVisual = resolveBackgroundVisual(backgroundItem);
  const effectVisual = resolveEffectVisual(effectItem);
  const badgeVisual = badgeItem.slug ? resolveBadgeVisual(badgeItem) : null;

  return (
    <div className={cn('relative isolate', className)}>
      {(effectVisual.layers.back || []).map((layerClass, index) => (
        <div
          key={`effect-back-${index}`}
          className={cn(
            'pointer-events-none absolute inset-0 rounded-[inherit]',
            layerClass === 'legendary-aura'
              ? cn(effectVisual.glow?.back || 'bg-amber-300/18', 'scale-[1.12] blur-2xl')
              : layerClass === 'aura-wide'
                ? cn(effectVisual.glow?.backWide || 'bg-sky-400/12', 'scale-[1.2] blur-3xl')
                : layerClass === 'aura'
                  ? cn(effectVisual.glow?.back || 'bg-cyan-300/18', 'scale-[1.08] blur-xl')
                  : layerClass
          )}
          data-testid={effectItem.rarity === 'legendary' ? 'legendary-effect-back' : undefined}
        />
      ))}

      <div
        className={cn(
          'relative overflow-visible',
          sizeStyles.shell,
          frameVisual.classes,
          effectVisual.classes
        )}
        data-testid="portrait-effect-shell"
        data-visual-variant={effectVisual.variant}
      >
        <div
          className={cn(
            'relative h-full w-full overflow-hidden border border-white/10',
            sizeStyles.inner,
            backgroundVisual.classes
          )}
          data-testid="portrait-frame-shell"
          data-visual-variant={frameVisual.variant}
        >
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

          {(effectVisual.layers.front || []).map((layer, index) => renderEffectFrontLayer(layer, index, effectVisual))}

          {normalizedEquipment.effect ? (
            <div className={cn(
              'pointer-events-none absolute right-2 top-2 z-[2] rounded-full p-1 text-[10px]',
              effectVisual.glow?.chip || 'border-cyan-200/35 bg-cyan-300/20 text-cyan-50'
            )}>
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
            <span className="shrink-0">{getBadgeIcon(badgeVisual.iconKey)}</span>
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
    frame: PropTypes.shape({
      slug: PropTypes.string,
      rarity: PropTypes.string,
      metadata: PropTypes.object,
    }),
    background: PropTypes.shape({
      slug: PropTypes.string,
      rarity: PropTypes.string,
      metadata: PropTypes.object,
    }),
    badge: PropTypes.shape({
      slug: PropTypes.string,
      name: PropTypes.string,
      rarity: PropTypes.string,
      metadata: PropTypes.object,
    }),
    effect: PropTypes.shape({
      slug: PropTypes.string,
      rarity: PropTypes.string,
      metadata: PropTypes.object,
    }),
  }),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  showBadgeLabel: PropTypes.bool,
};

export default IdentityPortrait;
