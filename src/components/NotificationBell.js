// src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';
import { getEcuadorDate, calcularDiferenciaDias } from '../utils/dateUtils';
import { getLatestPaymentsList } from '../utils/paymentUtils';
import { FaBell, FaExclamationTriangle, FaBullhorn, FaInfoCircle } from 'react-icons/fa';
import { cn } from '../lib/cn';

const NotificationBell = ({ userRole }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    cargarNotificaciones();
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const determinarTipoNotificacion = (diferenciaDias) => {
    if (diferenciaDias <= 0) return 'danger';
    if (diferenciaDias === 1) return 'warning';
    return 'info';
  };

  const generarMensajePago = (diferenciaDias, nombreCompleto) => {
    if (diferenciaDias === 0) {
      return `${nombreCompleto} - Vence HOY`;
    }
    if (diferenciaDias < 0) {
      return `${nombreCompleto} - Venció hace ${Math.abs(diferenciaDias)} día(s)`;
    }
    if (diferenciaDias === 1) {
      return `${nombreCompleto} - Vence MAÑANA`;
    }
    return `${nombreCompleto} - Vence en ${diferenciaDias} días`;
  };

  const cargarNotificacionesPagos = async () => {
    try {
      const hoy = getEcuadorDate();

      // Obtener todos los pagos no eliminados
      const { data: todosPagos, error: pagosError } = await supabase
        .from('payments')
        .select('student_id, fecha_fin')
        .is('deleted_at', null)
        .order('fecha_fin', { ascending: false });

      if (pagosError) throw pagosError;

      const ultimosPagos = getLatestPaymentsList(todosPagos || []);

      const notificacionesPagos = [];

      // Obtener información de estudiantes en una sola consulta
      const studentIds = ultimosPagos.map((pago) => pago.student_id);
      if (studentIds.length === 0) return [];

      const { data: estudiantes, error: estudiantesError } = await supabase
        .from('students')
        .select('id, users!inner(nombre, apellido)')
        .in('id', studentIds);

      if (estudiantesError) throw estudiantesError;

      // Crear un mapa de estudiantes por ID
      const estudiantesMap = new Map();
      (estudiantes || []).forEach(est => {
        estudiantesMap.set(est.id, est);
      });

      // Filtrar solo los que vencen en los próximos 5 días o ya vencieron
      for (const pago of ultimosPagos) {
        if (!pago.fecha_fin) continue;

        // Usar la función de dateUtils que maneja correctamente la zona horaria
        const diferenciaDias = calcularDiferenciaDias(pago.fecha_fin, hoy);

        if (diferenciaDias <= 5) {
          const estudiante = estudiantesMap.get(pago.student_id);
          if (estudiante) {
            const nombreCompleto = `${estudiante.users.nombre} ${estudiante.users.apellido}`;
            const mensaje = generarMensajePago(diferenciaDias, nombreCompleto);
            const tipo = determinarTipoNotificacion(diferenciaDias);

            notificacionesPagos.push({
              id: `pago-${pago.student_id}`,
              tipo_notificacion: 'pago',
              mensaje,
              tipo,
              fecha: pago.fecha_fin,
              orden: diferenciaDias
            });
          }
        }
      }

      return notificacionesPagos;
    } catch (error) {
      console.error('Error cargando notificaciones de pagos:', error);
      return [];
    }
  };

  const cargarAnuncios = async () => {
    try {
      // Cargar anuncios activos de los últimos 7 días
      const hoy = getEcuadorDate();
      const hace7Dias = new Date(hoy);
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      const fecha7DiasAtras = hace7Dias.toISOString().split('T')[0];

      const { data: anuncios, error: anunciosError } = await supabase
        .from('announcements')
        .select('id, title, content, created_at, is_active')
        .eq('is_active', true)
        .gte('created_at', fecha7DiasAtras)
        .order('created_at', { ascending: false })
        .limit(5);

      if (anunciosError) throw anunciosError;

      return (anuncios || []).map(anuncio => ({
        id: `anuncio-${anuncio.id}`,
        tipo_notificacion: 'anuncio',
        mensaje: anuncio.title,
        descripcion: anuncio.content.length > 80 
          ? anuncio.content.substring(0, 80) + '...'
          : anuncio.content,
        tipo: 'info',
        fecha: anuncio.created_at,
        orden: 100 // Los anuncios van después de los pagos urgentes
      }));
    } catch (error) {
      console.error('Error cargando anuncios:', error);
      return [];
    }
  };

  const cargarNotificaciones = async () => {
    setLoading(true);
    try {
      const [notifPagos, notifAnuncios] = await Promise.all([
        cargarNotificacionesPagos(),
        cargarAnuncios()
      ]);

      // Combinar y ordenar notificaciones
      const todasNotificaciones = [...notifPagos, ...notifAnuncios];
      todasNotificaciones.sort((a, b) => a.orden - b.orden);

      setNotificaciones(todasNotificaciones);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      cargarNotificaciones(); // Recargar al abrir
    }
  };

  const getIcono = (notificacion) => {
    if (notificacion.tipo_notificacion === 'anuncio') {
      return <FaBullhorn />;
    }
    switch (notificacion.tipo) {
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

  const totalNotificaciones = notificaciones.length;

  const notificationTypeClass = {
    danger: 'border-l-red-500 text-red-600',
    warning: 'border-l-amber-500 text-amber-500',
    info: 'border-l-cyan-500 text-cyan-600'
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        className="group relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-transparent p-2 text-white transition-all duration-200 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
        onClick={toggleDropdown}
        aria-label="Notificaciones"
      >
        <FaBell className="text-xl transition-transform duration-200 group-hover:scale-110 group-hover:animate-[ring_0.5s_ease] tablet:text-[22px]" />
        {totalNotificaciones > 0 && (
          <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-600 px-1 py-0.5 text-center text-[9px] font-bold leading-none text-white shadow-md animate-[notif-pulse_2s_ease-in-out_infinite] tablet:min-w-[18px] tablet:px-1.5 tablet:text-[10px]">
            {totalNotificaciones > 9 ? '9+' : totalNotificaciones}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-[5px] right-[5px] top-[56px] z-[1000] max-h-[calc(100vh-75px)] w-auto overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] animate-[slide-down_0.25s_ease] mobile:left-2.5 mobile:right-2.5 mobile:top-[65px] tablet:absolute tablet:left-auto tablet:right-0 tablet:top-[calc(100%+8px)] tablet:max-h-[500px] tablet:w-[350px] desktop:w-[380px]">
          <div className="flex items-center justify-between border-b-2 border-slate-100 bg-slate-50 px-5 py-4">
            <h4 className="m-0 text-base font-semibold text-slate-800">Notificaciones</h4>
            {totalNotificaciones > 0 && (
              <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">{totalNotificaciones}</span>
            )}
          </div>

          <div className="max-h-[calc(100vh-145px)] overflow-y-auto tablet:max-h-[400px]">
            {loading && (
              <div className="p-10 text-center text-slate-400">Cargando...</div>
            )}
            {!loading && totalNotificaciones === 0 && (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-400">
                <FaInfoCircle className="text-[40px] text-slate-300" />
                <p className="m-0 text-sm">No hay notificaciones</p>
              </div>
            )}
            {!loading && totalNotificaciones > 0 && (
              <ul className="m-0 list-none p-0">
                {notificaciones.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={cn(
                      'flex cursor-pointer gap-3 border-b border-slate-100 px-[18px] py-3.5 transition-colors duration-150 hover:bg-slate-50',
                      'border-l-[3px]',
                      notificationTypeClass[notif.tipo] || notificationTypeClass.info
                    )}
                  >
                    <div className="mt-0.5 shrink-0 text-xl">
                      {getIcono(notif)}
                    </div>
                    <div className="min-w-0 flex-1 text-slate-700">
                      <p className="mb-1 text-[13px] font-medium leading-[1.4] text-slate-800 tablet:text-sm">{notif.mensaje}</p>
                      {notif.descripcion && (
                        <p className="my-1 text-xs leading-[1.3] text-slate-500 tablet:text-[13px]">{notif.descripcion}</p>
                      )}
                      <span className="text-[11px] uppercase text-slate-400">
                        {new Date(notif.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  userRole: PropTypes.string.isRequired
};

export default NotificationBell;
