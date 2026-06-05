import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  FaBan,
  FaBullhorn,
  FaCalendar,
  FaChartBar,
  FaCog,
  FaDollarSign,
  FaDumbbell,
} from 'react-icons/fa';
import { useUserProfile } from '../../../auth-profile';
import { AnunciosManager } from '../../../announcements';
import { AsistenciasManager } from '../../../attendance';
import { PagosManager } from '../../../payments';
import { ProfileSettings } from '../../../account-admin';
import { TestsFisicosManager } from '../../../physical-tests';
import { UserManagementPanel } from '../../../user-management';
import TrainerDashboard from './TrainerDashboard';
import { RolePanelLayout, iconRegistry, semanticCatalog } from '../../../../shared/ui';

const TrainerPanel = ({ user }) => {
  const { profile, loading } = useUserProfile(user);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const UsersIcon = iconRegistry.users;
  const TrainerIcon = iconRegistry.trainer;

  const menuItems = useMemo(() => [
    { id: 'dashboard', icon: <FaChartBar />, label: semanticCatalog.UI_LABELS.dashboard, description: 'Resumen general' },
    { id: 'usuarios', icon: <UsersIcon />, label: semanticCatalog.UI_LABELS.usersManagementTitle, description: 'Administrar estudiantes' },
    { id: 'asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Registrar asistencias' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Fisicos', description: 'Evaluaciones fisicas' },
    { id: 'pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Registrar pagos' },
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
    { id: 'configuracion', icon: <FaCog />, label: 'Configuracion', description: 'Perfil y seguridad' },
  ], []);

  const validSections = useMemo(() => new Set(menuItems.map((item) => item.id)), [menuItems]);
  const sectionAliasMap = useMemo(() => ({
    atletas: 'usuarios',
  }), []);

  useEffect(() => {
    const requestedSection = new URLSearchParams(location.search).get('section');
    if (!requestedSection) return;
    const normalizedSection = sectionAliasMap[requestedSection] || requestedSection;
    if (validSections.has(normalizedSection)) {
      setActiveSection(normalizedSection);
    }
  }, [location.search, sectionAliasMap, validSections]);

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
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700"><FaBan /> Acceso denegado</h2>
        <p className="mt-3 text-slate-700">Solo los entrenadores pueden acceder a este panel.</p>
        <p className="mt-1 text-slate-700">
          Tu rol actual: <strong>{profile?.role || 'Sin rol'}</strong>
        </p>
      </div>
    );
  }

  const handleNavigateToSection = (sectionId) => {
    const normalizedSection = sectionAliasMap[sectionId] || sectionId;
    if (!validSections.has(normalizedSection)) return;
    setActiveSection(normalizedSection);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <TrainerDashboard user={user} onNavigateToSection={handleNavigateToSection} />;
      case 'usuarios':
        return <UserManagementPanel user={user} userRole="entrenador" />;
      case 'asistencias':
        return <AsistenciasManager user={user} />;
      case 'tests-fisicos':
        return <TestsFisicosManager user={user} />;
      case 'pagos':
        return <PagosManager user={user} />;
      case 'anuncios':
        return <AnunciosManager user={user} />;
      case 'configuracion':
        return <ProfileSettings user={user} />;
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
      avatarIcon={<TrainerIcon />}
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      topBar={(
        <div className="text-sm text-slate-200 mobile:text-base">
          <span className="font-semibold text-white">{semanticCatalog.PANEL_LABELS.trainer}</span>
          <span className="mx-2 text-rv-gold/70">&gt;</span>
          <span>{menuItems.find((item) => item.id === activeSection)?.label}</span>
        </div>
      )}
    >
      {renderActiveSection()}
    </RolePanelLayout>
  );
};

TrainerPanel.propTypes = {
  user: PropTypes.object.isRequired,
};

export default TrainerPanel;
