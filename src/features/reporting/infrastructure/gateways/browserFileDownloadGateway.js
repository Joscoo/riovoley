import { downloadError } from '../../domain/reportingErrors';
import { downloadFile } from '../../../../shared/platform';

export class BrowserFileDownloadGateway {
  async downloadFromSignedUrl(url, fileName) {
    try {
      await downloadFile({ url, fileName });
    } catch (error) {
      throw downloadError(error?.message || 'No se pudo descargar el archivo');
    }
  }
}
