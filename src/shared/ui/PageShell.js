import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';
import { PERFORMANCE_MODES, RENDER_PROFILES, useRenderProfile } from './render-profile';

const isKnownProfile = (value) => Object.values(RENDER_PROFILES).includes(value);

const PageShell = ({
  children,
  className,
  contentClassName,
  showVideo = true,
  showOverlay = true,
  performanceMode = PERFORMANCE_MODES.AUTO,
}) => {
  const globalProfile = useRenderProfile();
  const effectiveProfile = useMemo(() => {
    if (performanceMode === PERFORMANCE_MODES.AUTO) return globalProfile;
    return isKnownProfile(performanceMode) ? performanceMode : globalProfile;
  }, [globalProfile, performanceMode]);

  const videoSource = effectiveProfile === RENDER_PROFILES.LITE ? '/videos/bg-video-mobile.mp4' : '/videos/bg-video.mp4';
  const shouldRenderVideo = showVideo && effectiveProfile !== RENDER_PROFILES.ULTRA_LITE;
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    setIsVideoReady(false);
  }, [videoSource, shouldRenderVideo]);

  return (
    <div className={cn('relative min-h-[100dvh] overflow-hidden bg-rv-dark text-white', className)} data-render-profile={effectiveProfile}>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_15%,rgba(30,58,138,0.45),transparent_55%),linear-gradient(140deg,#070707_0%,#0a0a0a_45%,#0f234f_100%)]"
        aria-hidden="true"
      />

      {shouldRenderVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload={effectiveProfile === RENDER_PROFILES.LITE ? 'metadata' : 'auto'}
          poster="/images/logoRio.png"
          className={cn(
            'rv-performance-video pointer-events-none fixed inset-0 z-[1] h-full w-full object-cover saturate-125 transition-opacity duration-300',
            effectiveProfile === RENDER_PROFILES.LITE ? 'brightness-[0.5]' : 'brightness-[0.42] blur-[2px]',
            isVideoReady ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
          data-testid="page-shell-video"
          onCanPlayThrough={() => setIsVideoReady(true)}
          onLoadedData={() => setIsVideoReady(true)}
        >
          <source src={videoSource} type="video/mp4" />
        </video>
      ) : null}

      {showOverlay ? (
        <div
          className="rv-performance-overlay pointer-events-none fixed inset-0 z-[2] bg-[linear-gradient(140deg,rgba(10,10,10,0.96)_0%,rgba(30,58,138,0.38)_52%,rgba(10,10,10,0.96)_100%)]"
          aria-hidden="true"
          data-testid="page-shell-overlay"
        />
      ) : null}

      <div className={cn('relative z-10 w-full', contentClassName)}>{children}</div>
    </div>
  );
};

PageShell.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  showVideo: PropTypes.bool,
  showOverlay: PropTypes.bool,
  performanceMode: PropTypes.oneOf(Object.values(PERFORMANCE_MODES)),
};

export default PageShell;