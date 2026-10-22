import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Modal } from '../../../../../shared/ui';
import { communicationsService } from '../../../../communications';

const CreatedCredentialsModal = ({ result, formData, onClose }) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const sendingRef = useRef(false);
  const startedRef = useRef(false);
  const credentials = result?.credentials;
  const sendEmail = useCallback(async () => {
    if (sendingRef.current || !credentials?.password) return;
    sendingRef.current = true;
    setStatus('sending');
    setError('');
    try {
      const response = await communicationsService.sendCredentials({
        email: credentials.email, password: credentials.password,
        nombre: formData.nombre, apellido: formData.apellido,
      });
      if (!response?.success) throw new Error(response?.error || 'El servicio no confirmó el envío.');
      setStatus('sent');
    } catch (failure) {
      setError(failure.message || 'No se pudo confirmar el envío del correo.');
      setStatus('failed');
    } finally {
      sendingRef.current = false;
    }
  }, [credentials, formData]);

  useEffect(() => {
    if (!startedRef.current && formData.send_credentials_on_create) {
      startedRef.current = true;
      void sendEmail();
    }
  }, [formData.send_credentials_on_create, sendEmail]);

  return (
    <Modal title="Credenciales de la cuenta creada" onClose={() => { if (!sendingRef.current) onClose(); }} className="max-w-lg">
      <div className="space-y-4 text-sm text-white">
        <p>La cuenta ya fue creada. Conserva estas credenciales para entregarlas al usuario.</p>
        {credentials?.password ? <div className="space-y-2 break-all rounded-lg border border-rv-gold/30 bg-black/30 p-3">
          <p>Email: {credentials.email}</p>
          <p>Contraseña temporal: <code>{credentials.password}</code></p>
          <p>Acceso: {credentials.loginUrl}</p>
        </div> : <p role="alert">No se recibieron las credenciales. Revisa la cuenta creada antes de intentar crearla otra vez.</p>}
        {result?.canLogin === false && <p className="text-amber-200">La cuenta puede requerir confirmación del email antes de ingresar.</p>}
        <p role="status">{status === 'sending' ? 'Enviando credenciales...' : status === 'sent'
          ? 'El servicio aceptó el correo. Si no llega, revisa la carpeta de correo no deseado.'
          : status === 'failed' ? 'La cuenta se creó, pero el envío no se confirmó.' : 'El envío automático está desactivado. Puedes compartir las credenciales manualmente o enviarlas ahora.'}</p>
        {error && <p role="alert" className="text-red-200">{error}</p>}
        {status !== 'sent' && <Button onClick={sendEmail} disabled={status === 'sending' || !credentials?.password}>
          {status === 'failed' ? 'Reintentar envío por email' : 'Enviar por email'}
        </Button>}
        <Button variant="secondary" onClick={onClose} disabled={status === 'sending'}>Cerrar</Button>
      </div>
    </Modal>
  );
};

export default CreatedCredentialsModal;
