import React, { useState } from 'react';
import { FaEnvelope, FaTimes, FaExclamationTriangle, FaWhatsapp } from 'react-icons/fa';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';

const ResendCredentialsModal = ({ user, onConfirm, onCancel }) => {
  const [channels, setChannels] = useState({ email: true, whatsapp: false });
  
  const fullName = user.full_name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedChannels = [];
    if (channels.email) selectedChannels.push('email');
    if (channels.whatsapp) selectedChannels.push('whatsapp');
    
    if (selectedChannels.length === 0) {
      alert('Selecciona al menos un canal de envío');
      return;
    }
    
    onConfirm(selectedChannels);
  };
  
  return (
    <div 
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card 
        className="w-full max-w-md" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-rv-gold/25 pb-3">
          <h3 className="text-lg font-bold text-white">
            <FaEnvelope className="mr-2 inline align-middle text-rv-gold" />
            Reenviar Credenciales
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <FaTimes />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>
          
          <div className="space-y-3">
            <p className="text-sm font-bold text-rv-gold">Selecciona canal(es) de envío:</p>
            
            <label className="flex items-center gap-3 rounded-lg border border-white/20 bg-black/20 p-3 cursor-pointer hover:bg-black/30 transition-colors">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(e) => setChannels(prev => ({ ...prev, email: e.target.checked }))}
                className="h-5 w-5 rounded border-gray-300 text-rv-gold focus:ring-rv-gold"
              />
              <span className="flex items-center gap-2 text-white">
                <FaEnvelope className="text-rv-gold" />
                Enviar por Email
              </span>
            </label>
            
            {user.telefono && (
              <label className="flex items-center gap-3 rounded-lg border border-white/20 bg-black/20 p-3 cursor-pointer hover:bg-black/30 transition-colors">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={(e) => setChannels(prev => ({ ...prev, whatsapp: e.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-rv-gold focus:ring-rv-gold"
                />
                <span className="flex items-center gap-2 text-white">
                  <FaWhatsapp className="text-green-400" />
                  Enviar por WhatsApp
                </span>
              </label>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Enviar Credenciales
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ResendCredentialsModal;

