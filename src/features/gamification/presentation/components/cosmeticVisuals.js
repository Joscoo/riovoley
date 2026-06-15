const RARITY_INTENSITY = {
  common: 'sober',
  rare: 'sober',
  epic: 'strong',
  legendary: 'strong',
};

const FRAME_VARIANT_CLASSES = {
  studio: 'bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(226,232,240,0.9))] shadow-[0_0_22px_rgba(255,255,255,0.18)]',
  satin: 'bg-[linear-gradient(135deg,_rgba(226,232,240,0.96),_rgba(148,163,184,0.82))] shadow-[0_0_18px_rgba(148,163,184,0.18)]',
  ribbon: 'bg-[linear-gradient(135deg,_rgba(251,207,232,0.98),_rgba(190,24,93,0.82))] shadow-[0_0_22px_rgba(244,114,182,0.2)]',
  glass: 'bg-[linear-gradient(135deg,_rgba(51,65,85,0.98),_rgba(15,23,42,0.96))] shadow-[0_0_24px_rgba(15,23,42,0.34)]',
  pulse: 'bg-[linear-gradient(135deg,_rgba(203,213,225,0.94),_rgba(71,85,105,0.92))] shadow-[0_0_24px_rgba(148,163,184,0.22)]',
  flame: 'bg-[linear-gradient(135deg,_rgba(251,146,60,0.98),_rgba(190,24,93,0.88))] shadow-[0_0_30px_rgba(251,146,60,0.28)]',
  'arc-double': 'bg-[linear-gradient(135deg,_rgba(125,211,252,0.96),_rgba(30,64,175,0.9))] shadow-[0_0_30px_rgba(59,130,246,0.26)] ring-2 ring-cyan-200/30',
  elite: 'bg-[linear-gradient(135deg,_rgba(103,232,249,0.95),_rgba(79,70,229,0.84))] shadow-[0_0_32px_rgba(34,211,238,0.3)] ring-2 ring-indigo-300/30',
  crown: 'bg-[linear-gradient(135deg,_rgba(253,230,138,0.98),_rgba(180,83,9,0.9))] shadow-[0_0_34px_rgba(245,158,11,0.3)] ring-2 ring-amber-200/30',
};

const BACKGROUND_VARIANT_CLASSES = {
  portrait: 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),linear-gradient(145deg,_rgba(71,85,105,0.84),_rgba(15,23,42,0.92)_60%,_rgba(30,41,59,0.9))]',
  'soft-focus': 'bg-[radial-gradient(circle_at_top_left,_rgba(251,207,232,0.28),_transparent_34%),linear-gradient(145deg,_rgba(76,5,25,0.84),_rgba(190,24,93,0.62)_55%,_rgba(30,41,59,0.9))]',
  spotlight: 'bg-[radial-gradient(circle_at_top_center,_rgba(255,255,255,0.24),_transparent_30%),linear-gradient(145deg,_rgba(2,6,23,0.98),_rgba(30,41,59,0.94)_55%,_rgba(15,23,42,0.98))]',
  speed: 'bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.2),_transparent_34%),linear-gradient(145deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.94)_55%,_rgba(30,64,175,0.78))]',
  'speed-grid': 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_34%),linear-gradient(145deg,_rgba(8,47,73,0.94),_rgba(14,116,144,0.8)_55%,_rgba(15,23,42,0.92))]',
  'deep-ocean': 'bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(145deg,_rgba(12,74,110,0.96),_rgba(3,105,161,0.78)_55%,_rgba(15,23,42,0.92))]',
  'aurora-stage': 'bg-[radial-gradient(circle_at_top_left,_rgba(103,232,249,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(196,181,253,0.22),_transparent_32%),linear-gradient(145deg,_rgba(30,27,75,0.96),_rgba(49,46,129,0.9)_55%,_rgba(15,23,42,0.92))]',
  'summit-stage': 'bg-[radial-gradient(circle_at_top_left,_rgba(253,230,138,0.42),_transparent_38%),linear-gradient(145deg,_rgba(120,53,15,0.74),_rgba(245,158,11,0.34)_55%,_rgba(15,23,42,0.92))]',
};

