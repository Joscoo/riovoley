export const AVATAR_STYLE_OPTIONS = [
  {
    slug: 'adventurer-neutral',
    name: 'Aventurero',
    description: 'Avatar ilustrado con rasgos expresivos y tono amigable.',
  },
  {
    slug: 'lorelei-neutral',
    name: 'Lorelei',
    description: 'Estilo limpio con mas variacion visual en el rostro.',
  },
  {
    slug: 'thumbs',
    name: 'Thumbs',
    description: 'Personaje simple, dinamico y muy claro en tamaños pequenos.',
  },
  {
    slug: 'pixel-art-neutral',
    name: 'Pixel',
    description: 'Estilo retro para perfiles con presencia mas gamer.',
  },
];

export const DEFAULT_AVATAR_STYLE = AVATAR_STYLE_OPTIONS[0].slug;

export const isValidAvatarStyle = (value) =>
  AVATAR_STYLE_OPTIONS.some((option) => option.slug === value);

export const getAvatarStyleMeta = (value) =>
  AVATAR_STYLE_OPTIONS.find((option) => option.slug === value) || AVATAR_STYLE_OPTIONS[0];
