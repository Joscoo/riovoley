import { useCallback, useRef, useState } from 'react';
import { communicationsService } from '../../../communications';
import { userProvisioningService } from '../../../user-provisioning';

const buildPendingCredentials = (result) => ({
  email: result.credentials.email,
  password: result.credentials.password,
  loginUrl: result.credentials.loginUrl,
  canLogin: result.canLogin,
  user: result.user,
  message: result.message,
});

const buildCredentialUserData = (pendingCredentials) => ({
  email: pendingCredentials.email,
  nombre: pendingCredentials.user?.nombre || '',
  apellido: pendingCredentials.user?.apellido || '',
  full_name: `${pendingCredentials.user?.nombre || ''} ${pendingCredentials.user?.apellido || ''}`.trim(),
  password: pendingCredentials.password,
});

const buildResendResultMessage = ({ channels, credentials, summaryMessage }) => {
  const channelsText = channels.length > 0 ? channels.join(', ') : 'Ninguno';
  const header = channels.length > 0
    ? `Nueva Contraseña temporal enviada via: ${channelsText}`
    : 'No se pudo enviar por Email ni WhatsApp.';

  return [
    header,
    '',
    `Email: ${credentials.email}`,
    `Contraseña: ${credentials.password}`,
    `URL: ${credentials.loginUrl}`,
    '',
    'Importante: la Contraseña anterior ya no funciona.',
    '',
    summaryMessage,
    ...(channels.length === 0 ? ['', 'Comparte esta informacion manualmente.'] : []),
  ].join('\n');
};

export const useAthleteCredentials = ({ onError, onSuccess }) => {
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [credentialsReport, setCredentialsReport] = useState(null);
  const pendingCredentialsRef = useRef(null);

  const clearPendingCredentials = useCallback(() => {
    pendingCredentialsRef.current = null;
    setPendingCredentials(null);
  }, []);

  const clearCredentialsReport = useCallback(() => {
    setCredentialsReport(null);
  }, []);

  const setPendingCredentialsFromCreation = useCallback((result) => {
    const nextCredentials = buildPendingCredentials(result);
    pendingCredentialsRef.current = nextCredentials;
    setPendingCredentials(nextCredentials);
    return nextCredentials;
  }, []);

  const sendPendingCredentialsByEmail = useCallback(async () => {
    const currentPendingCredentials = pendingCredentialsRef.current;
    if (!currentPendingCredentials) {
      return { success: false, error: 'No hay credenciales pendientes para enviar.' };
    }

    const userData = buildCredentialUserData(currentPendingCredentials);

    try {
      const emailResult = await communicationsService.sendCredentials(userData);

      if (!emailResult.success) {
        throw new Error(
          `No se pudo enviar el email automaticamente: ${emailResult.error || 'Error desconocido'}. Las credenciales ya fueron mostradas.`
        );
      }

      onSuccess?.(`Credenciales enviadas exitosamente a ${currentPendingCredentials.email}`);
      pendingCredentialsRef.current = null;
      setPendingCredentials(null);
      return { success: true };
    } catch (error) {
      const errorText = `Error enviando email: ${error.message}. Las credenciales ya fueron mostradas.`;
      onError?.(errorText);
      return { success: false, error: errorText };
    }
  }, [onError, onSuccess]);

  const resendCredentialsForAthlete = useCallback(async (atleta) => {
    if (!atleta.user_id || !atleta.users?.email) {
      const errorText = 'Datos del atleta incompletos. No se puede reenviar credenciales.';
      onError?.(errorText);
      throw new Error(errorText);
    }

    try {
      const result = await userProvisioningService.resendCredentials({
        user_id: atleta.user_id,
        email: atleta.users.email,
        nombre: atleta.users.nombre,
        apellido: atleta.users.apellido,
      });

      if (!result.success) {
        throw new Error('No se pudieron obtener las credenciales');
      }

      const userData = {
        email: result.credentials.email,
        nombre: atleta.users.nombre,
        apellido: atleta.users.apellido,
        telefono: atleta.users.telefono,
        full_name: `${atleta.users.nombre} ${atleta.users.apellido}`.trim(),
        password: result.credentials.password,
      };

      let whatsappResult = { success: false };
      if (userData.telefono) {
        whatsappResult = await userProvisioningService.sendCredentialsByWhatsApp({
          userData,
          password: userData.password,
        });
      }

      const channels = [];
      if (result.emailSent) channels.push('Email');
      if (whatsappResult.success) channels.push('WhatsApp');

      const report = {
        title: 'Resultado de reenvio de credenciales',
        message: buildResendResultMessage({
          channels,
          credentials: result.credentials,
          summaryMessage: result.message,
        }),
      };

      setCredentialsReport(report);
      onSuccess?.('Proceso de reenvio de credenciales completado.');
      return report;
    } catch (error) {
      const errorText = `Error reenviando credenciales: ${error.message}`;
      onError?.(errorText);
      throw error;
    }
  }, [onError, onSuccess]);

  return {
    pendingCredentials,
    credentialsReport,
    setPendingCredentialsFromCreation,
    clearPendingCredentials,
    clearCredentialsReport,
    sendPendingCredentialsByEmail,
    resendCredentialsForAthlete,
  };
};

export default useAthleteCredentials;
