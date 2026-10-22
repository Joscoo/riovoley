import { render, screen } from '@testing-library/react';
import IdentityPortrait from './IdentityPortrait';

describe('IdentityPortrait', () => {
  it('mantiene el fondo visible alrededor de una foto opaca', () => {
    render(<IdentityPortrait imageUrl="https://example.com/photo.jpg" equippedItems={{ background: {
      slug: 'background_night', metadata: { backgroundVariant: 'night-carbon' },
    } }} />);
    expect(screen.getByTestId('portrait-background-layer')).toHaveAttribute('data-visual-variant', 'night-carbon');
    expect(screen.getByRole('img')).toHaveClass('p-1.5');
  });

  it('renderiza el marco personalizado como una capa transparente sobre la foto', () => {
    render(<IdentityPortrait imageUrl="https://example.com/photo.jpg" equippedItems={{ frame: {
      slug: 'custom', category: 'custom_frame', metadata: { imageUrl: 'https://example.com/frame.png' },
    } }} />);
    expect(screen.getByTestId('portrait-custom-frame')).toHaveAttribute('src', 'https://example.com/frame.png');
  });
  it('stays visually neutral when no cosmetics are equipped', () => {
    render(
      <IdentityPortrait
        imageUrl="https://example.com/profile.png"
        displayName="Lia"
        equippedItems={{}}
        equipment={{}}
      />
    );

    expect(screen.getByTestId('portrait-frame-shell')).toHaveAttribute('data-visual-variant', 'none');
    expect(screen.getByTestId('portrait-effect-shell')).toHaveAttribute('data-visual-variant', 'none');
    expect(screen.queryByTestId('legendary-effect-front')).not.toBeInTheDocument();
  });

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
