import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './runtime';

export const platformStorage = {
  async get(key) {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return window.localStorage.getItem(key);
  },

  async set(key, value) {
    const normalizedValue = value == null ? '' : String(value);
    if (isNativePlatform()) {
      await Preferences.set({ key, value: normalizedValue });
      return;
    }
    window.localStorage.setItem(key, normalizedValue);
  },

  async remove(key) {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
      return;
    }
    window.localStorage.removeItem(key);
  },
};
