// src/components/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/Dashboard.module.css';
import { FaUsers, FaDollarSign, FaExclamationTriangle, FaChartBar, FaRunning, FaClipboardList, FaBolt, FaUserPlus, FaCreditCard, FaUsersCog, FaCheckCircle, FaVolleyballBall } from 'react-icons/fa';

// Componente StatCard separado para evitar problemas de lint
const StatCard = ({ title, value, icon, color, subtitle, loading }) => (
  <div className={styles.statCard} style={{ borderLeftColor: color }}>
    <div className={styles.statHeader}>
      <div className={styles.statInfo}>
        <h3>{title}</h3>
        <div className={styles.statValue}>{loading ? '...' : value}</div>
        {subtitle && <p className={styles.statSubtitle}>{subtitle}</p>}
      </div>
      <div className={styles.statIcon} style={{ color }}>
        {icon}
      </div>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  loading: PropTypes.bool
};

const Dashboard = ({ user, onNavigateToSection }) => {
  const [stats, setStats] = useState({
    totalAtletas: 0,
    ingresosDelMes: 0,
    pagosVencidos: 0,
    asistenciasHoy: 0,
    atletasActivos: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [categoriesStats, setCategoriesStats] = useState({
    iniciacion_hombres: 0,
    iniciacion_mujeres: 0,
    perfeccionamiento_mujeres: 0,
    perfeccionamiento_hombres: 0,
    master_mujeres: 0,
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      // Cargar estadísticas en paralelo
      const [
        atletasData,
        pagosData,
        asistenciasData
      ] = await Promise.all([
        loadAtletasStats(),
        loadPagosStats(),
        loadAsistenciasStats(),
        loadCategoriesStats()
      ]);

      setStats({
        totalAtletas: atletasData.total || 0,
        atletasActivos: atletasData.activos || 0,
        ingresosDelMes: pagosData.ingresos || 0,
        pagosVencidos: pagosData.vencidos || 0,
        asistenciasHoy: asistenciasData.hoy || 0,
        loading: false
      });

      // Cargar actividad reciente
      await loadRecentActivity();

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const loadAtletasStats = async () => {
    try {
      // Total de atletas registrados
      const { count: total } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Para atletas "activos", contar los que tienen al menos un pago activo
      // Primero obtenemos todos los atletas que tienen pagos con estado activo
      const { data: activePayers } = await supabase
        .from('payments')
        .select('student_id')
        .eq('estado', 'activo');

      // Contar atletas únicos con pagos activos
      const uniqueActiveStudents = new Set(activePayers?.map(p => p.student_id));
      const activos = uniqueActiveStudents.size;

      return { total: total || 0, activos: activos || 0 };
    } catch (error) {
      console.error('Error cargando stats de atletas:', error);
      return { total: 0, activos: 0 };
    }
  };

  const loadPagosStats = async () => {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Ingresos del mes actual - solo pagos que tienen fecha_pago (han sido pagados)
      const { data: pagosDelMes } = await supabase
        .from('payments')
        .select('monto')
        .not('fecha_pago', 'is', null)
        .gte('fecha_pago', firstDayOfMonth.toISOString().split('T')[0])
        .lte('fecha_pago', lastDayOfMonth.toISOString().split('T')[0]);

      const ingresos = pagosDelMes?.reduce((sum, pago) => sum + (pago.monto || 0), 0) || 0;

      // Pagos vencidos
      const { count: vencidos } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'vencido');

      return { ingresos, vencidos: vencidos || 0 };
    } catch (error) {
      console.error('Error cargando stats de pagos:', error);
      return { ingresos: 0, vencidos: 0 };
    }
  };

  const loadAsistenciasStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { count: hoy } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today);

      return { hoy: hoy || 0 };
    } catch (error) {
      console.error('Error cargando stats de asistencias:', error);
      return { hoy: 0 };
    }
  };

  const loadCategoriesStats = async () => {
    try {
      // Cargar todos los estudiantes activos (todos los que existen se consideran activos)
      const { data: students } = await supabase
        .from('students')
        .select('categoria');

      const categoryCounts = {
        iniciacion_hombres: students?.filter(s => s.categoria === 'iniciacion_hombres')?.length || 0,
        iniciacion_mujeres: students?.filter(s => s.categoria === 'iniciacion_mujeres')?.length || 0,
        perfeccionamiento_mujeres: students?.filter(s => s.categoria === 'perfeccionamiento_mujeres')?.length || 0,
        perfeccionamiento_hombres: students?.filter(s => s.categoria === 'perfeccionamiento_hombres')?.length || 0,
        master_mujeres: students?.filter(s => s.categoria === 'master_mujeres')?.length || 0,
        loading: false
      };

      setCategoriesStats(categoryCounts);
    } catch (error) {
      console.error('Error cargando stats de categorías:', error);
      setCategoriesStats(prev => ({ ...prev, loading: false }));
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Cargar actividad reciente de diferentes fuentes
      const [
        { data: asistencias },
        { data: pagosRecientes }
      ] = await Promise.all([
        // Últimas 3 asistencias
        supabase
          .from('attendances')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(3),
        
        // Últimos 2 pagos registrados
        supabase
          .from('payments')
          .select('*')
          .not('fecha_pago', 'is', null)
          .order('fecha_pago', { ascending: false })
          .limit(2)
      ]);

      const activity = [];

      // Procesar asistencias con datos de estudiantes
      if (asistencias?.length > 0) {
        for (const [index, asistencia] of asistencias.entries()) {
          try {
            const { data: student } = await supabase
              .from('students')
              .select(`
                id,
                users!inner(nombre, apellido)
              `)
              .eq('id', asistencia.student_id)
              .single();

            activity.push({
              id: asistencia.id || `asistencia-${index}`,
              tipo: 'asistencia',
              descripcion: `${student?.users?.nombre} ${student?.users?.apellido} asistió al entrenamiento`,
              fecha: new Date(asistencia.fecha).toLocaleDateString(),
              icono: <FaCheckCircle style={{ color: '#28a745' }} />
            });
          } catch (err) {
            console.error('Error cargando datos de estudiante:', err);
          }
        }
      }

      // Procesar pagos recientes con datos de estudiantes
      if (pagosRecientes?.length > 0) {
        for (const [index, pago] of pagosRecientes.entries()) {
          try {
            const { data: student } = await supabase
              .from('students')
              .select(`
                id,
                users!inner(nombre, apellido)
              `)
              .eq('id', pago.student_id)
              .single();

            activity.push({
              id: pago.id || `pago-${index}`,
              tipo: 'pago',
              descripcion: `${student?.users?.nombre} ${student?.users?.apellido} realizó un pago de $${pago.monto}`,
              fecha: new Date(pago.fecha_pago).toLocaleDateString(),
              icono: <FaDollarSign style={{ color: '#17a2b8' }} />
            });
          } catch (err) {
            console.error('Error cargando datos de estudiante para pago:', err);
          }
        }
      }

      // Si no hay actividad, mostrar mensaje informativo
      if (activity.length === 0) {
        activity.push({
          id: 'no-activity',
          tipo: 'info',
          descripcion: 'No hay actividad reciente registrada',
          fecha: 'Hoy',
          icono: <FaClipboardList style={{ color: '#6c757d' }} />
        });
      }

      setRecentActivity(activity.slice(0, 5)); // Limitar a 5 elementos
    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
    }
  };



  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h2><FaChartBar style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Dashboard - Resumen General</h2>
        <p>Vista general de RioVoley Club</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Atletas"
          value={stats.totalAtletas}
          icon={<FaUsers />}
          color="#28a745"
          subtitle="Registrados en el sistema"
          loading={stats.loading}
        />
        
        <StatCard
          title="Ingresos del Mes"
          value={`$${stats.ingresosDelMes.toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={<FaDollarSign />}
          color="#17a2b8"
          subtitle="Pagos recibidos este mes"
          loading={stats.loading}
        />
        
        <StatCard
          title="Pagos Vencidos"
          value={stats.pagosVencidos}
          icon={<FaExclamationTriangle />}
          color={stats.pagosVencidos > 0 ? "#dc3545" : "#ffc107"}
          subtitle={stats.pagosVencidos > 0 ? "Requieren seguimiento" : "Todo al día"}
          loading={stats.loading}
        />
        
        <StatCard
          title="Atletas Activos"
          value={stats.atletasActivos}
          icon={<FaRunning />}
          color="#28a745"
          subtitle={`${stats.atletasActivos} de ${stats.totalAtletas} con pagos activos`}
          loading={stats.loading}
        />
      </div>

      <div className={styles.dashboardContent}>
        {/* Actividad Reciente */}
        <div className={styles.activitySection}>
          <h3><FaClipboardList style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Actividad Reciente</h3>
          <div className={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <span className={styles.activityIcon}>{activity.icono}</span>
                  <div className={styles.activityInfo}>
                    <p>{activity.descripcion}</p>
                    <span className={styles.activityDate}>{activity.fecha}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noActivity}>No hay actividad reciente</p>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className={styles.quickActions}>
          <h3><FaBolt style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Acciones Rápidas</h3>
          <div className={styles.actionButtons}>
            <button 
              className={styles.actionButton}
              onClick={() => onNavigateToSection('atletas')}
            >
              <span><FaUserPlus /></span>
              <div>
                <strong>Agregar Atleta</strong>
                <p>Registrar nuevo deportista</p>
              </div>
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={() => onNavigateToSection('pagos')}
            >
              <span><FaCreditCard /></span>
              <div>
                <strong>Registrar Pago</strong>
                <p>Nueva mensualidad</p>
              </div>
            </button>

            <button 
              className={styles.actionButton}
              onClick={() => onNavigateToSection('usuarios')}
            >
              <span><FaUsersCog /></span>
              <div>
                <strong>Gestionar Usuarios</strong>
                <p>Roles y permisos</p>
              </div>
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={() => onNavigateToSection('reportes')}
            >
              <span><FaChartBar /></span>
              <div>
                <strong>Ver Reportes</strong>
                <p>Estadísticas detalladas</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Resumen por Categorías */}
      <div className={styles.categoriesOverview}>
        <h3><FaVolleyballBall style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Resumen por Categorías</h3>
        <div className={styles.categoriesGrid}>
          <div className={styles.categoryCard}>
            <h4>Iniciación Hombres</h4>
            <p className={styles.categoryCount}>
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.iniciacion_hombres} atletas`}
            </p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Iniciación Mujeres</h4>
            <p className={styles.categoryCount}>
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.iniciacion_mujeres} atletas`}
            </p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Perfeccionamiento Mujeres</h4>
            <p className={styles.categoryCount}>
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.perfeccionamiento_mujeres} atletas`}
            </p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Perfeccionamiento Hombres</h4>
            <p className={styles.categoryCount}>
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.perfeccionamiento_hombres} atletas`}
            </p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Master Mujeres</h4>
            <p className={styles.categoryCount}>
              {categoriesStats.loading ? 'Cargando...' : `${categoriesStats.master_mujeres} atletas`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  user: PropTypes.object,
  onNavigateToSection: PropTypes.func.isRequired
};

export default Dashboard;