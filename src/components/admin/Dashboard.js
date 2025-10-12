// src/components/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import styles from '../../styles/Dashboard.module.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalAtletas: 0,
    ingresosDelMes: 0,
    pagosVencidos: 0,
    asistenciasHoy: 0,
    atletasActivos: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
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
        loadAsistenciasStats()
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
      // Total de atletas
      const { count: total } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Atletas con pagos activos (aproximación)
      const { count: activos } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

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

      // Ingresos del mes actual
      const { data: pagosDelMes } = await supabase
        .from('payments')
        .select('monto')
        .gte('fecha_pago', firstDayOfMonth.toISOString())
        .lte('fecha_pago', lastDayOfMonth.toISOString());

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
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today);

      return { hoy: hoy || 0 };
    } catch (error) {
      console.error('Error cargando stats de asistencias:', error);
      return { hoy: 0 };
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Últimas 5 asistencias
      const { data: asistencias } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(
            user:users(nombre, apellido)
          )
        `)
        .order('fecha', { ascending: false })
        .limit(5);

      const activity = asistencias?.map(asistencia => ({
        tipo: 'asistencia',
        descripcion: `${asistencia.student?.user?.nombre} ${asistencia.student?.user?.apellido} asistió al entrenamiento`,
        fecha: new Date(asistencia.fecha).toLocaleDateString(),
        icono: '✅'
      })) || [];

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className={styles.statCard} style={{ borderLeftColor: color }}>
      <div className={styles.statHeader}>
        <div className={styles.statInfo}>
          <h3>{title}</h3>
          <div className={styles.statValue}>{stats.loading ? '...' : value}</div>
          {subtitle && <p className={styles.statSubtitle}>{subtitle}</p>}
        </div>
        <div className={styles.statIcon} style={{ color }}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h2>📊 Dashboard - Resumen General</h2>
        <p>Vista general de RioVoley Club</p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Atletas"
          value={stats.totalAtletas}
          icon="👥"
          color="#28a745"
          subtitle="Registrados en el sistema"
        />
        
        <StatCard
          title="Ingresos del Mes"
          value={`$${stats.ingresosDelMes.toLocaleString()}`}
          icon="💰"
          color="#17a2b8"
          subtitle="Pagos recibidos este mes"
        />
        
        <StatCard
          title="Pagos Vencidos"
          value={stats.pagosVencidos}
          icon="⚠️"
          color="#ffc107"
          subtitle="Requieren seguimiento"
        />
        
        <StatCard
          title="Asistencias Hoy"
          value={stats.asistenciasHoy}
          icon="📅"
          color="#6f42c1"
          subtitle="Entrenamientos de hoy"
        />
      </div>

      <div className={styles.dashboardContent}>
        {/* Actividad Reciente */}
        <div className={styles.activitySection}>
          <h3>📋 Actividad Reciente</h3>
          <div className={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
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
          <h3>⚡ Acciones Rápidas</h3>
          <div className={styles.actionButtons}>
            <button className={styles.actionButton}>
              <span>👤</span>
              <div>
                <strong>Agregar Atleta</strong>
                <p>Registrar nuevo deportista</p>
              </div>
            </button>
            
            <button className={styles.actionButton}>
              <span>💳</span>
              <div>
                <strong>Registrar Pago</strong>
                <p>Nueva mensualidad</p>
              </div>
            </button>
            
            <button className={styles.actionButton}>
              <span>📊</span>
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
        <h3>🏐 Resumen por Categorías</h3>
        <div className={styles.categoriesGrid}>
          <div className={styles.categoryCard}>
            <h4>Iniciación Hombres</h4>
            <p className={styles.categoryCount}>-- atletas</p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Iniciación Mujeres</h4>
            <p className={styles.categoryCount}>-- atletas</p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Perfeccionamiento</h4>
            <p className={styles.categoryCount}>-- atletas</p>
          </div>
          <div className={styles.categoryCard}>
            <h4>Master</h4>
            <p className={styles.categoryCount}>-- atletas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;