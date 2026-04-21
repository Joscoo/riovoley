const sanitizeBaseUrl = (value) => value.replace(/\/+$/, '');

export const getAppBaseUrl = () => {
  const configuredUrl = process.env.REACT_APP_APP_URL?.trim();
  if (configuredUrl) {
    return sanitizeBaseUrl(configuredUrl);
  }

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location?.origin) {
    return sanitizeBaseUrl(window.location.origin);
  }

  return 'https://riovoley.com';
};

export const APP_BASE_URL = getAppBaseUrl();
export const APP_LOGIN_URL = `${APP_BASE_URL}/login`;
export const APP_RESET_PASSWORD_URL = `${APP_BASE_URL}/reset-password`;
