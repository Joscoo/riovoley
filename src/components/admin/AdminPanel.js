// src/components/admin/AdminPanel.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useUserProfile } from '../../hooks/useUserProfile';
import Dashboard from './Dashboard';
import AtletasManager from './AtletasManager';
import PagosManager from './PagosManager';
import AsistenciasManager from './AsistenciasManager';
import TestsFisicosManager from './TestsFisicosManager';
import UsuariosManager from './UsuariosManager';
import EntrenadoresManager from './EntrenadoresManager';
import ProfileSettings from './ProfileSettings';
import styles from '../../styles/AdminPanel.module.css';

const AdminPanel = ({ user }) => {
  const { profile, isAdmin, loading } = useUserProfile(user);
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className={styles.accessDenied}>
        <h2>🚫 Acceso Denegado</h2>
        <p>Solo los administradores pueden acceder a este panel.</p>
        <p>Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong></p>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', description: 'Resumen y estadísticas' },
    { id: 'atletas', icon: '🏐', label: 'Atletas', description: 'Gestionar deportistas' },
    { id: 'entrenadores', icon: '👨‍🏫', label: 'Entrenadores', description: 'Gestionar entrenadores' },
    { id: 'pagos', icon: '💰', label: 'Pagos', description: 'Mensualidades y facturación' },
    { id: 'asistencias', icon: '📅', label: 'Asistencias', description: 'Control de entrenamientos' },
    { id: 'tests-fisicos', icon: '🏋️', label: 'Tests Físicos', description: 'Evaluaciones físicas' },
    { id: 'usuarios', icon: '👥', label: 'Usuarios', description: 'Gestión de usuarios y roles' },
    { id: 'configuracion', icon: '⚙️', label: 'Configuración', description: 'Perfil y seguridad' }
  ];

  const handleNavigateToSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard user={user} onNavigateToSection={handleNavigateToSection} />;
      case 'atletas':
        return <AtletasManager user={user} />;
      case 'entrenadores':
        return <EntrenadoresManager user={user} />;
      case 'pagos':
        return <PagosManager user={user} />;
      case 'asistencias':
        return <AsistenciasManager user={user} />;
      case 'tests-fisicos':
        return <TestsFisicosManager user={user} />;
      case 'usuarios':
        return <UsuariosManager user={user} />;
      case 'configuracion':
        return <ProfileSettings user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className={styles.adminPanel}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.welcomeSection}>
            <h1>🔴 Panel de Administración</h1>
            <p>Bienvenido, <strong>{profile?.full_name || user?.email}</strong></p>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.adminBadge}>ADMINISTRADOR</span>
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        {/* Sidebar Navigation */}
        <nav className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>🏐 RioVoley Admin</h3>
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

          <div className={styles.sidebarFooter}>
            <div className={styles.quickStats}>
              <h4>📈 Resumen Rápido</h4>
              <div className={styles.statItem}>
                <span>👥 Atletas Activos</span>
                <span className={styles.statValue}>--</span>
              </div>
              <div className={styles.statItem}>
                <span>💰 Ingresos del Mes</span>
                <span className={styles.statValue}>--</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.contentHeader}>
            <div className={styles.breadcrumb}>
              <span>Panel Admin</span>
              <span className={styles.separator}>›</span>
              <span>{menuItems.find(item => item.id === activeSection)?.label}</span>
            </div>
          </div>
          
          <div className={styles.contentBody}>
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

AdminPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string
  })
};

export default AdminPanel;