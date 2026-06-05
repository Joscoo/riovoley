import {
  buildNativeUrl,
  buildPublicUrl,
  getPublicAppBaseUrl,
  getRuntimeAppBaseUrl,
  isNativePlatform,
} from '../shared/platform';

export const APP_BASE_URL = getPublicAppBaseUrl();
export const APP_LOGIN_URL = buildPublicUrl('/login');
export const APP_RESET_PASSWORD_URL = buildPublicUrl('/reset-password');
export const RUNTIME_APP_BASE_URL = getRuntimeAppBaseUrl();
export const AUTH_RESET_PASSWORD_REDIRECT_URL = isNativePlatform()
  ? buildNativeUrl('/reset-password')
  : APP_RESET_PASSWORD_URL;
