import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaBan,
  FaBullhorn,
  FaCalendar,
  FaChartBar,
  FaClock,
  FaCog,
  FaDollarSign,
  FaDumbbell,
} from 'react-icons/fa';
import { useUserProfile } from '../../../auth-profile';
import { AnunciosManager } from '../../../announcements';
import { AsistenciasManager } from '../../../attendance';
import { HorariosManager } from '../../../schedules';
import { PagosManager } from '../../../payments';
import { ProfileSettings } from '../../../account-admin';
import { TestsFisicosManager } from '../../../physical-tests';
import { UserManagementPanel } from '../../../user-management';
import Dashboard from './Dashboard';
import { RolePanelLayout, iconRegistry, semanticCatalog } from '../../../../shared/ui';

const AdminPanel = ({ user }) => {
  const { profile, isAdmin, loading } = useUserProfile(user);
  const [activeSection, setActiveSection] = useState('dashboard');
  const UsersIcon = iconRegistry.users;
  const AdminIcon = iconRegistry.administrator;

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-red-500" />
        <p className="text-sm font-semibold mobile:text-base">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700"><FaBan /> Acceso denegado</h2>
        <p className="mt-3 text-slate-700">Solo los administradores pueden acceder a este panel.</p>
        <p className="mt-1 text-slate-700">
          Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong>
        </p>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: <FaChartBar />, label: semanticCatalog.UI_LABELS.dashboard, description: 'Resumen y estadísticas' },
    { id: 'usuarios', icon: <UsersIcon />, label: semanticCatalog.UI_LABELS.usersManagementTitle, description: 'Estudiantes, entrenadores y administradores' },
    { id: 'pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Mensualidades y facturación' },
    { id: 'asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Control de entrenamientos' },
    { id: 'horarios', icon: <FaClock />, label: 'Horarios', description: 'Gestión de horarios de entrenamientos' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Físicos', description: 'Evaluaciones físicas' },
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
    { id: 'configuracion', icon: <FaCog />, label: 'Configuración', description: 'Perfil y seguridad' },
  ];

  const handleNavigateToSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard user={user} onNavigateToSection={handleNavigateToSection} />;
      case 'usuarios':
        return <UserManagementPanel user={user} userRole="administrador" />;
      case 'pagos':
        return <PagosManager user={user} />;
      case 'asistencias':
        return <AsistenciasManager user={user} />;
      case 'horarios':
        return <HorariosManager user={user} />;
      case 'tests-fisicos':
        return <TestsFisicosManager user={user} />;
      case 'anuncios':
        return <AnunciosManager user={user} />;
      case 'configuracion':
        return <ProfileSettings user={user} />;
      default:
        return <Dashboard user={user} onNavigateToSection={handleNavigateToSection} />;
    }
  };

  return (
    <RolePanelLayout
      variant="admin"
      title={profile?.full_name || user?.email || 'Administrador'}
      roleLabel="Administrador"
      badgeLabel="ADMINISTRADOR"
      avatarIcon={<AdminIcon />}
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      topBar={(
        <div className="text-sm text-slate-200 mobile:text-base">
          <span className="font-semibold text-white">{semanticCatalog.PANEL_LABELS.admin}</span>
          <span className="mx-2 text-rv-gold/70">&gt;</span>
          <span>{menuItems.find((item) => item.id === activeSection)?.label}</span>
        </div>
      )}
    >
      {renderActiveSection()}
    </RolePanelLayout>
  );
};

AdminPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
  }),
};

export default AdminPanel;
