// src/components/trainer/TrainerPanel.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaBan, FaBullhorn, FaCalendar, FaChartBar, FaCog, FaDollarSign, FaDumbbell, FaUserCircle, FaUsers } from 'react-icons/fa';
import { useUserProfile } from '../../hooks/useUserProfile';
import AnunciosManager from '../admin/AnunciosManager';
import RolePanelLayout from '../layout/RolePanelLayout';
import TrainerAsistenciasManager from './TrainerAsistenciasManager';
import TrainerDashboard from './TrainerDashboard';
import TrainerPagosManager from './TrainerPagosManager';
import TrainerProfileSettings from './TrainerProfileSettings';
import TrainerTestsFisicosManager from './TrainerTestsFisicosManager';
import UserManagementPanel from '../admin/UserManagement/UserManagementPanel';

const TrainerPanel = ({ user }) => {
  const { profile, loading } = useUserProfile(user);
  const [activeSection, setActiveSection] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-orange-500" />
        <p className="text-sm font-semibold mobile:text-base">Cargando panel del entrenador...</p>
      </div>
    );
  }

  const isTrainer = profile?.role === 'entrenador';

  if (!isTrainer) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700"><FaBan /> Acceso Denegado</h2>
        <p className="mt-3 text-slate-700">Solo los entrenadores pueden acceder a este panel.</p>
        <p className="mt-1 text-slate-700">
          Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong>
        </p>
      </div>
    );
  }

const menuItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: 'Dashboard', description: 'Resumen general' },
    { id: 'usuarios', icon: <FaUsers />, label: 'Gestion de Usuarios', description: 'Administrar atletas' },
    { id: 'asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Registrar asistencias' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Fisicos', description: 'Evaluaciones fisicas' },
    { id: 'pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Registrar pagos' },
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
    { id: 'configuracion', icon: <FaCog />, label: 'Configuracion', description: 'Perfil y seguridad' }
  ];

  const handleNavigateToSection = (sectionId) => {
    setActiveSection(sectionId);
  };

const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <TrainerDashboard user={user} onNavigateToSection={handleNavigateToSection} />;
      case 'usuarios':
        return <UserManagementPanel user={user} userRole="entrenador" />;
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
    <RolePanelLayout
      variant="trainer"
      title={profile?.full_name || user?.email?.split('@')[0] || 'Entrenador'}
      roleLabel="Entrenador"
      badgeLabel="ENTRENADOR"
      avatarIcon={<FaUserCircle />}
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      topBar={(
        <div className="text-sm text-slate-200 mobile:text-base">
          <span className="font-semibold text-white">Panel Entrenador</span>
          <span className="mx-2 text-rv-gold/70">›</span>
          <span>{menuItems.find((item) => item.id === activeSection)?.label}</span>
        </div>
      )}
    >
      {renderActiveSection()}
    </RolePanelLayout>
  );
};

TrainerPanel.propTypes = {
  user: PropTypes.object.isRequired
};

export default TrainerPanel;
