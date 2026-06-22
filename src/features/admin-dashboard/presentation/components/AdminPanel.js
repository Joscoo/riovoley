import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  FaBan,
  FaBullhorn,
  FaCalendar,
  FaChartBar,
  FaClock,
  FaCog,
  FaDollarSign,
  FaDumbbell,
  FaTrophy,
} from 'react-icons/fa';
import { useUserProfile } from '../../../auth-profile';
import { AnunciosManager } from '../../../announcements';
import { AsistenciasManager } from '../../../attendance';
import { HorariosManager } from '../../../schedules';
import { PagosManager } from '../../../payments';
import { ProfileSettings } from '../../../account-admin';
import { TestsFisicosManager } from '../../../physical-tests';
import { UserManagementPanel } from '../../../user-management';
import { GamificationAdminPanel } from '../../../gamification';
import Dashboard from './Dashboard';
import FinancialReview from './FinancialReview';
import ReportsCenter from './ReportsCenter';
import { RolePanelLayout, iconRegistry, semanticCatalog, LoadingSpinner, EmptyState } from '../../../../shared/ui';

const AdminPanel = ({ user }) => {
  const { profile, isAdmin, loading } = useUserProfile(user);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const UsersIcon = iconRegistry.users;
  const AdminIcon = iconRegistry.administrator;

  const menuItems = useMemo(() => [
    { id: 'dashboard', icon: <FaChartBar />, label: semanticCatalog.UI_LABELS.dashboard, description: 'Resumen y estadisticas' },
    { id: 'reportes', icon: <FaChartBar />, label: 'Reportes', description: 'Asistencias, financieros y exportes' },
    { id: 'revision-financiera', icon: <FaDollarSign />, label: 'Revision Financiera', description: 'Mensualidades vencidas, asistencias e ingresos' },
    { id: 'usuarios', icon: <UsersIcon />, label: semanticCatalog.UI_LABELS.usersManagementTitle, description: 'Estudiantes, entrenadores y administradores' },
    { id: 'pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Mensualidades y facturacion' },
    { id: 'asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Control de entrenamientos' },
    { id: 'horarios', icon: <FaClock />, label: 'Horarios', description: 'Gestion de horarios de entrenamientos' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Fisicos', description: 'Evaluaciones fisicas' },
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
    { id: 'gamificacion', icon: <FaTrophy />, label: 'Gamificación', description: 'Tienda, logros y metas' },
    { id: 'configuracion', icon: <FaCog />, label: 'Configuracion', description: 'Perfil y seguridad' },
  ], []);

  const validSections = useMemo(() => new Set(menuItems.map((item) => item.id)), [menuItems]);
  const sectionAliasMap = useMemo(() => ({
    reportes: 'reportes',
    atletas: 'usuarios',
    finanzas: 'revision-financiera',
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
      <div className="flex min-h-[60dvh] items-center justify-center">
        <LoadingSpinner message="Cargando panel de administración..." />
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center px-4">
        <EmptyState
          icon={<FaBan className="text-red-500" />}
          title="Acceso Denegado"
          description={`Solo los administradores pueden acceder a este panel. Tu rol actual es: ${profile?.role || 'Sin rol'}.`}
        />
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
        return <Dashboard user={user} onNavigateToSection={handleNavigateToSection} />;
      case 'usuarios':
        return <UserManagementPanel user={user} userRole="administrador" />;
      case 'reportes':
        return <ReportsCenter />;
      case 'revision-financiera':
        return <FinancialReview />;
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
      case 'gamificacion':
        return <GamificationAdminPanel />;
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
