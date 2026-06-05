import { Browser } from '@capacitor/browser';
import { isNativePlatform } from './runtime';

const EXTERNAL_PROTOCOL_PATTERN = /^(https?:|mailto:|tel:|sms:|whatsapp:)/i;

export const isExternalUrl = (url = '') => EXTERNAL_PROTOCOL_PATTERN.test(url);

export const openExternalUrl = async (url) => {
  if (!url) return;

  if (isNativePlatform()) {
    await Browser.open({ url });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};

export const openWhatsAppChat = async ({ phoneNumber, message }) => {
  const encodedMessage = encodeURIComponent(message || '');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  await openExternalUrl(whatsappUrl);
};
