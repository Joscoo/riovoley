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
import AnunciosManager from './AnunciosManager';
import HorariosManager from './HorariosManager';
import RoleSidebar from '../layout/RoleSidebar';
import styles from '../../styles/AdminPanel.module.css';
import { FaChartBar, FaVolleyballBall, FaChalkboardTeacher, FaDollarSign, FaCalendar, FaDumbbell, FaUsers, FaBullhorn, FaCog, FaBan, FaUser, FaClock } from 'react-icons/fa';

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
        <h2><FaBan style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Acceso Denegado</h2>
        <p>Solo los administradores pueden acceder a este panel.</p>
        <p>Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong></p>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: 'Dashboard', description: 'Resumen y estadísticas' },
    { id: 'atletas', icon: <FaVolleyballBall />, label: 'Atletas', description: 'Gestionar deportistas' },
    { id: 'entrenadores', icon: <FaChalkboardTeacher />, label: 'Entrenadores', description: 'Gestionar entrenadores' },
    { id: 'pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Mensualidades y facturación' },
    { id: 'asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Control de entrenamientos' },
    { id: 'horarios', icon: <FaClock />, label: 'Horarios', description: 'Gestión de horarios de entrenamientos' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Físicos', description: 'Evaluaciones físicas' },
    { id: 'usuarios', icon: <FaUsers />, label: 'Usuarios', description: 'Gestión de usuarios y roles' },
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
    { id: 'configuracion', icon: <FaCog />, label: 'Configuración', description: 'Perfil y seguridad' }
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
      case 'horarios':
        return <HorariosManager user={user} />;
      case 'tests-fisicos':
        return <TestsFisicosManager user={user} />;
      case 'usuarios':
        return <UsuariosManager user={user} />;
      case 'anuncios':
        return <AnunciosManager user={user} />;
      case 'configuracion':
        return <ProfileSettings user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className={styles.adminPanel}>
      <div className={styles.mainContainer}>
        <RoleSidebar
          variant="admin"
          title={profile?.full_name || user?.email || 'Administrador'}
          roleLabel="Administrador"
          badgeLabel="ADMINISTRADOR"
          avatarIcon={<FaUser />}
          menuItems={menuItems}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

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