import { Capacitor } from '@capacitor/core';

export const MOBILE_APP_SCHEME = 'riovoley';
export const PUBLIC_APP_ORIGIN_FALLBACK = 'https://riovoley.com';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const trimLeadingSlash = (value = '') => value.replace(/^\/+/, '');

export const getPlatform = () => Capacitor.getPlatform();

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const isAndroidPlatform = () => getPlatform() === 'android';

export const isWebPlatform = () => !isNativePlatform();

export const getPublicAppBaseUrl = () => {
  const configuredUrl = process.env.REACT_APP_APP_URL?.trim();
  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return PUBLIC_APP_ORIGIN_FALLBACK;
};

export const buildNativeUrl = (path = '/') => {
  const normalizedPath = trimLeadingSlash(path || '/');
  return normalizedPath ? `${MOBILE_APP_SCHEME}://${normalizedPath}` : `${MOBILE_APP_SCHEME}://`;
};

export const buildPublicUrl = (path = '/') => {
  const baseUrl = getPublicAppBaseUrl();
  const normalizedPath = trimLeadingSlash(path || '/');
  return normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
};

export const getRuntimeAppBaseUrl = () => (
  isNativePlatform()
    ? buildNativeUrl('/')
    : getPublicAppBaseUrl()
);
