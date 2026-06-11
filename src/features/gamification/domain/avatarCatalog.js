const buildModel = ({
  slug,
  name,
  description,
  isBase,
  unlockType,
  unlockHint,
  unlockLevel = null,
  visualParams = {},
}) => ({
  slug,
  name,
  description,
  isBase,
  unlockType,
  unlockHint,
  unlockLevel,
  visualParams,
});

const buildStyle = ({ slug, name, description, models }) => ({
  slug,
  name,
  description,
  models,
});

export const AVATAR_STYLE_OPTIONS = [
  buildStyle({
    slug: 'adventurer-neutral',
    name: 'Aventurero',
    description: 'Avatar ilustrado con rasgos expresivos y tono amigable.',
    models: [
      buildModel({
        slug: 'adventurer-01',
        name: 'Aventurero Base',
        description: 'Modelo de inicio con presencia equilibrada.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'adventurer-base-01' },
      }),
      buildModel({
        slug: 'adventurer-02',
        name: 'Aventurero Clave',
        description: 'Variacion con una lectura mas competitiva.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'adventurer-base-02' },
      }),
      buildModel({
        slug: 'adventurer-03',
        name: 'Aventurero Elite',
        description: 'Modelo aspiracional con mayor presencia visual.',
        isBase: false,
        unlockType: 'level',
        unlockHint: 'Desbloquea al llegar al nivel 4.',
        unlockLevel: 4,
        visualParams: { seedSuffix: 'adventurer-elite-03' },
      }),
      buildModel({
        slug: 'adventurer-04',
        name: 'Aventurero Cobalto',
        description: 'Variacion marcada para quien ya compite arriba.',
        isBase: false,
        unlockType: 'achievement',
        unlockHint: 'Desbloquea al entrar al top 3 de rendimiento.',
        visualParams: { seedSuffix: 'adventurer-cobalt-04' },
      }),
      buildModel({
        slug: 'adventurer-05',
        name: 'Aventurero Constante',
        description: 'Modelo reservado para perfiles con racha fuerte.',
        isBase: false,
        unlockType: 'streak',
        unlockHint: 'Desbloquea con una racha mensual consistente.',
        visualParams: { seedSuffix: 'adventurer-streak-05' },
      }),
    ],
  }),
  buildStyle({
    slug: 'lorelei-neutral',
    name: 'Lorelei',
    description: 'Estilo limpio con mas variacion visual en el rostro.',
    models: [
      buildModel({
        slug: 'lorelei-01',
        name: 'Lorelei Base',
        description: 'Modelo claro para perfiles ligeros.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'lorelei-base-01' },
      }),
      buildModel({
        slug: 'lorelei-02',
        name: 'Lorelei Ruta',
        description: 'Variacion con una lectura mas definida.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'lorelei-base-02' },
      }),
      buildModel({
        slug: 'lorelei-03',
        name: 'Lorelei Elite',
        description: 'Modelo bloqueado para metas superiores.',
        isBase: false,
        unlockType: 'level',
        unlockHint: 'Desbloquea al llegar al nivel 5.',
        unlockLevel: 5,
        visualParams: { seedSuffix: 'lorelei-elite-03' },
      }),
      buildModel({
        slug: 'lorelei-04',
        name: 'Lorelei Aurora',
        description: 'Version mas expresiva para quien ya pisa fuerte.',
        isBase: false,
        unlockType: 'achievement',
        unlockHint: 'Desbloquea al entrar al top 3 de rendimiento.',
        visualParams: { seedSuffix: 'lorelei-aurora-04' },
      }),
      buildModel({
        slug: 'lorelei-05',
        name: 'Lorelei Marfil',
        description: 'Modelo fino para perfiles muy constantes.',
        isBase: false,
        unlockType: 'streak',
        unlockHint: 'Desbloquea con una racha mensual consistente.',
        visualParams: { seedSuffix: 'lorelei-ivory-05' },
      }),
    ],
  }),
  buildStyle({
    slug: 'thumbs',
    name: 'Thumbs',
    description: 'Personaje simple, dinamico y muy claro en tamanos pequenos.',
    models: [
      buildModel({
        slug: 'thumbs-01',
        name: 'Thumbs Base',
        description: 'Modelo simple para interfaces compactas.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'thumbs-base-01' },
      }),
      buildModel({
        slug: 'thumbs-02',
        name: 'Thumbs Sprint',
        description: 'Variacion con energia mas atletica.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'thumbs-base-02' },
      }),
      buildModel({
        slug: 'thumbs-03',
        name: 'Thumbs Elite',
        description: 'Modelo bloqueado con mayor prestigio.',
        isBase: false,
        unlockType: 'achievement',
        unlockHint: 'Desbloquea al entrar al top 3 de rendimiento.',
        unlockLevel: 0,
        visualParams: { seedSuffix: 'thumbs-elite-03' },
      }),
      buildModel({
        slug: 'thumbs-04',
        name: 'Thumbs Titan',
        description: 'Variante compacta para quien ya sostiene progreso serio.',
        isBase: false,
        unlockType: 'level',
        unlockHint: 'Desbloquea al llegar al nivel 6.',
        unlockLevel: 6,
        visualParams: { seedSuffix: 'thumbs-titan-04' },
      }),
      buildModel({
        slug: 'thumbs-05',
        name: 'Thumbs Record',
        description: 'Modelo de presencia corta pero muy competitiva.',
        isBase: false,
        unlockType: 'achievement',
        unlockHint: 'Desbloquea al entrar al top 3 de rendimiento.',
        visualParams: { seedSuffix: 'thumbs-record-05' },
      }),
    ],
  }),
  buildStyle({
    slug: 'pixel-art-neutral',
    name: 'Pixel',
    description: 'Estilo retro para perfiles con presencia mas gamer.',
    models: [
      buildModel({
        slug: 'pixel-art-01',
        name: 'Pixel Base',
        description: 'Modelo de entrada con lectura retro.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'pixel-base-01' },
      }),
      buildModel({
        slug: 'pixel-art-02',
        name: 'Pixel Circuito',
        description: 'Variacion con una energia mas marcada.',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'pixel-base-02' },
      }),
      buildModel({
        slug: 'pixel-art-03',
        name: 'Pixel Elite',
        description: 'Modelo bloqueado para la cima competitiva.',
        isBase: false,
        unlockType: 'streak',
        unlockHint: 'Desbloquea con una racha mensual consistente.',
        unlockLevel: 0,
        visualParams: { seedSuffix: 'pixel-elite-03' },
      }),
      buildModel({
        slug: 'pixel-art-04',
        name: 'Pixel Neon',
        description: 'Version retro mas viva para niveles altos.',
        isBase: false,
        unlockType: 'level',
        unlockHint: 'Desbloquea al llegar al nivel 6.',
        unlockLevel: 6,
        visualParams: { seedSuffix: 'pixel-neon-04' },
      }),
      buildModel({
        slug: 'pixel-art-05',
        name: 'Pixel Corona',
        description: 'Modelo premium para rachas largas y presencia alta.',
        isBase: false,
        unlockType: 'streak',
        unlockHint: 'Desbloquea con una racha mensual consistente.',
        visualParams: { seedSuffix: 'pixel-crown-05' },
      }),
    ],
  }),
];

