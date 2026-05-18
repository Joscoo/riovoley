import React from 'react';
import { FaEdit, FaTrash, FaEnvelope, FaBan, FaCheckCircle, FaExchangeAlt, FaUser, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';
import { Card } from '../../../../../shared/ui';
import { Button } from '../../../../../shared/ui';

const getRoleBadgeClass = (role) => {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === 'administrador') return 'bg-[#2E3192] text-white';
  if (normalizedRole === 'entrenador') return 'bg-[#F9B233] text-slate-900';
  return 'bg-[#355FB3] text-white';
};

const getRoleIcon = (role) => {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === 'administrador') return <FaUserShield aria-hidden="true" />;
  if (normalizedRole === 'entrenador') return <FaChalkboardTeacher aria-hidden="true" />;
  return <FaUser aria-hidden="true" />;
};

const formatCategoria = (categoria) => {
  const categorias = {
    iniciacion_hombres: 'Iniciación Hombres',
    iniciacion_mujeres: 'Iniciación Mujeres',
    perfeccionamiento_hombres: 'Perfeccionamiento Hombres',
    perfeccionamiento_mujeres: 'Perfeccionamiento Mujeres',
    master_mujeres: 'Master Mujeres'
  };
  return categorias[categoria] || categoria || 'Sin categoría';
};

const calculateAge = (birthDateString) => {
  if (!birthDateString) return 'N/A';
  
  const birthDate = new Date(birthDateString);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : 0;
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const UserCard = ({ 
  user, 
  userType, 
  permissions,
  onEdit,
  onDelete,
  onSuspend,
  onReactivate,
  onResendCredentials,
  onChangeRole
}) => {
  const fullName = user.full_name || `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Sin nombre';
  const isSuspended = user.suspended === true;
  const roleBadgeClass = getRoleBadgeClass(user.role);

  return (
    <Card 
      variant="solid" 
      className="flex h-full flex-col border-2 border-slate-200 bg-white text-slate-900 transition-all duration-200 hover:border-rv-gold/40 hover:shadow-lg"
      role="article"
      aria-label={`${userType}: ${fullName}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-slate-100 pb-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold leading-tight text-slate-900 tablet:text-xl">
            {fullName}
          </h3>
          
          {isSuspended && (
            <span 
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800"
              role="status"
              aria-label="Usuario suspendido"
            >
              <FaBan className="text-[10px]" aria-hidden="true" /> Suspendido
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex shrink-0 gap-2">
          {permissions.canEdit && (
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 border-2 border-emerald-400/50 bg-emerald-50 text-emerald-700 transition-all duration-200 hover:bg-emerald-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={onEdit}
              aria-label={`Editar ${fullName}`}
              title="Editar"
            >
              <FaEdit aria-hidden="true" />
            </Button>
          )}
          
          {permissions.canDelete && (
            <Button
              size="icon"
              variant="danger"
              className="h-10 w-10 transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500"
              onClick={onDelete}
              aria-label={`Eliminar ${fullName}`}
              title="Eliminar"
            >
              <FaTrash aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* User data */}
      <dl className="grid flex-1 gap-3 text-sm text-slate-700 tablet:gap-4">
        <div className="space-y-1">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</dt>
          <dd className="truncate font-medium text-slate-900">{user.email || 'Sin email'}</dd>
        </div>
        
        {user.telefono && (
          <div className="space-y-1">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Teléfono</dt>
            <dd className="font-medium">{user.telefono}</dd>
          </div>
        )}
        
        {userType === 'atleta' && (
          <>
            <div className="space-y-1">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Categoría</dt>
              <dd>
                <span className="inline-flex rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-900">
                  {formatCategoria(user.categoria)}
                </span>
              </dd>
            </div>
            
            <div className="space-y-1">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Edad</dt>
              <dd className="font-semibold text-slate-900">{calculateAge(user.fecha_nacimiento)} años</dd>
            </div>
          </>
        )}
        
        {(userType === 'entrenador' || userType === 'administrador') && (
          <div className="space-y-1">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Último acceso</dt>
            <dd className="text-sm">{formatDateTime(user.last_login)}</dd>
          </div>
        )}
        
        <div className="space-y-1">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Rol</dt>
          <dd>
            <span 
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase shadow-sm ${roleBadgeClass}`}
            >
              {getRoleIcon(user.role)}
              <span>{user.role}</span>
            </span>
          </dd>
        </div>
      </dl>

      {/* Footer actions */}
      <div className="mt-auto border-t-2 border-slate-100 pt-4">
        <div className="flex flex-col gap-2.5">
          {permissions.canResendCredentials && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onResendCredentials}
              className="w-full justify-center border-2 border-blue-300 bg-blue-50 text-sm font-semibold text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label={`Reenviar credenciales a ${fullName}`}
            >
              <FaEnvelope className="mr-2" aria-hidden="true" /> Reenviar credenciales
            </Button>
          )}
          
          <div className="grid grid-cols-2 gap-2.5">
            {permissions.canSuspend && !isSuspended && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onSuspend}
                className="justify-center border-2 border-amber-300 bg-amber-50 text-sm font-semibold text-amber-800 transition-all duration-200 hover:border-amber-400 hover:bg-amber-100 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={`Suspender a ${fullName}`}
              >
                <FaBan className="mr-1.5" aria-hidden="true" /> Suspender
              </Button>
            )}
            
            {permissions.canSuspend && isSuspended && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onReactivate}
                className="justify-center border-2 border-green-300 bg-green-50 text-sm font-semibold text-green-800 transition-all duration-200 hover:border-green-400 hover:bg-green-100 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label={`Reactivar a ${fullName}`}
              >
                <FaCheckCircle className="mr-1.5" aria-hidden="true" /> Reactivar
              </Button>
            )}
            
            {permissions.canChangeRole && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onChangeRole}
                className="justify-center border-2 border-purple-300 bg-purple-50 text-sm font-semibold text-purple-800 transition-all duration-200 hover:border-purple-400 hover:bg-purple-100 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500"
                aria-label={`Cambiar rol de ${fullName}`}
              >
                <FaExchangeAlt className="mr-1.5" aria-hidden="true" /> Cambiar rol
              </Button>
            )}
          </div>
        </div>
        
        {isSuspended && user.suspension_reason && (
          <div 
            className="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-xs text-red-900"
            role="status"
            aria-label="Información de suspensión"
          >
            <p className="font-semibold">Motivo de suspensión:</p>
            <p className="mt-1">{user.suspension_reason}</p>
            {user.suspension_until && (
              <p className="mt-2 font-semibold">
                Suspendido hasta: {formatDateTime(user.suspension_until)}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default UserCard;


