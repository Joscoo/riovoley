import { App as CapacitorApp } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { isAndroidPlatform, isNativePlatform } from './runtime';

const otaSubscribers = new Set();
const OTA_CHANNEL_OVERRIDE = process.env.REACT_APP_CAPGO_DEFAULT_CHANNEL?.trim() || '';
const OTA_CHANNEL = OTA_CHANNEL_OVERRIDE || 'production';

const normalizeOtaErrorMessage = (error, fallbackMessage) => {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') return error;

  const baseMessage = error.message || error.error || fallbackMessage;
  const errorCode = typeof error.error === 'string' ? error.error.trim() : '';
  const statusCode = Number.isFinite(Number(error.statusCode)) ? Number(error.statusCode) : null;

  const suffix = [
    errorCode ? `codigo: ${errorCode}` : null,
    statusCode ? `HTTP ${statusCode}` : null,
  ].filter(Boolean).join(' | ');

  return suffix ? `${baseMessage} (${suffix})` : baseMessage;
};

const defaultState = {
  supported: false,
  initialized: false,
  status: 'idle',
  progress: 0,
  error: null,
  nativeVersion: null,
  nativeBuild: null,
  otaBundleVersion: null,
  otaBundleId: null,
  builtinVersion: null,
  pluginVersion: null,
  deviceId: null,
  appId: null,
  currentChannel: OTA_CHANNEL,
  otaChannel: OTA_CHANNEL,
  availableUpdate: null,
  downloadedBundle: null,
  lastFailure: null,
  lastCheckResult: null,
};

let otaState = { ...defaultState };
let otaListenersRegistered = false;

const isOtaSupported = () => isNativePlatform() && isAndroidPlatform();

const emitOtaState = () => {
  const snapshot = { ...otaState };
  otaSubscribers.forEach((subscriber) => subscriber(snapshot));
};

const setOtaState = (partialState) => {
  otaState = {
    ...otaState,
    ...partialState,
  };
  emitOtaState();
};

const readCurrentBundleMetadata = async () => {
  if (!isOtaSupported()) {
    setOtaState({
      supported: false,
      initialized: true,
    });
    return otaState;
  }

  const [{ version, build }, currentBundle, builtinVersion, deviceId, pluginVersion, failedUpdate, appId, channelInfo] = await Promise.all([
    CapacitorApp.getInfo(),
    CapacitorUpdater.current(),
    CapacitorUpdater.getBuiltinVersion(),
    CapacitorUpdater.getDeviceId(),
    CapacitorUpdater.getPluginVersion(),
    CapacitorUpdater.getFailedUpdate(),
    CapacitorUpdater.getAppId(),
    CapacitorUpdater.getChannel().catch(() => null),
  ]);

  setOtaState({
    supported: true,
    initialized: true,
    nativeVersion: version,
    nativeBuild: build,
    otaBundleVersion: currentBundle?.bundle?.version || null,
    otaBundleId: currentBundle?.bundle?.id || null,
    builtinVersion: builtinVersion?.version || null,
    pluginVersion: pluginVersion?.version || null,
    deviceId: deviceId?.deviceId || null,
    appId: appId?.appId || null,
    currentChannel: channelInfo?.channel || OTA_CHANNEL,
    lastFailure: failedUpdate || null,
  });

  return otaState;
};

const registerOtaListeners = async () => {
  if (!isOtaSupported() || otaListenersRegistered) return;

  await CapacitorUpdater.addListener('download', (info) => {
    setOtaState({
      status: 'downloading',
      progress: Number(info?.percent || 0),
    });
  });

  await CapacitorUpdater.addListener('downloadComplete', (event) => {
    setOtaState({
      status: 'ready_to_apply',
      progress: 100,
      downloadedBundle: event.bundle,
      otaBundleVersion: event.bundle?.version || otaState.otaBundleVersion,
      error: null,
    });
  });

  await CapacitorUpdater.addListener('downloadFailed', (event) => {
    setOtaState({
      status: 'failed',
      error: normalizeOtaErrorMessage(event, 'No se pudo descargar la actualizacion.'),
      lastFailure: event,
    });
  });

  await CapacitorUpdater.addListener('updateFailed', (event) => {
    setOtaState({
      status: 'failed',
      error: normalizeOtaErrorMessage(event, 'La actualizacion descargada no se pudo aplicar.'),
      lastFailure: event,
    });
  });

  await CapacitorUpdater.addListener('updateCheckResult', (event) => {
    const normalizedKind = event?.kind || 'failed';
    const nextState = {
      lastCheckResult: event || null,
      currentChannel: otaState.currentChannel || OTA_CHANNEL,
    };

    if (normalizedKind === 'up_to_date') {
      setOtaState({
        ...nextState,
        status: 'idle',
        error: null,
        availableUpdate: null,
      });
      return;
    }

    if (normalizedKind === 'blocked') {
      setOtaState({
        ...nextState,
        status: 'blocked',
        error: normalizeOtaErrorMessage(event, 'La busqueda de actualizaciones OTA fue bloqueada.'),
        availableUpdate: null,
      });
      return;
    }

    if (normalizedKind === 'failed') {
      setOtaState({
        ...nextState,
        status: 'failed',
        error: normalizeOtaErrorMessage(event, 'No se pudo verificar la actualizacion OTA.'),
        availableUpdate: null,
      });
    }
  });

  otaListenersRegistered = true;
};

