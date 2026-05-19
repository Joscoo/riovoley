import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { Card, Button, Field, getUserTypeLabel } from '../../../../../shared/ui';

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70';

const DeleteUserModal = ({ user, userType, onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState('');
  const confirmInputRef = useRef(null);

  useEffect(() => {
    confirmInputRef.current?.focus();
  }, []);

  const fullName = user.full_name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
  const typeLabel = getUserTypeLabel(userType);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (confirmText !== 'ELIMINAR') {
      alert('Debes escribir ELIMINAR para confirmar');
      return;
    }

    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-red-500/25 pb-3">
          <h3 className="text-lg font-bold text-white">
            <FaTrash className="mr-2 inline align-middle text-red-400" />
            Eliminar {typeLabel}
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

          <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <p className="flex items-start gap-2">
              <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-red-400" />
              <span><strong>¡Esta acción no se puede deshacer!</strong></span>
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Se eliminará el usuario del sistema de autenticación</li>
              <li>Se eliminarán todos sus datos personales</li>
              {userType === 'atleta' && (
                <>
                  <li>Se eliminarán sus registros deportivos</li>
                  <li>Se eliminarán sus pagos y asistencias</li>
                </>
              )}
            </ul>
          </div>

          <Field label='Escribe "ELIMINAR" para confirmar'>
            <input
              ref={confirmInputRef}
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value.toUpperCase())}
              className={INPUT_BASE}
              placeholder="ELIMINAR"
              required
            />
          </Field>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              disabled={confirmText !== 'ELIMINAR'}
            >
              Eliminar Permanentemente
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default DeleteUserModal;
