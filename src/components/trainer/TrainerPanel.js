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
        <h2>🚫 Acceso Denegado</h2>
        <p>Solo los entrenadores pueden acceder a este panel.</p>
        <p>Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong></p>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Resumen general' },
    { id: 'atletas', icon: '🏐', label: 'Atletas', description: 'Gestionar deportistas' },
    { id: 'asistencias', icon: '📅', label: 'Asistencias', description: 'Registrar asistencias' },
    { id: 'tests-fisicos', icon: '🏋️', label: 'Tests Físicos', description: 'Evaluaciones físicas' },
    { id: 'pagos', icon: '💰', label: 'Pagos', description: 'Registrar pagos' },
    { id: 'configuracion', icon: '⚙️', label: 'Configuración', description: 'Perfil y seguridad' }
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
      case 'configuracion':
        return <TrainerProfileSettings user={user} />;
      default:
        return <TrainerDashboard user={user} onNavigateToSection={handleNavigateToSection} />;
    }
  };

  return (
    <div className={styles.trainerPanel}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.welcomeSection}>
            <h1>🏐 Panel del Entrenador</h1>
            <p>Bienvenido, <strong>{profile?.full_name || user?.email}</strong></p>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.trainerBadge}>ENTRENADOR</span>
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {/* Sidebar Navigation */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>🏐 RioVoley</h3>
          </div>
          
          <ul className={styles.menuList}>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.menuItem} ${activeSection === item.id ? styles.active : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className={styles.menuIcon}>{item.icon}</span>
                  <div className={styles.menuText}>
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={styles.menuDescription}>{item.description}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className={styles.content}>
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
};

TrainerPanel.propTypes = {
  user: PropTypes.object.isRequired
};

export default TrainerPanel;
