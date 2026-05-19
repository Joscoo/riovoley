export const RENDER_PROFILES = Object.freeze({
  FULL: 'full',
  LITE: 'lite',
  ULTRA_LITE: 'ultraLite',
});

export const PERFORMANCE_MODES = Object.freeze({
  AUTO: 'auto',
  FULL: RENDER_PROFILES.FULL,
  LITE: RENDER_PROFILES.LITE,
  ULTRA_LITE: RENDER_PROFILES.ULTRA_LITE,
});

const SLOW_CONNECTION_TYPES = new Set(['slow-2g', '2g', '3g']);

const isSlowConnection = (effectiveType) =>
  typeof effectiveType === 'string' && SLOW_CONNECTION_TYPES.has(effectiveType.toLowerCase());

const normalizeMode = (mode) =>
  Object.values(PERFORMANCE_MODES).includes(mode) ? mode : PERFORMANCE_MODES.AUTO;

export const resolveRenderProfile = ({
  performanceMode = PERFORMANCE_MODES.AUTO,
  viewportWidth = 1280,
  saveData = false,
  effectiveType = '',
  prefersReducedMotion = false,
} = {}) => {
  const mode = normalizeMode(performanceMode);
  if (mode !== PERFORMANCE_MODES.AUTO) return mode;

  const isDesktop = viewportWidth >= 1024;
  if (isDesktop) return RENDER_PROFILES.FULL;

  if (saveData || prefersReducedMotion || isSlowConnection(effectiveType)) {
    return RENDER_PROFILES.ULTRA_LITE;
  }

  return RENDER_PROFILES.LITE;
};
