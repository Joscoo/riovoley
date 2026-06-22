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
    shellClasses: "before:absolute before:-inset-1.5 before:rounded-[inherit] before:opacity-90 before:blur-xl before:content-[''] after:absolute after:-inset-0.5 after:rounded-[inherit] after:border after:border-white/20 after:content-['']",
    backLayers: [],
    frontLayers: ['halo-ring'],
  },
  sparkle: {
    shellClasses: "before:absolute before:-inset-2 before:rounded-[inherit] before:opacity-95 before:blur-2xl before:content-[''] after:absolute after:-inset-0.5 after:rounded-[inherit] after:border after:border-white/20 after:content-['']",
    backLayers: ['aura'],
    frontLayers: ['sparkle', 'sparkle-orbit'],
  },
  pulse: {
    shellClasses: "before:absolute before:-inset-2 before:rounded-[inherit] before:opacity-95 before:blur-2xl before:content-[''] after:absolute after:-inset-0.5 after:rounded-[inherit] after:border after:border-white/20 after:content-['']",
    backLayers: ['aura'],
    frontLayers: ['pulse', 'pulse-orbit'],
  },
  glow: {
    shellClasses: "before:absolute before:-inset-2 before:rounded-[inherit] before:opacity-100 before:blur-2xl before:content-[''] after:absolute after:-inset-1 after:rounded-[inherit] after:border after:border-white/24 after:content-['']",
    backLayers: ['aura', 'aura-wide'],
    frontLayers: ['halo-ring'],
  },
  'crown-burst': {
    shellClasses: "before:absolute before:-inset-2 before:rounded-[inherit] before:opacity-100 before:blur-2xl before:content-[''] after:absolute after:-inset-1 after:rounded-[inherit] after:border after:border-white/28 after:content-['']",
    backLayers: ['legendary-aura', 'aura-wide'],
    frontLayers: ['crown-burst', 'sparkle-orbit'],
  },
};

const EFFECT_GLOW_MAP = {
  cyan: {
    shell: 'before:bg-cyan-300/28 after:border-cyan-200/35',
    back: 'bg-cyan-300/18',
    backWide: 'bg-sky-400/12',
    front: 'via-cyan-100/90',
    ring: 'border-cyan-200/35 shadow-[0_0_20px_rgba(34,211,238,0.28)]',
    chip: 'border-cyan-200/35 bg-cyan-300/20 text-cyan-50',
  },
  gold: {
    shell: 'before:bg-amber-300/30 after:border-amber-200/38',
    back: 'bg-amber-300/18',
    backWide: 'bg-yellow-300/12',
    front: 'via-amber-100/95',
    ring: 'border-amber-200/38 shadow-[0_0_24px_rgba(251,191,36,0.3)]',
    chip: 'border-amber-200/38 bg-amber-300/22 text-amber-50',
  },
  violet: {
    shell: 'before:bg-violet-300/28 after:border-violet-200/35',
    back: 'bg-violet-300/18',
    backWide: 'bg-fuchsia-300/12',
    front: 'via-violet-100/90',
    ring: 'border-violet-200/35 shadow-[0_0_22px_rgba(196,181,253,0.28)]',
    chip: 'border-violet-200/35 bg-violet-300/20 text-violet-50',
  },
  emerald: {
    shell: 'before:bg-emerald-300/28 after:border-emerald-200/35',
    back: 'bg-emerald-300/18',
    backWide: 'bg-lime-300/10',
    front: 'via-emerald-100/90',
    ring: 'border-emerald-200/35 shadow-[0_0_22px_rgba(110,231,183,0.28)]',
    chip: 'border-emerald-200/35 bg-emerald-300/20 text-emerald-50',
  },
  crimson: {
    shell: 'before:bg-rose-300/28 after:border-rose-200/35',
    back: 'bg-rose-300/18',
    backWide: 'bg-orange-300/10',
    front: 'via-rose-100/90',
    ring: 'border-rose-200/35 shadow-[0_0_22px_rgba(253,164,175,0.28)]',
    chip: 'border-rose-200/35 bg-rose-300/20 text-rose-50',
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
  if (!normalized.slug) {
    return {
      variant: 'none',
      intensity: 'none',
      classes: '',
    };
  }
  const variant = normalized.metadata.frameVariant || 'default-frame';

  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: FRAME_VARIANT_CLASSES[variant] || FRAME_VARIANT_CLASSES.elite,
  };
};

export const resolveBackgroundVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  if (!normalized.slug) {
    return {
      variant: 'none',
      intensity: 'none',
      classes: '',
    };
  }
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
  if (!normalized.slug) {
    return {
      variant: 'none',
      intensity: 'none',
      layers: {
        back: [],
        front: [],
      },
      classes: '',
    };
  }
  const variant = normalized.metadata.effectVariant || 'default-effect';
  const config = EFFECT_VARIANT_MAP[variant] || EFFECT_VARIANT_MAP.sparkle;
  const glowKey = normalized.metadata.glow || (normalized.rarity === 'legendary' ? 'gold' : 'cyan');
  const glow = EFFECT_GLOW_MAP[glowKey] || EFFECT_GLOW_MAP.cyan;

  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    glowKey,
    glow,
    layers: {
      back: config.backLayers,
      front: config.frontLayers,
    },
    classes: `${config.shellClasses} ${glow.shell}`,
  };
};