const BADGE_VARIANT_MAP = {
  'club-seal': {
    classes: 'bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(148,163,184,0.9))] text-white ring-2 ring-slate-200/35',
    shortLabel: 'CLB',
    iconKey: 'shield',
  },
  flash: {
    classes: 'bg-[linear-gradient(135deg,_rgba(56,189,248,0.96),_rgba(37,99,235,0.88))] text-cyan-50 ring-2 ring-cyan-200/30',
    shortLabel: 'FLH',
    iconKey: 'star',
  },
  lens: {
    classes: 'bg-[linear-gradient(135deg,_rgba(30,41,59,0.98),_rgba(245,158,11,0.84))] text-amber-50 ring-2 ring-amber-200/30',
    shortLabel: 'LNS',
    iconKey: 'medal',
  },
  attendance: {
    classes: 'bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(20,83,45,0.9))] text-emerald-50 ring-2 ring-emerald-200/30',
    shortLabel: 'RCH',
    iconKey: 'shield',
  },
  record: {
    classes: 'bg-[linear-gradient(135deg,_rgba(120,53,15,0.98),_rgba(245,158,11,0.92))] text-amber-50 ring-2 ring-amber-200/35',
    shortLabel: 'REC',
    iconKey: 'medal',
  },
  forge: {
    classes: 'bg-[linear-gradient(135deg,_rgba(127,29,29,0.98),_rgba(251,146,60,0.92))] text-orange-50 ring-2 ring-orange-200/30',
    shortLabel: 'FRG',
    iconKey: 'star',
  },
  'crown-podium': {
    classes: 'bg-[linear-gradient(135deg,_rgba(245,158,11,0.98),_rgba(79,70,229,0.9))] text-white ring-2 ring-amber-200/35',
    shortLabel: 'POD',
    iconKey: 'medal',
  },
};

const EFFECT_VARIANT_MAP = {
  halo: {
    shellClasses: "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-white/16 before:blur-xl before:content-['']",
    backLayers: [],
    frontLayers: [],
  },
  sparkle: {
    shellClasses: "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-cyan-300/18 before:blur-xl before:content-['']",
    backLayers: [],
    frontLayers: ['sparkle'],
  },
  pulse: {
    shellClasses: "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-amber-300/18 before:blur-xl before:content-['']",
    backLayers: [],
    frontLayers: ['pulse'],
  },
  glow: {
    shellClasses: "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-cyan-300/18 before:blur-xl before:content-['']",
    backLayers: ['aura'],
    frontLayers: [],
  },
  'crown-burst': {
    shellClasses: "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-yellow-300/18 before:blur-xl before:content-['']",
    backLayers: ['legendary-aura'],
    frontLayers: ['crown-burst'],
  },
};

export const normalizeCosmeticItem = (item = null) => ({
  slug: item?.slug || '',
  rarity: item?.rarity || 'common',
  category: item?.category || null,
  metadata: item?.metadata || {},
});

export const resolveFrameVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.frameVariant || 'default-frame';

  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: FRAME_VARIANT_CLASSES[variant] || FRAME_VARIANT_CLASSES.elite,
  };
};

export const resolveBackgroundVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.backgroundVariant || 'default-background';

  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: BACKGROUND_VARIANT_CLASSES[variant] || BACKGROUND_VARIANT_CLASSES['speed-grid'],
  };
};

export const resolveBadgeVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.badgeVariant || 'default-badge';
  const config = BADGE_VARIANT_MAP[variant] || BADGE_VARIANT_MAP.record;

  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: config.classes,
    shortLabel: config.shortLabel,
    iconKey: normalized.metadata.icon || config.iconKey || 'star',
  };
};

export const resolveEffectVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.effectVariant || 'default-effect';
  const config = EFFECT_VARIANT_MAP[variant] || EFFECT_VARIANT_MAP.sparkle;

  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    layers: {
      back: config.backLayers,
      front: config.frontLayers,
    },
    classes: config.shellClasses,
  };
};