export const initializeOtaUpdates = async () => {
  if (!isOtaSupported()) {
    setOtaState({
      supported: false,
      initialized: true,
    });
    return otaState;
  }

  await registerOtaListeners();
  return readCurrentBundleMetadata();
};

export const subscribeToOtaState = (subscriber) => {
  otaSubscribers.add(subscriber);
  subscriber({ ...otaState });

  return () => otaSubscribers.delete(subscriber);
};

export const notifyOtaAppReady = async () => {
  if (!isOtaSupported()) return null;

  const result = await CapacitorUpdater.notifyAppReady();
  setOtaState({
    otaBundleVersion: result?.bundle?.version || otaState.otaBundleVersion,
    otaBundleId: result?.bundle?.id || otaState.otaBundleId,
  });
  return result;
};

export const checkForAppUpdate = async () => {
  if (!isOtaSupported()) {
    return { available: false, reason: 'unsupported' };
  }

  setOtaState({
    status: 'checking',
    error: null,
    progress: 0,
  });

  const options = {
    includeBundleSize: true,
    ...(OTA_CHANNEL_OVERRIDE ? { channel: OTA_CHANNEL_OVERRIDE } : {}),
  };

  const latest = await CapacitorUpdater.getLatest(options);
  const kind = latest?.kind || null;

  if (kind === 'failed') {
    const normalizedError = normalizeOtaErrorMessage(latest, 'No se pudo verificar la actualizacion OTA.');
    setOtaState({
      status: 'failed',
      error: normalizedError,
      availableUpdate: null,
      lastCheckResult: latest,
    });
    throw new Error(normalizedError);
  }

  if (kind === 'blocked') {
    setOtaState({
      status: 'blocked',
      error: normalizeOtaErrorMessage(latest, 'La busqueda de actualizaciones OTA fue bloqueada.'),
      availableUpdate: null,
      lastCheckResult: latest,
    });
    return { available: false, blocked: true, latest };
  }

  if (!latest?.url || kind === 'up_to_date') {
    setOtaState({
      status: 'idle',
      error: null,
      availableUpdate: null,
      lastCheckResult: latest,
    });
    return { available: false, latest };
  }

  setOtaState({
    status: 'available',
    error: null,
    availableUpdate: latest,
    lastCheckResult: latest,
  });

  return { available: true, latest };
};

export const downloadAppUpdate = async () => {
  if (!isOtaSupported()) {
    return null;
  }

  const targetUpdate = otaState.availableUpdate;
  if (!targetUpdate?.url || !targetUpdate?.version) {
    throw new Error('No hay una actualizacion OTA disponible para descargar.');
  }

  setOtaState({
    status: 'downloading',
    error: null,
    progress: 0,
  });

  const bundle = await CapacitorUpdater.download({
    url: targetUpdate.url,
    version: targetUpdate.version,
    checksum: targetUpdate.checksum,
    sessionKey: targetUpdate.sessionKey,
    manifest: targetUpdate.manifest,
  });

  setOtaState({
    status: 'ready_to_apply',
    progress: 100,
    downloadedBundle: bundle,
  });

  return bundle;
};

export const applyAppUpdate = async () => {
  if (!isOtaSupported()) return null;

  const targetBundle = otaState.downloadedBundle;
  if (!targetBundle?.id) {
    throw new Error('No hay un bundle OTA descargado para aplicar.');
  }

  setOtaState({
    status: 'applying',
    error: null,
  });

  await CapacitorUpdater.set({
    id: targetBundle.id,
  });

  return targetBundle;
};

export const getOtaState = () => ({ ...otaState });

export const getOtaDeviceMetadata = async () => {
  const state = otaState.initialized ? otaState : await initializeOtaUpdates();

  return {
    deviceId: state.deviceId,
    appId: state.appId,
    currentChannel: state.currentChannel,
    otaChannel: state.otaChannel,
    nativeVersion: state.nativeVersion,
    nativeBuild: state.nativeBuild,
    otaBundleVersion: state.otaBundleVersion,
    otaBundleId: state.otaBundleId,
    builtinVersion: state.builtinVersion,
    updaterPluginVersion: state.pluginVersion,
  };
};
