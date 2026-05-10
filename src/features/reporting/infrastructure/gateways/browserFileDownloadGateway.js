import { downloadError } from '../../domain/reportingErrors';

export class BrowserFileDownloadGateway {
  async downloadFromSignedUrl(url, fileName) {
    const response = await fetch(url);
    if (!response.ok) {
      throw downloadError(`No se pudo descargar el archivo (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  }
}
