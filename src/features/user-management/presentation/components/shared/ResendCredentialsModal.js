import React, { useRef, useState } from 'react';
import { FaEnvelope, FaTimes, FaExclamationTriangle, FaWhatsapp } from 'react-icons/fa';
import { Card, Button } from '../../../../../shared/ui';

const ResendCredentialsModal = ({ user, onConfirm, onCancel }) => {
  const [channels, setChannels] = useState({ email: true, whatsapp: false });
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const sendingRef = useRef(false);
  const close = () => { if (!sendingRef.current) onCancel(); };

  const fullName = user.full_name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (sendingRef.current || result) return;

    const selectedChannels = [];
    if (channels.email) selectedChannels.push('email');
    if (channels.whatsapp) selectedChannels.push('whatsapp');

    if (selectedChannels.length === 0) {
      setError('Selecciona al menos un canal de envío');
      return;
    }

    sendingRef.current = true;
    setIsSending(true);
    setError('');
    try {
      const response = await onConfirm(selectedChannels);
      if (!response?.credentials) throw new Error('No se recibió la confirmación del reenvío.');
      setResult(response);
    } catch (failure) {
      setError(failure.message || 'No se pudo completar el reenvío.');
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="resend-credentials-title"
    >
      <Card
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-rv-gold/25 pb-3">
          <h3 id="resend-credentials-title" className="text-lg font-bold text-white">
            <FaEnvelope className="mr-2 inline align-middle text-rv-gold" />
            Reenviar Credenciales
          </h3>
          <Button variant="ghost" size="icon" onClick={close} disabled={isSending} aria-label="Cerrar reenvío de credenciales">
            <FaTimes />
          </Button>
        </div>

        {result ? (
          <div className="space-y-4">
            <p role="status" className={result.deliverySuccess ? 'text-emerald-200' : 'text-amber-200'}>{result.message}</p>
            {result.emailError && <p className="text-sm text-red-200">Email: {result.emailError}</p>}
            {result.whatsappError && <p className="text-sm text-red-200">WhatsApp: {result.whatsappError}</p>}
            {result.firstLoginUpdated === false && <p className="text-sm text-amber-200">No se pudo confirmar el cambio obligatorio de contraseña al ingresar.</p>}
            <div className="space-y-2 break-all rounded-lg border border-rv-gold/30 bg-black/30 p-3 text-sm text-white">
              <p>Email: {result.credentials.email}</p>
              <p>Contraseña temporal: <code>{result.credentials.password}</code></p>
              <p>Acceso: {result.credentials.loginUrl}</p>
            </div>
            <p className="text-sm text-slate-300">La contraseña anterior dejó de funcionar. Conserva estos datos y compártelos por un medio seguro si el envío falló.</p>
            <Button type="button" onClick={close} className="w-full">Cerrar</Button>
          </div>
        ) : <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-slate-600/50 bg-slate-800/50 p-3">
            <p className="text-sm text-white">
              <strong>Usuario:</strong> {fullName}
            </p>
            <p className="text-sm text-slate-300">
              <strong>Email:</strong> {user.email}
            </p>
            {user.telefono && (
              <p className="text-sm text-slate-300">
                <strong>Teléfono:</strong> {user.telefono}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            <FaExclamationTriangle className="mr-2 inline align-middle" />
            Se generará una nueva contraseña temporal y se enviará por los canales seleccionados.
            {' '}La contraseña anterior dejará de funcionar.
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-rv-gold">Selecciona canal(es) de envío:</p>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/20 bg-black/20 p-3 transition-colors hover:bg-black/30">
              <input
                type="checkbox"
                disabled={isSending}
                checked={channels.email}
                onChange={(event) => setChannels((prev) => ({ ...prev, email: event.target.checked }))}
                className="h-5 w-5 rounded border-gray-300 text-rv-gold focus:ring-rv-gold"
              />
              <span className="flex items-center gap-2 text-white">
                <FaEnvelope className="text-rv-gold" />
                Enviar por Email
              </span>
            </label>

            {user.telefono && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/20 bg-black/20 p-3 transition-colors hover:bg-black/30">
                <input
                  type="checkbox"
                  disabled={isSending}
                  checked={channels.whatsapp}
                  onChange={(event) => setChannels((prev) => ({ ...prev, whatsapp: event.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-rv-gold focus:ring-rv-gold"
                />
                <span className="flex items-center gap-2 text-white">
                  <FaWhatsapp className="text-green-400" />
                  Enviar por WhatsApp
                </span>
              </label>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={close} disabled={isSending} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSending} className="flex-1">
              {isSending ? 'Enviando...' : 'Enviar Credenciales'}
            </Button>
          </div>
        </form>}
      </Card>
    </div>
  );
};

export default ResendCredentialsModal;
