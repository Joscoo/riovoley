export const PANEL_GUIDE_VERSION = '2026-06-22';

const buildPanelGuideKey = (role) => `riovoley:panel-guide:${role}`;

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const readPanelGuideState = (role) => {
  if (!role || typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(buildPanelGuideKey(role));
  return rawValue ? safeParse(rawValue) : null;
};

const writePanelGuideState = (role, status) => {
  if (!role || typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    buildPanelGuideKey(role),
    JSON.stringify({
      version: PANEL_GUIDE_VERSION,
      status,
      updatedAt: new Date().toISOString(),
    })
  );
};

export const shouldAutoOpenPanelGuide = (role) => {
  const state = readPanelGuideState(role);

  if (!state) {
    return true;
  }

  return state.version !== PANEL_GUIDE_VERSION || !['dismissed', 'completed'].includes(state.status);
};

export const markPanelGuideDismissed = (role) => {
  writePanelGuideState(role, 'dismissed');
};

export const markPanelGuideCompleted = (role) => {
  writePanelGuideState(role, 'completed');
};
