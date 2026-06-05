import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNativePlatform } from './runtime';

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo convertir el archivo descargado.'));
  reader.onload = () => {
    const [, base64 = ''] = String(reader.result || '').split(',');
    resolve(base64);
  };
  reader.readAsDataURL(blob);
});

const sanitizeFileName = (value = 'reporte.pdf') => value.replace(/[^\w.-]+/g, '_');

export const downloadFile = async ({ url, fileName }) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo descargar el archivo (${response.status})`);
  }

  const safeFileName = sanitizeFileName(fileName);

  if (isNativePlatform()) {
    const blob = await response.blob();
    const base64Data = await blobToBase64(blob);
    const writtenFile = await Filesystem.writeFile({
      path: safeFileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: safeFileName,
      url: writtenFile.uri,
      dialogTitle: 'Compartir reporte',
    });
    return;
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};
