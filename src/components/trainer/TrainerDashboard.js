// src/components/trainer/TrainerDashboard.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/TrainerDashboard.module.css';
import { getEcuadorDate, getEcuadorDateMinusDays, getEcuadorFirstDayOfMonth } from '../../utils/dateUtils';
import { FaVolleyballBall, FaDumbbell, FaChartBar, FaCalendar, FaDollarSign, FaBolt, FaPlus, FaCheckCircle, FaClipboardList, FaMoneyBillWave } from 'react-icons/fa';

const TrainerDashboard = ({ user, onNavigateToSection }) => {
  const [stats, setStats] = useState({
    totalAtletas: 0,
    asistenciasHoy: 0,
    testsPendientes: 0,
    pagosDelMes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Total de atletas
      const { count: atletasCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Asistencias de hoy
      const today = getEcuadorDate();
      const { count: asistenciasCount } = await supabase
        .from('attendances')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today);

      // Tests físicos (últimos 30 días)
      const thirtyDaysAgo = getEcuadorDateMinusDays(30);
      const { count: testsCount } = await supabase
        .from('physical_tests')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_test', thirtyDaysAgo);

      // Pagos del mes actual
      const firstDayOfMonth = getEcuadorFirstDayOfMonth();
      const { count: pagosCount } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_pago', firstDayOfMonth);

      setStats({
        totalAtletas: atletasCount || 0,
        asistenciasHoy: asistenciasCount || 0,
        testsPendientes: testsCount || 0,
        pagosDelMes: pagosCount || 0
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.welcome}>
        <h2><FaChartBar style={{ marginRight: '10px', verticalAlign: 'middle' }} />Dashboard del Entrenador</h2>
        <p>Resumen de tus actividades y atletas</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div 
          className={styles.statCard}
          onClick={() => onNavigateToSection('atletas')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statIcon}><FaVolleyballBall /></div>
          <div className={styles.statInfo}>
            <h3>{stats.totalAtletas}</h3>
            <p>Atletas Registrados</p>
          </div>
        </div>

        <div 
          className={styles.statCard}
          onClick={() => onNavigateToSection('asistencias')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statIcon}><FaCalendar /></div>
          <div className={styles.statInfo}>
            <h3>{stats.asistenciasHoy}</h3>
            <p>Asistencias Hoy</p>
          </div>
        </div>

        <div 
          className={styles.statCard}
          onClick={() => onNavigateToSection('tests-fisicos')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statIcon}><FaDumbbell /></div>
          <div className={styles.statInfo}>
            <h3>{stats.testsPendientes}</h3>
            <p>Tests (30 días)</p>
          </div>
        </div>

        <div 
          className={styles.statCard}
          onClick={() => onNavigateToSection('pagos')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.statIcon}><FaDollarSign /></div>
          <div className={styles.statInfo}>
            <h3>{stats.pagosDelMes}</h3>
            <p>Pagos del Mes</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3><FaBolt style={{ marginRight: '10px', verticalAlign: 'middle' }} />Acciones Rápidas</h3>
        <div className={styles.actionsGrid}>
          <button 
            className={styles.actionCard}
            onClick={() => onNavigateToSection('atletas')}
          >
            <span className={styles.actionIcon}><FaPlus /></span>
            <span>Registrar Atleta</span>
          </button>
          
          <button 
            className={styles.actionCard}
            onClick={() => onNavigateToSection('asistencias')}
          >
            <span className={styles.actionIcon}><FaCheckCircle /></span>
            <span>Tomar Asistencia</span>
          </button>
          
          <button 
            className={styles.actionCard}
            onClick={() => onNavigateToSection('tests-fisicos')}
          >
            <span className={styles.actionIcon}><FaClipboardList /></span>
            <span>Registrar Test</span>
          </button>
          
          <button 
            className={styles.actionCard}
            onClick={() => onNavigateToSection('pagos')}
          >
            <span className={styles.actionIcon}><FaMoneyBillWave /></span>
            <span>Registrar Pago</span>
          </button>
        </div>
      </div>
    </div>
  );
};

TrainerDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  onNavigateToSection: PropTypes.func.isRequired
};

export default TrainerDashboard;
