import { render, screen } from '@testing-library/react';
import PageShell from './PageShell';
import { PERFORMANCE_MODES } from './render-profile';

describe('PageShell', () => {
  test('uses mobile video source in lite mode', () => {
    const { container } = render(
      <PageShell performanceMode={PERFORMANCE_MODES.LITE}>
        <div>contenido</div>
      </PageShell>
    );

    const source = container.querySelector('video source');
    expect(source).toBeInTheDocument();
    expect(source).toHaveAttribute('src', '/videos/bg-video-mobile.mp4');
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
