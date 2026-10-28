import { render, screen } from '@testing-library/react';
import PageShell from './PageShell';
import { PERFORMANCE_MODES } from './render-profile';

describe('PageShell', () => {
  test('uses a lightweight static background on mobile without downloading video', () => {
    const { container } = render(
      <PageShell performanceMode={PERFORMANCE_MODES.LITE}>
        <div>contenido</div>
      </PageShell>
    );

    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('src', '/images/court-poster.webp');
    expect(screen.getByRole('main')).toContainElement(screen.getByText('contenido'));
  });

  test('does not render video in ultraLite mode', () => {
    const { container } = render(
      <PageShell performanceMode={PERFORMANCE_MODES.ULTRA_LITE}>
        <div>contenido</div>
      </PageShell>
    );

    expect(container.querySelector('video')).not.toBeInTheDocument();
  });

  test('keeps overlay when enabled', () => {
    render(
      <PageShell performanceMode={PERFORMANCE_MODES.LITE} showOverlay>
        <div>contenido</div>
      </PageShell>
    );

    expect(screen.getByTestId('page-shell-overlay')).toBeInTheDocument();
  });
});
