// src/components/trainer/TrainerPanel.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useUserProfile } from '../../hooks/useUserProfile';
import TrainerDashboard from './TrainerDashboard';
import TrainerAtletasManager from './TrainerAtletasManager';
import TrainerAsistenciasManager from './TrainerAsistenciasManager';
import TrainerTestsFisicosManager from './TrainerTestsFisicosManager';
import TrainerPagosManager from './TrainerPagosManager';
import TrainerProfileSettings from './TrainerProfileSettings';
import { FaVolleyballBall, FaChartBar, FaCalendar, FaDumbbell, FaDollarSign, FaBullhorn, FaCog, FaBan, FaUserCircle } from 'react-icons/fa';
import AnunciosManager from '../admin/AnunciosManager';
import styles from '../../styles/TrainerPanel.module.css';

const TrainerPanel = ({ user }) => {
  const { profile, loading } = useUserProfile(user);
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando panel del entrenador...</p>
      </div>
    );
  }

  const isTrainer = profile?.role === 'entrenador';
  
  if (!isTrainer) {
    return (
      <div className={styles.accessDenied}>
        <h2><FaBan style={{ marginRight: '10px', verticalAlign: 'middle' }} />Acceso Denegado</h2>
        <p>Solo los entrenadores pueden acceder a este panel.</p>
        <p>Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong></p>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: 'Dashboard', description: 'Resumen general' },
    { id: 'atletas', icon: <FaVolleyballBall />, label: 'Atletas', description: 'Gestionar deportistas' },
    { id: 'asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Registrar asistencias' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Físicos', description: 'Evaluaciones físicas' },
    { id: 'pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Registrar pagos' },
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
    { id: 'configuracion', icon: <FaCog />, label: 'Configuración', description: 'Perfil y seguridad' }
  ];

  const handleNavigateToSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <TrainerDashboard user={user} onNavigateToSection={handleNavigateToSection} />;
      case 'atletas':
        return <TrainerAtletasManager user={user} />;
      case 'asistencias':
        return <TrainerAsistenciasManager user={user} />;
      case 'tests-fisicos':
        return <TrainerTestsFisicosManager user={user} />;
      case 'pagos':
        return <TrainerPagosManager user={user} />;
      case 'anuncios':
        return <AnunciosManager user={user} />;
      case 'configuracion':
        return <TrainerProfileSettings user={user} />;
      default:
        return <TrainerDashboard user={user} onNavigateToSection={handleNavigateToSection} />;
    }
  };

  return (
    <div className={styles.trainerPanel}>
      <div className={styles.mainContainer}>
        {/* Sidebar Navigation */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.userAvatar}>
              <FaUserCircle />
            </div>
            <h3>{profile?.full_name || user?.email?.split('@')[0] || 'Entrenador'}</h3>
            <p className={styles.userRole}>Entrenador</p>
            <span className={styles.trainerBadge}>ENTRENADOR</span>
          </div>
          
          <div className={styles.menu}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${activeSection === item.id ? styles.active : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <div className={styles.menuText}>
                  <span className={styles.menuLabel}>{item.label}</span>
                  <span className={styles.menuDescription}>{item.description}</span>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.contentBody}>
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

TrainerPanel.propTypes = {
  user: PropTypes.object.isRequired
};

export default TrainerPanel;
