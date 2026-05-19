import React, { useState, useEffect, useRef } from 'react';
import { FaBan, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';
import { Field } from '../../../../../shared/ui';

const INPUT_BASE = 
  'min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70';

const SuspendUserModal = ({ user, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');
  const reasonRef = useRef(null);
  
  useEffect(() => {
    reasonRef.current?.focus();
  }, []);
  
  const fullName = user.full_name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Debes ingresar un motivo de suspensión');
      return;
    }
    
    onConfirm({ reason, until: until || null });
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
            <FaBan className="mr-2 inline align-middle text-red-400" />
            Suspender Usuario
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
          </div>
          
          <Field label="Motivo de suspensión *">
            <textarea
              ref={reasonRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${INPUT_BASE} min-h-[100px] resize-none`}
              placeholder="Ingrese el motivo de la suspensión..."
              required
            />
          </Field>
          
          <Field label="Suspender hasta (opcional)" hint="Dejar vacío para suspensión indefinida">
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className={`${INPUT_BASE} rv-dark-date-input`}
              min={new Date().toISOString().split('T')[0]}
            />
          </Field>
          
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            <FaExclamationTriangle className="mr-2 inline align-middle" />
            El usuario no podrá iniciar sesión mientras esté suspendido.
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="danger" className="flex-1">
              Suspender
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SuspendUserModal;

