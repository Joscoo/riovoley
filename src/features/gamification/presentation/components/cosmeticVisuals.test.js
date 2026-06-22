import {
  normalizeCosmeticItem,
  resolveFrameVisual,
  resolveBackgroundVisual,
  resolveBadgeVisual,
  resolveEffectVisual,
} from './cosmeticVisuals';

describe('cosmeticVisuals', () => {
  it('resolves sober visuals for common and rare cosmetics from metadata', () => {
    const item = normalizeCosmeticItem({
      slug: 'frame_club_satin',
      rarity: 'common',
      metadata: {
        accent: 'pearl',
        frameVariant: 'studio',
      },
    });

    const result = resolveFrameVisual(item);

    expect(result.intensity).toBe('sober');
    expect(result.variant).toBe('studio');
    expect(result.classes).toContain('linear-gradient');
  });

  it('resolves strong silhouette visuals for epic and legendary cosmetics', () => {
    const item = normalizeCosmeticItem({
      slug: 'effect_crown_voltage',
      rarity: 'legendary',
      metadata: {
        glow: 'gold',
        effectVariant: 'crown-burst',
      },
    });

    const result = resolveEffectVisual(item);

    expect(result.intensity).toBe('strong');
    expect(result.variant).toBe('crown-burst');
    expect(result.glowKey).toBe('gold');
    expect(result.classes).toContain('before:bg-amber-300/30');
    expect(result.layers.front.length).toBeGreaterThan(0);
  });

  it('does not collapse different badge variants into the same visual payload', () => {
    const club = resolveBadgeVisual(normalizeCosmeticItem({
      slug: 'badge_sello_club',
      rarity: 'common',
      metadata: { icon: 'shield', badgeVariant: 'club-seal' },
    }));

    const podium = resolveBadgeVisual(normalizeCosmeticItem({
      slug: 'badge_corona_podio',
      rarity: 'epic',
      metadata: { icon: 'medal', badgeVariant: 'crown-podium' },
    }));

    expect(club.variant).toBe('club-seal');
    expect(podium.variant).toBe('crown-podium');
    expect(club.classes).not.toEqual(podium.classes);
    expect(club.shortLabel).not.toEqual(podium.shortLabel);
  });

  it('resolves background variants independently from frame variants', () => {
    const background = resolveBackgroundVisual(normalizeCosmeticItem({
      slug: 'background_studio_luz',
      rarity: 'rare',
      metadata: { palette: 'studio', backgroundVariant: 'portrait' },
    }));

    expect(background.intensity).toBe('sober');
    expect(background.variant).toBe('portrait');
    expect(background.classes).toContain('radial-gradient');
  });
});
