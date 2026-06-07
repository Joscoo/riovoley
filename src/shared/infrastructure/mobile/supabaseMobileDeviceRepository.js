import { supabase } from '../../../config/supabase';
import { getOtaDeviceMetadata } from '../../platform';
import { getPlatform } from '../../platform';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseMobileDeviceRepository {
  async upsertDeviceToken({ userId, deviceToken }) {
    if (!userId || !deviceToken) return;

    const otaMetadata = await getOtaDeviceMetadata().catch(() => null);

    const { error } = await supabase.functions.invoke('sync-mobile-device', {
      body: {
        action: 'upsert',
        platform: getPlatform(),
        device_token: deviceToken,
        device_id: otaMetadata?.deviceId || null,
        notifications_enabled: true,
        app_version: process.env.REACT_APP_VERSION || 'web',
        native_version: otaMetadata?.nativeVersion || null,
        native_build: otaMetadata?.nativeBuild || null,
        bundle_version: otaMetadata?.otaBundleVersion || null,
        bundle_id: otaMetadata?.otaBundleId || null,
        builtin_version: otaMetadata?.builtinVersion || null,
        ota_channel: otaMetadata?.otaChannel || null,
        updater_plugin_version: otaMetadata?.updaterPluginVersion || null,
      },
    });

    if (error) {
      throw new Error(normalizeError(error, 'No se pudo registrar el dispositivo móvil.'));
    }
  }

  async deactivateDeviceToken({ userId, deviceToken }) {
    if (!userId || !deviceToken) return;

    const { error } = await supabase.functions.invoke('sync-mobile-device', {
      body: {
        action: 'remove',
        device_token: deviceToken,
        notifications_enabled: false,
      },
    });

    if (error) {
      throw new Error(normalizeError(error, 'No se pudo desactivar el dispositivo móvil.'));
    }
  }
}

export const mobileDeviceRepository = new SupabaseMobileDeviceRepository();
