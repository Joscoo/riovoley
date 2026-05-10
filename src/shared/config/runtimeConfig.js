const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

export const runtimeConfig = {
  appBaseUrl: (() => {
    const configured = process.env.REACT_APP_APP_URL?.trim();
    if (configured) return trimTrailingSlash(configured);
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location?.origin) {
      return trimTrailingSlash(window.location.origin);
    }
    return 'https://riovoley.com';
  })(),
};
