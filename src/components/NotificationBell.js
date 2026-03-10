// src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';
import { getEcuadorDate, calcularDiferenciaDias } from '../utils/dateUtils';
import { FaBell, FaExclamationTriangle, FaBullhorn, FaInfoCircle } from 'react-icons/fa';
import styles from '../styles/NotificationBell.module.css';

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

      // Agrupar por atleta y obtener el último pago
      const ultimosPagos = new Map();
      (todosPagos || []).forEach(pago => {
        if (!ultimosPagos.has(pago.student_id)) {
          ultimosPagos.set(pago.student_id, pago);
        }
      });

      const notificacionesPagos = [];

      // Obtener información de estudiantes en una sola consulta
      const studentIds = Array.from(ultimosPagos.keys());
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
      for (const [studentId, pago] of ultimosPagos.entries()) {
        // Usar la función de dateUtils que maneja correctamente la zona horaria
        const diferenciaDias = calcularDiferenciaDias(pago.fecha_fin, hoy);

        if (diferenciaDias <= 5) {
          const estudiante = estudiantesMap.get(studentId);
          if (estudiante) {
            const nombreCompleto = `${estudiante.users.nombre} ${estudiante.users.apellido}`;
            const mensaje = generarMensajePago(diferenciaDias, nombreCompleto);
            const tipo = determinarTipoNotificacion(diferenciaDias);

            notificacionesPagos.push({
              id: `pago-${studentId}`,
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

  return (
    <div className={styles.notificationBell} ref={dropdownRef}>
      <button 
        className={styles.bellButton}
        onClick={toggleDropdown}
        aria-label="Notificaciones"
      >
        <FaBell className={styles.bellIcon} />
        {totalNotificaciones > 0 && (
          <span className={styles.badge}>{totalNotificaciones > 9 ? '9+' : totalNotificaciones}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h4>Notificaciones</h4>
            {totalNotificaciones > 0 && (
              <span className={styles.count}>{totalNotificaciones}</span>
            )}
          </div>

          <div className={styles.dropdownContent}>
            {loading && (
              <div className={styles.loading}>Cargando...</div>
            )}
            {!loading && totalNotificaciones === 0 && (
              <div className={styles.empty}>
                <FaInfoCircle />
                <p>No hay notificaciones</p>
              </div>
            )}
            {!loading && totalNotificaciones > 0 && (
              <ul className={styles.notificationList}>
                {notificaciones.map((notif) => (
                  <li 
                    key={notif.id} 
                    className={`${styles.notificationItem} ${styles[notif.tipo]}`}
                  >
                    <div className={styles.notifIcon}>
                      {getIcono(notif)}
                    </div>
                    <div className={styles.notifContent}>
                      <p className={styles.notifMensaje}>{notif.mensaje}</p>
                      {notif.descripcion && (
                        <p className={styles.notifDescripcion}>{notif.descripcion}</p>
                      )}
                      <span className={styles.notifFecha}>
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
