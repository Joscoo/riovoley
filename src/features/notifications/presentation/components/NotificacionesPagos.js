// src/features/notifications/presentation/components/NotificacionesPagos.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaBell, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { notificationsService } from '../../notificationsService';
import { cn } from '../../../../lib/cn';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';
import { SectionHeader } from '../../../../shared/ui';

const NotificacionesPagos = ({ userRole }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarNotificaciones = async () => {
    try {
      const notifications = await notificationsService.loadPaymentNotifications();
      setNotificaciones(notifications);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setLoading(false);
    }
  };

  const getIcono = (tipo) => {
    switch (tipo) {
      case 'danger':
        return <FaExclamationTriangle />;
      case 'warning':
        return <FaBell />;
      case 'info':
        return <FaInfoCircle />;
      default:
        return <FaBell />;
    }
  };

  const getTipoStyles = (tipo) => {
    switch (tipo) {
      case 'danger':
        return {
          container: 'border-red-300/55 bg-red-500/10',
          icon: 'text-red-300'
        };
      case 'warning':
        return {
          container: 'border-amber-300/55 bg-amber-500/10',
          icon: 'text-amber-300'
        };
      case 'info':
      default:
        return {
          container: 'border-cyan-300/55 bg-cyan-500/10',
          icon: 'text-cyan-300'
        };
    }
  };

  const notificacionesAMostrar = mostrarTodas ? notificaciones : notificaciones.slice(0, 5);

  if (loading) {
    return (
      <Card variant="solid" className="mb-6 text-slate-900">
        <SectionHeader
          title="Notificaciones de Pagos"
          icon={<FaBell className="text-blue-600" />}
          className="mb-4 border-b border-slate-200 pb-3"
        />
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-medium text-slate-600">
          Cargando notificaciones...
        </div>
      </Card>
    );
  }

  if (notificaciones.length === 0) {
    return (
      <Card variant="solid" className="mb-6 text-slate-900">
        <SectionHeader
          title="Notificaciones de Pagos"
          icon={<FaBell className="text-blue-600" />}
          className="mb-4 border-b border-slate-200 pb-3"
        />
        <EmptyState
          icon={<FaInfoCircle />}
          title="Sin notificaciones"
          description="No hay notificaciones de periodos proximos a vencer."
          className="max-w-none border-slate-200 bg-slate-50 text-slate-800"
        />
      </Card>
    );
  }

  return (
    <Card variant="solid" className="mb-6 text-slate-900">
      <SectionHeader
        title="Notificaciones de Pagos"
        icon={<FaBell className="text-blue-600" />}
        className="mb-4 border-b border-slate-200 pb-3"
        actions={(
          <div className="flex w-full flex-col gap-2 mobile:w-auto mobile:flex-row mobile:items-center">
            <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-blue-600 px-4 text-xs font-bold uppercase tracking-[0.8px] text-white">
              {notificaciones.length}
            </span>
            <Button variant="outline" onClick={() => setMostrarTodas(!mostrarTodas)} className="w-full mobile:w-auto">
              {mostrarTodas ? 'Ver menos' : `Ver todas (${notificaciones.length})`}
            </Button>
          </div>
        )}
      />

      <div className="space-y-3">
        {notificacionesAMostrar.map((notif) => {
          const typeStyles = getTipoStyles(notif.tipo);
          return (
            <div
              key={notif.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border-l-4 px-4 py-3 transition-shadow hover:shadow-md',
                typeStyles.container
              )}
            >
              <div className={cn('mt-1 text-xl', typeStyles.icon)}>{getIcono(notif.tipo)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 mobile:text-base">{notif.mensaje}</p>
                <span className="mt-1 block text-xs text-slate-600 mobile:text-sm">
                  Categoria: {notif.categoria.replaceAll('_', ' ')} • Vence:{' '}
                  {new Date(notif.fecha_fin).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Rol actual: <span className="font-semibold">{userRole}</span>
      </p>
    </Card>
  );
};

NotificacionesPagos.propTypes = {
  userRole: PropTypes.string.isRequired
};

export default NotificacionesPagos;



