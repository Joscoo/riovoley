import React, { useState } from 'react';
import { FaExchangeAlt, FaTimes, FaExclamationTriangle, FaUser, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { cn } from '../../../../lib/cn';

const getRoleBadgeClass = (role) => {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === 'administrador') return 'bg-[#2E3192] text-white';
  if (normalizedRole === 'entrenador') return 'bg-[#F9B233] text-slate-900';
  return 'bg-[#355FB3] text-white';
};

const getRoleIconClass = (role) => {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === 'administrador') return 'text-[#2E3192]';
  if (normalizedRole === 'entrenador') return 'text-[#F9B233]';
  return 'text-[#355FB3]';
};

const ChangeRoleModal = ({ user, currentRole, onConfirm, onCancel }) => {
  const [newRole, setNewRole] = useState('');
  
  const fullName = user.full_name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
  
  const AVAILABLE_ROLES = [
    { value: 'estudiante', label: 'Estudiante', icon: <FaUser /> },
    { value: 'entrenador', label: 'Entrenador', icon: <FaChalkboardTeacher /> },
    { value: 'administrador', label: 'Administrador', icon: <FaUserShield /> }
  ].filter(role => role.value !== currentRole?.toLowerCase());
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newRole) {
      alert('Selecciona un nuevo rol');
      return;
    }
    
    onConfirm(newRole);
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
            <FaExchangeAlt className="mr-2 inline align-middle text-rv-gold" />
            Cambiar Rol de Usuario
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
            <p className="mt-2 flex items-center gap-2 text-sm">
              <strong className="text-white">Rol actual:</strong>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase',
                  getRoleBadgeClass(currentRole)
                )}
              >
                {currentRole}
              </span>
            </p>
          </div>
          
          <div className="space-y-3">
            <p className="text-sm font-bold text-rv-gold">Selecciona el nuevo rol:</p>
            
            {AVAILABLE_ROLES.map(role => (
              <label
                key={role.value}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                  newRole === role.value
                    ? 'border-rv-gold bg-rv-gold/10'
                    : 'border-white/20 bg-black/20 hover:bg-black/30'
                )}
              >
                <input
                  type="radio"
                  name="newRole"
                  value={role.value}
                  checked={newRole === role.value}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="h-5 w-5 text-rv-gold focus:ring-rv-gold"
                />
                <span className="flex items-center gap-2 text-white">
                  <span className={getRoleIconClass(role.value)}>{role.icon}</span>
                  <span className="font-semibold">{role.label}</span>
                </span>
              </label>
            ))}
          </div>
          
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
            <FaExclamationTriangle className="mr-2 inline align-middle" />
            Cambiar el rol puede afectar los permisos y el acceso del usuario al sistema.
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!newRole}>
              Cambiar Rol
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChangeRoleModal;
