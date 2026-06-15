import { render, screen } from '@testing-library/react';
import IdentityPortrait from './IdentityPortrait';

describe('IdentityPortrait', () => {
  it('renders sober common cosmetics without strong overlays', () => {
    render(
      <IdentityPortrait
        imageUrl="https://example.com/profile.png"
        displayName="Lia"
        equippedItems={{
          frame: {
            slug: 'frame_perla_estudio',
            rarity: 'common',
            metadata: { accent: 'pearl', frameVariant: 'studio' },
          },
        }}
      />
    );

    expect(screen.getByTestId('portrait-frame-shell')).toHaveAttribute('data-visual-variant', 'studio');
    expect(screen.queryByTestId('legendary-effect-front')).not.toBeInTheDocument();
  });

  it('renders strong front layers for legendary effects', () => {
    render(
      <IdentityPortrait
        imageUrl="https://example.com/profile.png"
        displayName="Nora"
        equippedItems={{
          effect: {
            slug: 'effect_crown_voltage',
            rarity: 'legendary',
            metadata: { glow: 'gold', effectVariant: 'crown-burst' },
          },
        }}
      />
    );

    expect(screen.getByTestId('legendary-effect-front')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-effect-shell')).toHaveAttribute('data-visual-variant', 'crown-burst');
  });
});
