import { PERFORMANCE_MODES, RENDER_PROFILES, resolveRenderProfile } from './renderProfileResolver';

describe('resolveRenderProfile', () => {
  test('respects explicit full mode', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.FULL,
        viewportWidth: 390,
        saveData: true,
      })
    ).toBe(RENDER_PROFILES.FULL);
  });

  test('respects explicit ultraLite mode', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.ULTRA_LITE,
        viewportWidth: 390,
      })
    ).toBe(RENDER_PROFILES.ULTRA_LITE);
  });

  test('honors data saving on desktop as well as mobile', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.AUTO,
        viewportWidth: 1280,
        saveData: true,
        effectiveType: '2g',
      })
    ).toBe(RENDER_PROFILES.ULTRA_LITE);
  });

  test('honors reduced motion on desktop', () => {
    expect(resolveRenderProfile({ viewportWidth: 1440, prefersReducedMotion: true }))
      .toBe(RENDER_PROFILES.ULTRA_LITE);
  });

  test('uses full rendering on desktop without data or motion restrictions', () => {
    expect(resolveRenderProfile({ viewportWidth: 1440 })).toBe(RENDER_PROFILES.FULL);
  });

  test('returns lite on mobile with stable network', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.AUTO,
        viewportWidth: 430,
        saveData: false,
        effectiveType: '4g',
      })
    ).toBe(RENDER_PROFILES.LITE);
  });

  test('returns ultraLite when saveData is enabled', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.AUTO,
        viewportWidth: 390,
        saveData: true,
        effectiveType: '4g',
      })
    ).toBe(RENDER_PROFILES.ULTRA_LITE);
  });

  test('returns ultraLite on slow effectiveType', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.AUTO,
        viewportWidth: 390,
        saveData: false,
        effectiveType: '3g',
      })
    ).toBe(RENDER_PROFILES.ULTRA_LITE);
  });

  test('returns ultraLite when reduced motion is requested', () => {
    expect(
      resolveRenderProfile({
        performanceMode: PERFORMANCE_MODES.AUTO,
        viewportWidth: 390,
        saveData: false,
        effectiveType: '4g',
        prefersReducedMotion: true,
      })
    ).toBe(RENDER_PROFILES.ULTRA_LITE);
  });
});
