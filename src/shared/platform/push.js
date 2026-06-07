import { App as CapacitorApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { isAndroidPlatform, isNativePlatform } from './runtime';

const registrationSubscribers = new Set();
const notificationActionSubscribers = new Set();
const foregroundNotificationSubscribers = new Set();

const NOTIFICATION_CHANNELS = {
  announcements: {
    id: 'announcements',
    name: 'Anuncios',
    description: 'Comunicados y novedades del club',
    importance: 4,
    visibility: 1,
    lights: true,
    lightColor: '#F9B233',
    vibration: true,
  },
  payments: {
    id: 'payments',
    name: 'Pagos',
    description: 'Recordatorios de mensualidad y pagos pendientes',
    importance: 5,
    visibility: 1,
    lights: true,
    lightColor: '#355FB3',
    vibration: true,
  },
  progress: {
    id: 'progress',
    name: 'Progreso',
    description: 'Avisos de retos, niveles y logros del estudiante',
    importance: 4,
    visibility: 1,
    lights: true,
    lightColor: '#F59E0B',
    vibration: true,
  },
};

let listenersRegistered = false;
let latestToken = null;
let currentPermission = 'prompt';
let activeUserId = null;
let currentAppIsActive = true;

const notifyRegistration = (token) => {
  latestToken = token;
  registrationSubscribers.forEach((subscriber) => subscriber(token));
};

const notifyNotificationAction = (notification) => {
  notificationActionSubscribers.forEach((subscriber) => subscriber(notification));
};

const notifyForegroundNotification = (notification) => {
  foregroundNotificationSubscribers.forEach((subscriber) => subscriber(notification));
};

const buildRoleRoute = (role, section) => {
  const normalizedRole = String(role || '').toLowerCase();
  if (normalizedRole === 'administrador') return `/admin?section=${section}`;
  if (normalizedRole === 'entrenador') return `/entrenador?section=${section}`;
  return `/estudiante?section=${section}`;
};

const resolveRoleFromNotification = (notificationData = {}) => {
  const candidates = [
    notificationData.user_role,
    notificationData.target_role,
    notificationData.role,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim()) || 'estudiante';
};

const resolveChannelForNotification = (notificationData = {}) => {
  if (notificationData.channel_id && NOTIFICATION_CHANNELS[notificationData.channel_id]) {
    return notificationData.channel_id;
  }

  if (notificationData.type === 'payment_reminder') return 'payments';
  if (notificationData.type === 'gamification_progress' || notificationData.type === 'achievement_unlocked') return 'progress';
  return 'announcements';
};

export const resolveNotificationRoute = (notificationData = {}) => {
  if (notificationData.route) return notificationData.route;

  const resolvedRole = resolveRoleFromNotification(notificationData);

  switch (notificationData.type) {
    case 'announcement':
      return buildRoleRoute(resolvedRole, 'anuncios');
    case 'payment_reminder':
      return buildRoleRoute(resolvedRole, resolvedRole === 'estudiante' ? 'mensualidad' : 'pagos');
    case 'gamification_progress':
    case 'achievement_unlocked':
      return buildRoleRoute(resolvedRole, 'progreso');
    default:
      return '/';
  }
};

const enrichNotification = (notification = {}, source) => {
  const data = notification.data || {};

  return {
    ...notification,
    data,
    channelId: resolveChannelForNotification(data),
    route: resolveNotificationRoute(data),
    source,
  };
};

const syncAppStateListeners = () => {
  CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    currentAppIsActive = Boolean(isActive);
  });

  CapacitorApp.getState()
    .then(({ isActive }) => {
      currentAppIsActive = Boolean(isActive);
    })
    .catch(() => {
      currentAppIsActive = true;
    });
};

const ensureAndroidNotificationChannels = async () => {
  if (!isAndroidPlatform()) return;

  await Promise.all(
    Object.values(NOTIFICATION_CHANNELS).map((channel) => PushNotifications.createChannel(channel)),
  );
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
    const enrichedNotification = enrichNotification(notification, 'received');
    if (currentAppIsActive) {
      notifyForegroundNotification(enrichedNotification);
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    notifyNotificationAction(enrichNotification(action.notification || {}, 'action'));
  });

  syncAppStateListeners();
  listenersRegistered = true;
};

export const initializePushForAuthenticatedUser = async (user) => {
  if (!isNativePlatform() || !user?.id) {
    return {
      permission: 'unsupported',
      token: null,
    };
  }

  activeUserId = user.id;
  ensurePushListeners();
  await ensureAndroidNotificationChannels();

  const permissionStatus = await PushNotifications.requestPermissions();
  currentPermission = permissionStatus.receive;

  if (permissionStatus.receive !== 'granted') {
    return {
      permission: permissionStatus.receive,
      token: null,
    };
  }

  await PushNotifications.register();

  return {
    permission: permissionStatus.receive,
    token: latestToken,
  };
};

export const teardownPushForAuthenticatedUser = async () => {
  activeUserId = null;

  if (!isNativePlatform()) return;

  try {
    await PushNotifications.unregister();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error unregistering push notifications:', error);
  }

  latestToken = null;
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

export const subscribeToForegroundPushNotifications = (subscriber) => {
  foregroundNotificationSubscribers.add(subscriber);
  return () => foregroundNotificationSubscribers.delete(subscriber);
};

export const getPushNotificationState = () => ({
  activeUserId,
  currentPermission,
  token: latestToken,
});

export const clearPushNotificationToken = () => {
  latestToken = null;
};