export const DEFAULT_AVATAR_STYLE = AVATAR_STYLE_OPTIONS[0].slug;

export const isValidAvatarStyle = (value) =>
  AVATAR_STYLE_OPTIONS.some((option) => option.slug === value);

export const getAvatarStyleMeta = (value) =>
  AVATAR_STYLE_OPTIONS.find((option) => option.slug === value) || AVATAR_STYLE_OPTIONS[0];

export const resolveAvatarStyleMeta = (value) => {
  const resolvedStyle = getAvatarStyleMeta(value);
  const isStyleFallback = resolvedStyle.slug !== value;

  return {
    requestedSlug: value ?? null,
    resolvedSlug: resolvedStyle.slug,
    isStyleFallback,
    style: resolvedStyle,
  };
};

export const getAvatarModelMeta = (styleSlug, modelSlug) => {
  return resolveAvatarModelMeta(styleSlug, modelSlug).model;
};

export const resolveAvatarModelMeta = (styleSlug, modelSlug) => {
  const styleResolution = resolveAvatarStyleMeta(styleSlug);
  const resolvedModel = styleResolution.style.models.find((model) => model.slug === modelSlug)
    || styleResolution.style.models[0];

  return {
    requestedStyleSlug: styleSlug ?? null,
    requestedModelSlug: modelSlug ?? null,
    resolvedStyleSlug: styleResolution.resolvedSlug,
    resolvedModelSlug: resolvedModel.slug,
    isStyleFallback: styleResolution.isStyleFallback,
    isModelFallback: resolvedModel.slug !== modelSlug,
    style: styleResolution.style,
    model: resolvedModel,
  };
};

export const getAvatarModelOptions = (styleSlug) => {
  const { style } = resolveAvatarStyleMeta(styleSlug);
  const available = [];
  const blocked = [];

  style.models.forEach((model) => {
    const projectedModel = {
      ...model,
      styleSlug: style.slug,
      isLocked: !model.isBase,
    };

    if (model.isBase) {
      available.push(projectedModel);
      return;
    }

    blocked.push(projectedModel);
  });

  return {
    styleSlug: style.slug,
    available,
    blocked,
  };
};
