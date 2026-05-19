import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { PERFORMANCE_MODES, RENDER_PROFILES, resolveRenderProfile } from './renderProfileResolver';

const RenderProfileContext = createContext(RENDER_PROFILES.FULL);

const buildSnapshot = () => {
  if (typeof window === 'undefined') {
    return {
      viewportWidth: 1280,
      saveData: false,
      effectiveType: '',
      prefersReducedMotion: false,
    };
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  return {
    viewportWidth: window.innerWidth || 1280,
    saveData: Boolean(connection?.saveData),
    effectiveType: connection?.effectiveType || '',
    prefersReducedMotion: Boolean(mediaQuery?.matches),
  };
};

const computeProfile = (performanceMode) =>
  resolveRenderProfile({
    performanceMode,
    ...buildSnapshot(),
  });

export const RenderProfileProvider = ({ children, performanceMode = PERFORMANCE_MODES.AUTO }) => {
  const [profile, setProfile] = useState(() => computeProfile(performanceMode));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const recompute = () => setProfile(computeProfile(performanceMode));
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    window.addEventListener('resize', recompute);
    connection?.addEventListener?.('change', recompute);
    mediaQuery?.addEventListener?.('change', recompute);
    recompute();

    return () => {
      window.removeEventListener('resize', recompute);
      connection?.removeEventListener?.('change', recompute);
      mediaQuery?.removeEventListener?.('change', recompute);
    };
  }, [performanceMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.renderProfile = profile;
    document.body.dataset.renderProfile = profile;
  }, [profile]);

  const value = useMemo(() => profile, [profile]);
  return <RenderProfileContext.Provider value={value}>{children}</RenderProfileContext.Provider>;
};

RenderProfileProvider.propTypes = {
  children: PropTypes.node.isRequired,
  performanceMode: PropTypes.oneOf(Object.values(PERFORMANCE_MODES)),
};

export const useRenderProfile = () => useContext(RenderProfileContext);
