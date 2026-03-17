// src/components/admin/NotificacionesPagos.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { getEcuadorDate, calcularDiferenciaDias } from '../../utils/dateUtils';
import { getLatestPaymentsList } from '../../utils/paymentUtils';
import { FaBell, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import styles from '../../styles/NotificacionesPagos.module.css';

const NotificacionesPagos = ({ userRole }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodas, setMostrarTodas] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const calcularMensajeYTipo = (diferenciaDias, nombreCompleto) => {
    if (diferenciaDias < 0) {
      return {
        mensaje: `El período de ${nombreCompleto} venció hace ${Math.abs(diferenciaDias)} día(s)`,
        tipo: 'danger'
      };
    }
    if (diferenciaDias === 0) {
      return {
        mensaje: `El período de ${nombreCompleto} vence HOY`,
        tipo: 'danger'
      };
    }
    if (diferenciaDias === 1) {
      return {
        mensaje: `El período de ${nombreCompleto} vence MAÑANA`,
        tipo: 'warning'
      };
    }
    return {
      mensaje: `El período de ${nombreCompleto} vence en ${diferenciaDias} días`,
      tipo: 'info'
    };
  };

  const cargarNotificaciones = async () => {
    try {
      const hoy = getEcuadorDate();

      // Obtener todos los pagos no eliminados
      const { data: todosPagos, error: pagosError } = await supabase
        .from('payments')
        .select('student_id, fecha_fin, fecha_inicio')
        .is('deleted_at', null)
        .order('fecha_fin', { ascending: false });

      if (pagosError) throw pagosError;

      const ultimosPagos = getLatestPaymentsList(todosPagos || []);

      // Filtrar solo los que vencen pronto y obtener datos del atleta
      const notificacionesTemp = [];
      
      for (const pago of ultimosPagos) {
        if (!pago.fecha_fin) continue;

        const diferenciaDias = calcularDiferenciaDias(pago.fecha_fin, hoy);

        // Solo notificar si vence hoy, mañana o en los próximos 3 días, o ya venció
        if (diferenciaDias <= 3) {
          // Obtener información del estudiante
          const { data: estudiante, error: estudianteError } = await supabase
            .from('students')
            .select(`
              id,
              categoria,
              users!inner(nombre, apellido, email)
            `)
            .eq('id', pago.student_id)
            .single();

          if (!estudianteError && estudiante) {
            const nombreCompleto = `${estudiante.users.nombre} ${estudiante.users.apellido}`;
            const { mensaje, tipo } = calcularMensajeYTipo(diferenciaDias, nombreCompleto);

            notificacionesTemp.push({
              id: pago.student_id,
              mensaje,
              tipo,
              fecha_fin: pago.fecha_fin,
              diasRestantes: diferenciaDias,
              atleta: nombreCompleto,
              categoria: estudiante.categoria
            });
          }
        }
      }

      // Ordenar: primero los vencidos, luego por días restantes
      notificacionesTemp.sort((a, b) => a.diasRestantes - b.diasRestantes);

      setNotificaciones(notificacionesTemp);
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

  const notificacionesAMostrar = mostrarTodas ? notificaciones : notificaciones.slice(0, 5);

  if (loading) {
    return (
      <div className={styles.notificacionesContainer}>
        <div className={styles.header}>
          <FaBell className={styles.headerIcon} />
          <h3>Notificaciones de Pagos</h3>
        </div>
        <div className={styles.loading}>Cargando notificaciones...</div>
      </div>
    );
  }

  if (notificaciones.length === 0) {
    return (
      <div className={styles.notificacionesContainer}>
        <div className={styles.header}>
          <FaBell className={styles.headerIcon} />
          <h3>Notificaciones de Pagos</h3>
        </div>
        <div className={styles.sinNotificaciones}>
          <FaInfoCircle />
          <p>No hay notificaciones de períodos próximos a vencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.notificacionesContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FaBell className={styles.headerIcon} />
          <h3>Notificaciones de Pagos</h3>
          <span className={styles.badge}>{notificaciones.length}</span>
        </div>
        <button 
          onClick={() => setMostrarTodas(!mostrarTodas)}
          className={styles.toggleBtn}
        >
          {mostrarTodas ? 'Ver menos' : `Ver todas (${notificaciones.length})`}
        </button>
      </div>

      <div className={styles.notificacionesList}>
        {notificacionesAMostrar.map((notif) => (
          <div key={notif.id} className={`${styles.notificacion} ${styles[notif.tipo]}`}>
            <div className={styles.notifIcono}>
              {getIcono(notif.tipo)}
            </div>
            <div className={styles.notifContenido}>
              <p className={styles.notifMensaje}>{notif.mensaje}</p>
              <span className={styles.notifDetalles}>
                Categoría: {notif.categoria.replaceAll('_', ' ')} • Vence: {new Date(notif.fecha_fin).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

NotificacionesPagos.propTypes = {
  userRole: PropTypes.string.isRequired
};

export default NotificacionesPagos;
