jest.mock('@capacitor/app', () => ({
  App: {
    getInfo: jest.fn(),
  },
}));

jest.mock('@capgo/capacitor-updater', () => ({
  CapacitorUpdater: {
    addListener: jest.fn().mockResolvedValue({ remove: jest.fn() }),
    current: jest.fn(),
    download: jest.fn(),
    getBuiltinVersion: jest.fn(),
    getDeviceId: jest.fn(),
    getPluginVersion: jest.fn(),
    getFailedUpdate: jest.fn(),
    getAppId: jest.fn(),
    getChannel: jest.fn(),
    getLatest: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('./runtime', () => ({
  isAndroidPlatform: jest.fn(() => true),
  isNativePlatform: jest.fn(() => true),
}));

describe('ota platform bridge', () => {
  const loadOtaModule = () => {
    const ota = require('./ota');
    const { App } = require('@capacitor/app');
    const { CapacitorUpdater } = require('@capgo/capacitor-updater');

    return { ota, App, CapacitorUpdater };
  };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.REACT_APP_CAPGO_DEFAULT_CHANNEL;
  });

  it('no envia channel explicito cuando solo usa el canal por defecto', async () => {
    const { ota, App, CapacitorUpdater } = loadOtaModule();
    App.getInfo.mockResolvedValue({ version: '1.0.0', build: '100' });
    CapacitorUpdater.current.mockResolvedValue({ bundle: { version: '1.0.0', id: 'builtin' } });
    CapacitorUpdater.getBuiltinVersion.mockResolvedValue({ version: '1.0.0' });
    CapacitorUpdater.getDeviceId.mockResolvedValue({ deviceId: 'device-1' });
    CapacitorUpdater.getPluginVersion.mockResolvedValue({ version: '8.47.9' });
    CapacitorUpdater.getFailedUpdate.mockResolvedValue(null);
    CapacitorUpdater.getAppId.mockResolvedValue({ appId: 'com.riovoley.app' });
    CapacitorUpdater.getChannel.mockResolvedValue({ channel: 'production' });
    CapacitorUpdater.getLatest.mockResolvedValue({
      kind: 'up_to_date',
      message: 'No new version available',
      version: '1.0.0',
    });

    await ota.initializeOtaUpdates();
    await ota.checkForAppUpdate();

    expect(CapacitorUpdater.getLatest).toHaveBeenCalledWith({
      includeBundleSize: true,
    });
  });

  it('marca el estado como blocked cuando Capgo bloquea el check', async () => {
    const { ota, App, CapacitorUpdater } = loadOtaModule();
    App.getInfo.mockResolvedValue({ version: '1.0.0', build: '100' });
    CapacitorUpdater.current.mockResolvedValue({ bundle: { version: '1.0.0', id: 'builtin' } });
    CapacitorUpdater.getBuiltinVersion.mockResolvedValue({ version: '1.0.0' });
    CapacitorUpdater.getDeviceId.mockResolvedValue({ deviceId: 'device-1' });
    CapacitorUpdater.getPluginVersion.mockResolvedValue({ version: '8.47.9' });
    CapacitorUpdater.getFailedUpdate.mockResolvedValue(null);
    CapacitorUpdater.getAppId.mockResolvedValue({ appId: 'com.riovoley.app' });
    CapacitorUpdater.getChannel.mockResolvedValue({ channel: 'production' });
    CapacitorUpdater.getLatest.mockResolvedValue({
      kind: 'blocked',
      error: 'channel_not_found',
      message: 'Canal no disponible para este dispositivo',
      statusCode: 400,
      version: '1.0.0',
    });

    await ota.initializeOtaUpdates();
    const result = await ota.checkForAppUpdate();

    expect(result).toEqual(
      expect.objectContaining({
        available: false,
        blocked: true,
      }),
    );
    expect(ota.getOtaState()).toEqual(
      expect.objectContaining({
        status: 'blocked',
        error: expect.stringContaining('channel_not_found'),
      }),
    );
  });

  it('lanza error cuando el backend responde failed', async () => {
    const { ota, App, CapacitorUpdater } = loadOtaModule();
    App.getInfo.mockResolvedValue({ version: '1.0.0', build: '100' });
    CapacitorUpdater.current.mockResolvedValue({ bundle: { version: '1.0.0', id: 'builtin' } });
    CapacitorUpdater.getBuiltinVersion.mockResolvedValue({ version: '1.0.0' });
    CapacitorUpdater.getDeviceId.mockResolvedValue({ deviceId: 'device-1' });
    CapacitorUpdater.getPluginVersion.mockResolvedValue({ version: '8.47.9' });
    CapacitorUpdater.getFailedUpdate.mockResolvedValue(null);
    CapacitorUpdater.getAppId.mockResolvedValue({ appId: 'com.riovoley.app' });
    CapacitorUpdater.getChannel.mockResolvedValue({ channel: 'production' });
    CapacitorUpdater.getLatest.mockResolvedValue({
      kind: 'failed',
      error: 'on_premise_app',
      message: 'La app no puede consultar este endpoint OTA',
      statusCode: 400,
      version: '1.0.0',
    });

    await ota.initializeOtaUpdates();

    await expect(ota.checkForAppUpdate()).rejects.toThrow(
      'La app no puede consultar este endpoint OTA (codigo: on_premise_app | HTTP 400)',
    );
    expect(ota.getOtaState()).toEqual(
      expect.objectContaining({
        status: 'failed',
        error: 'La app no puede consultar este endpoint OTA (codigo: on_premise_app | HTTP 400)',
      }),
    );
  });

  it('limpia el mensaje viejo de up_to_date cuando comienza una descarga nueva', async () => {
    const { ota, App, CapacitorUpdater } = loadOtaModule();
    App.getInfo.mockResolvedValue({ version: '1.0.0', build: '100' });
    CapacitorUpdater.current.mockResolvedValue({ bundle: { version: '1.0.0', id: 'builtin' } });
    CapacitorUpdater.getBuiltinVersion.mockResolvedValue({ version: '1.0.0' });
    CapacitorUpdater.getDeviceId.mockResolvedValue({ deviceId: 'device-1' });
    CapacitorUpdater.getPluginVersion.mockResolvedValue({ version: '8.47.9' });
    CapacitorUpdater.getFailedUpdate.mockResolvedValue(null);
    CapacitorUpdater.getAppId.mockResolvedValue({ appId: 'com.riovoley.app' });
    CapacitorUpdater.getChannel.mockResolvedValue({ channel: 'production' });
    CapacitorUpdater.download.mockResolvedValue({ id: 'bundle-2', version: '1.0.1' });

    await ota.initializeOtaUpdates();

    CapacitorUpdater.getLatest.mockResolvedValueOnce({
      kind: 'up_to_date',
      message: 'No new version available',
      version: '1.0.0',
    });

    await ota.checkForAppUpdate();
    expect(ota.getOtaState().lastCheckResult?.message).toBe('No new version available');

    CapacitorUpdater.getLatest.mockResolvedValueOnce({
      kind: 'major',
      version: '1.0.1',
      url: 'https://example.com/bundle.zip',
      checksum: 'abc',
    });

    await ota.checkForAppUpdate();
    await ota.downloadAppUpdate();

    expect(ota.getOtaState()).toEqual(
      expect.objectContaining({
        status: 'ready_to_apply',
        lastCheckResult: null,
      }),
    );
  });
});
