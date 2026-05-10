import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/cn';

const PageShell = ({ children, className, contentClassName, showVideo = true, showOverlay = true }) => {
  return (
    <div className={cn('relative min-h-[100dvh] overflow-hidden bg-rv-dark text-white', className)}>
      {showVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none fixed inset-0 h-full w-full object-cover brightness-[0.42] blur-[2px] saturate-125"
          aria-hidden="true"
        >
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
      )}

      {showOverlay && (
        <div
          className="pointer-events-none fixed inset-0 bg-[linear-gradient(140deg,rgba(10,10,10,0.96)_0%,rgba(30,58,138,0.38)_52%,rgba(10,10,10,0.96)_100%)]"
          aria-hidden="true"
        />
      )}

      <div className={cn('relative z-10 w-full', contentClassName)}>{children}</div>
    </div>
  );
};

PageShell.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  showVideo: PropTypes.bool,
  showOverlay: PropTypes.bool
};

export default PageShell;
