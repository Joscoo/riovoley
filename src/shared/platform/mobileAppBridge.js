import { App as CapacitorApp } from '@capacitor/app';
import { isNativePlatform } from './runtime';
import { subscribeToPushNotificationActions } from './push';

const deepLinkSubscribers = new Set();
let initialized = false;
let pendingDeepLink = null;

const notifyDeepLink = (payload) => {
  pendingDeepLink = payload;
  deepLinkSubscribers.forEach((subscriber) => subscriber(payload));
};

const normalizeRoute = (url) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const rawPath = parsedUrl.pathname && parsedUrl.pathname !== '/'
      ? parsedUrl.pathname
      : parsedUrl.hostname
        ? `/${parsedUrl.hostname}`
        : '/';
    const pathname = rawPath || '/';
    const route = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return `${route}${parsedUrl.search || ''}${parsedUrl.hash || ''}`;
  } catch (_error) {
    return null;
  }
};

const handleIncomingUrl = (url, source = 'deep-link') => {
  const route = normalizeRoute(url);
  if (!route) return;
  notifyDeepLink({ route, source });
};

export const subscribeToDeepLinks = (subscriber) => {
  deepLinkSubscribers.add(subscriber);
  if (pendingDeepLink) {
    subscriber(pendingDeepLink);
    pendingDeepLink = null;
  }

  return () => deepLinkSubscribers.delete(subscriber);
};

export const initializeMobileAppBridge = async () => {
  if (!isNativePlatform() || initialized) return;

  initialized = true;

  const launchUrl = await CapacitorApp.getLaunchUrl();
  if (launchUrl?.url) {
    handleIncomingUrl(launchUrl.url, 'launch-url');
  }

  CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    handleIncomingUrl(url, 'app-url-open');
  });

  subscribeToPushNotificationActions((notification) => {
    if (!notification?.route) return;
    notifyDeepLink({
      route: notification.route,
      source: notification.source || 'push',
      notification,
    });
  });
};
