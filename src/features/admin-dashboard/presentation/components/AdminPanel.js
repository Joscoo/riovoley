import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  FaBan,
  FaBookOpen,
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
import {
  RolePanelLayout,
  iconRegistry,
  semanticCatalog,
  LoadingSpinner,
  EmptyState,
  Button,
  PanelUserGuide,
  PANEL_GUIDE_STEPS,
  shouldAutoOpenPanelGuide,
  markPanelGuideDismissed,
  markPanelGuideCompleted
} from '../../../../shared/ui';

const AdminPanel = ({ user }) => {
  const { profile, isAdmin, loading } = useUserProfile(user);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideChecked, setGuideChecked] = useState(false);
  const UsersIcon = iconRegistry.users;
  const AdminIcon = iconRegistry.administrator;

  const menuItems = useMemo(() => [
    { id: 'dashboard', guideId: 'admin-menu-dashboard', icon: <FaChartBar />, label: semanticCatalog.UI_LABELS.dashboard, description: 'Resumen y estadisticas' },
    { id: 'reportes', guideId: 'admin-menu-reportes', icon: <FaChartBar />, label: 'Reportes', description: 'Asistencias, financieros y exportes' },
    { id: 'revision-financiera', guideId: 'admin-menu-revision-financiera', icon: <FaDollarSign />, label: 'Revision Financiera', description: 'Mensualidades vencidas, asistencias e ingresos' },
    { id: 'usuarios', guideId: 'admin-menu-usuarios', icon: <UsersIcon />, label: semanticCatalog.UI_LABELS.usersManagementTitle, description: 'Estudiantes, entrenadores y administradores' },
    { id: 'pagos', guideId: 'admin-menu-pagos', icon: <FaDollarSign />, label: 'Pagos', description: 'Mensualidades y facturacion' },
    { id: 'asistencias', guideId: 'admin-menu-asistencias', icon: <FaCalendar />, label: 'Asistencias', description: 'Control de entrenamientos' },
    { id: 'horarios', guideId: 'admin-menu-horarios', icon: <FaClock />, label: 'Horarios', description: 'Gestion de horarios de entrenamientos' },
    { id: 'tests-fisicos', guideId: 'admin-menu-tests-fisicos', icon: <FaDumbbell />, label: 'Tests Fisicos', description: 'Evaluaciones fisicas' },
    { id: 'anuncios', guideId: 'admin-menu-anuncios', icon: <FaBullhorn />, label: 'Anuncios', description: 'Comunicados y notificaciones' },
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

  useEffect(() => {
    if (loading || !isAdmin() || guideChecked) {
      return;
    }

    setGuideChecked(true);
    if (shouldAutoOpenPanelGuide('admin')) {
      setGuideOpen(true);
    }
  }, [guideChecked, isAdmin, loading]);

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

  const handleGuideSkip = () => {
    markPanelGuideDismissed('admin');
    setGuideOpen(false);
  };

  const handleGuideComplete = () => {
    markPanelGuideCompleted('admin');
    setGuideOpen(false);
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
        <div className="flex flex-col gap-3 mobile:flex-row mobile:items-center mobile:justify-between">
          <div className="text-sm text-slate-200 mobile:text-base">
            <span className="font-semibold text-white">{semanticCatalog.PANEL_LABELS.admin}</span>
            <span className="mx-2 text-rv-gold/70">&gt;</span>
            <span>{menuItems.find((item) => item.id === activeSection)?.label}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setGuideOpen(true)}>
            <FaBookOpen className="mr-2" />
            Guia del panel
          </Button>
        </div>
      )}
    >
      {renderActiveSection()}
      <PanelUserGuide
        open={guideOpen}
        role="admin"
        panelLabel={semanticCatalog.PANEL_LABELS.admin}
        steps={PANEL_GUIDE_STEPS.admin}
        onClose={handleGuideSkip}
        onComplete={handleGuideComplete}
        onSectionChange={handleNavigateToSection}
      />
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
