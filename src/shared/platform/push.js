import { PushNotifications } from '@capacitor/push-notifications';
import { isNativePlatform } from './runtime';

const registrationSubscribers = new Set();
const notificationActionSubscribers = new Set();
let listenersRegistered = false;
let latestToken = null;

const notifyRegistration = (token) => {
  latestToken = token;
  registrationSubscribers.forEach((subscriber) => subscriber(token));
};

const notifyNotificationAction = (notification) => {
  notificationActionSubscribers.forEach((subscriber) => subscriber(notification));
};

export const resolveNotificationRoute = (notificationData = {}) => {
  if (notificationData.route) return notificationData.route;

  switch (notificationData.type) {
    case 'announcement':
      return '/';
    case 'payment_reminder':
      return '/estudiante?section=mensualidad';
    default:
      return '/';
  }
};

const ensurePushListeners = () => {
  if (!isNativePlatform() || listenersRegistered) return;

  PushNotifications.addListener('registration', (token) => {
    notifyRegistration(token.value);
  });

  PushNotifications.addListener('registrationError', (error) => {
    // eslint-disable-next-line no-console
    console.error('Push registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    notifyNotificationAction({
      ...notification,
      route: resolveNotificationRoute(notification.data || {}),
      source: 'received',
    });
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const notification = action.notification || {};
    notifyNotificationAction({
      ...notification,
      route: resolveNotificationRoute(notification.data || {}),
      source: 'action',
    });
  });

  listenersRegistered = true;
};

export const registerForPushNotifications = async () => {
  if (!isNativePlatform()) return null;

  ensurePushListeners();

  const permissionStatus = await PushNotifications.requestPermissions();
  if (permissionStatus.receive !== 'granted') {
    return null;
  }

  await PushNotifications.register();
  return latestToken;
};

export const subscribeToPushRegistration = (subscriber) => {
  registrationSubscribers.add(subscriber);
  if (latestToken) {
    subscriber(latestToken);
  }

  return () => registrationSubscribers.delete(subscriber);
};

export const subscribeToPushNotificationActions = (subscriber) => {
  notificationActionSubscribers.add(subscriber);
  return () => notificationActionSubscribers.delete(subscriber);
};

export const clearPushNotificationToken = () => {
  latestToken = null;
};
