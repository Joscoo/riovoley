// src/features/student-dashboard/presentation/components/StudentPanel.js
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  FaBan,
  FaBookOpen,
  FaBullhorn,
  FaCalendar,
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaCog,
  FaDumbbell,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaStar,
  FaTimes,
  FaUserCircle
} from 'react-icons/fa';
import { useUserProfile } from '../../../auth-profile';
import {
  calcularDiferenciaDias,
  formatDateString,
  formatDateStringShort,
  getEcuadorDate
} from '../../../../utils/dateUtils';
import { studentDashboardService } from '../../studentDashboardService';
import IdentityPortrait from '../../../gamification/presentation/components/IdentityPortrait';
import {
  Button,
  Card,
  EmptyState,
  LoadingSpinner,
  RolePanelLayout,
  SectionHeader,
  StatusBadge,
  PanelUserGuide,
  PANEL_GUIDE_STEPS,
  shouldAutoOpenPanelGuide,
  markPanelGuideDismissed,
  markPanelGuideCompleted
} from '../../../../shared/ui';
import { cn } from '../../../../lib/cn';
import { formatCategoryLabel, formatStatusLabel } from '../../../../shared/lib/trainingCategoryFormatting';

const AnunciosViewer = lazy(() => import('../../../announcements/presentation/components/AnunciosViewer'));
const StudentPhysicalTests = lazy(() => import('./StudentPhysicalTests'));
const StudentProfileIdentityCard = lazy(() => import('./StudentProfileIdentityCard'));
const StudentGamificationPanel = lazy(() => import('../../../gamification/presentation/components/StudentGamificationPanel'));
const ProfileSettings = lazy(() => import('../../../account-admin/presentation/components/ProfileSettings'));
const STUDENT_ROLES = ['estudiante', 'usuario'];

const SectionFallback = () => (
  <div className="flex min-h-[45dvh] items-center justify-center">
    <LoadingSpinner message="Cargando seccion..." />
  </div>
);

const StudentPanel = ({ user }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('anuncios');
  const [studentData, setStudentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [physicalTests, setPhysicalTests] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const loadVersionRef = useRef(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideChecked, setGuideChecked] = useState(false);
  const { profile: userProfile, loading: profileLoading } = useUserProfile(user);

  const loadStudentData = useCallback(async (nextUserId = user?.id, { silent = false } = {}) => {
    if (!nextUserId) return;
    const version = ++loadVersionRef.current;
    if (!silent) {
      setLoading(true);
    }
    try {
      const panelData = await studentDashboardService.loadStudentPanelData(nextUserId);
      if (version !== loadVersionRef.current) return;
      setStudentData(panelData.studentData);
      setPaymentStatus(panelData.paymentStatus);
      setAttendanceStats(panelData.attendanceStats);
      setPhysicalTests(panelData.physicalTests || []);
      setGamification(panelData.gamification || null);
    } catch (error) {
      console.error('Error cargando datos del estudiante:', error);
    } finally {
      if (version === loadVersionRef.current) {
        setLoadedUserId(nextUserId);
        // Una petición silenciosa puede sustituir una recarga normal en curso.
        // La petición vigente debe liberar también ese indicador de carga.
        setLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (profileLoading) return undefined;
    if (user?.id && STUDENT_ROLES.includes(userProfile?.role?.toLowerCase())) {
      loadStudentData();
    } else {
      setStudentData(null);
      setPaymentStatus(null);
      setAttendanceStats(null);
      setPhysicalTests([]);
      setGamification(null);
      setLoadedUserId(null);
      setLoading(false);
    }
    return () => { loadVersionRef.current += 1; };
  }, [loadStudentData, profileLoading, user?.id, userProfile?.role]);

  useEffect(() => {
    const requestedSection = new URLSearchParams(location.search).get('section');
    if (!requestedSection) return;

    const sectionAliases = {
      pagos: 'mensualidad',
      configuracion: 'perfil',
    };
    const normalizedSection = sectionAliases[requestedSection] || requestedSection;
    const allowedSections = new Set(['anuncios', 'progreso', 'mensualidad', 'asistencias', 'tests-fisicos', 'perfil']);
    if (allowedSections.has(normalizedSection)) {
      setActiveSection(normalizedSection);
    }
  }, [location.search]);

  useEffect(() => {
    const userRole = userProfile?.role?.toLowerCase();
    const isStudentRole = ['estudiante', 'usuario'].includes(userRole);

    if (profileLoading || loading || !isStudentRole || guideChecked) {
      return;
    }

    setGuideChecked(true);
    if (shouldAutoOpenPanelGuide('student')) {
      setGuideOpen(true);
    }
  }, [guideChecked, loading, profileLoading, userProfile?.role]);

  useEffect(() => {
    if (!studentData?.id || !user?.id) {
      return undefined;
    }

    const refreshStudentPanel = (event) => {
      const refreshedStudentId = event?.detail?.studentId;

      if (refreshedStudentId && String(refreshedStudentId) !== String(studentData.id)) {
        return;
      }

      loadStudentData(user.id, { silent: true });
    };

    const unsubscribePaymentChanges = studentDashboardService.subscribeToPaymentChanges({
      studentId: studentData.id,
      onChange: refreshStudentPanel,
    });

    window.addEventListener('riovoley:dashboard-refresh', refreshStudentPanel);
    window.addEventListener('riovoley:payments-updated', refreshStudentPanel);

    return () => {
      unsubscribePaymentChanges?.();
      window.removeEventListener('riovoley:dashboard-refresh', refreshStudentPanel);
      window.removeEventListener('riovoley:payments-updated', refreshStudentPanel);
    };
  }, [loadStudentData, studentData?.id, user?.id]);

  const renderAnuncios = () => (
    <Card className="border-rv-gold/20 bg-black/30" padding="lg" data-guide-id="student-announcements-card">
      <SectionHeader
        title="Anuncios y Comunicados"
        subtitle="Mantente informado de las novedades del club."
        icon={<FaBullhorn />}
      />
      <div>
        <AnunciosViewer userRole="estudiantes" limit={null} showFilters />
      </div>
    </Card>
  );

  const getPaymentRemainingStatus = (payment) => {
    if (!payment?.fecha_fin) return null;
    const today = getEcuadorDate();
    const diffDays = calcularDiferenciaDias(payment.fecha_fin, today);

    if (diffDays < 0) {
      return { tone: 'danger', label: 'Vencido', icon: <FaExclamationTriangle className="mr-1" /> };
    }
    if (diffDays === 0) {
      return { tone: 'warning', label: 'Vence hoy', icon: <FaExclamationTriangle className="mr-1" /> };
    }
    if (diffDays === 1) {
      return { tone: 'warning', label: '1 dia restante', icon: <FaExclamationTriangle className="mr-1" /> };
    }
    if (diffDays <= 7) {
      return { tone: 'warning', label: `${diffDays} dias restantes`, icon: <FaClock className="mr-1" /> };
    }
    return { tone: 'success', label: `${diffDays} dias restantes`, icon: <FaClock className="mr-1" /> };
  };

  const getPaymentStateTone = (estado) => {
    const normalized = (estado || '').toLowerCase();
    if (['pagado', 'activo'].includes(normalized)) return 'success';
    if (normalized === 'pendiente') return 'warning';
    if (normalized === 'vencido') return 'danger';
    return 'info';
  };

  const renderPaymentStatus = () => {
    const currentPayment = paymentStatus?.payment;
    const remainingStatus = currentPayment ? getPaymentRemainingStatus(currentPayment) : null;
    const isAggregatedCoverage = Number(currentPayment?.coverage_payment_count || 0) > 1;

    return (
      <Card className="border-rv-gold/20 bg-black/30" padding="lg" data-guide-id="student-payment-card">
        <SectionHeader
          title="Estado de Mensualidad"
          subtitle="Revisa el periodo total cubierto por tus mensualidades registradas y el tiempo restante de esa cobertura."
          icon={<FaMoneyBillWave />}
        />

        {paymentStatus ? (
          <div className="space-y-4">
            <Card
              className={cn(
                'border-2 bg-black/35',
                paymentStatus.hasPaid ? 'border-emerald-300/45' : 'border-amber-300/45'
              )}
            >
              <div className="mb-5 text-center">
                <span
                  className={cn(
                    'mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full text-3xl',
                    paymentStatus.hasPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  )}
                >
                  {paymentStatus.hasPaid ? <FaCheckCircle /> : <FaExclamationTriangle />}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {paymentStatus.hasPaid ? (
                    <>
                      <FaStar className="mr-2 inline align-middle text-rv-gold" />
                      <span className="align-middle">Mensualidad Activa</span>
                    </>
                  ) : (
                    <>
                      <FaClock className="mr-2 inline align-middle text-amber-300" />
                      <span className="align-middle">Pago Pendiente</span>
                    </>
                  )}
                </h3>
                <p className="mt-1 text-sm text-slate-200 mobile:text-base">
                  {paymentStatus.hasPaid
                    ? `Tu pago esta al dia para ${paymentStatus.monthName}.`
                    : `Tienes un pago pendiente para ${paymentStatus.monthName}.`}
                </p>
              </div>

              {currentPayment ? (
                <div className="space-y-2 rounded-xl border border-white/15 bg-black/25 p-3 mobile:p-4">
                  <PaymentRow
                    icon={<FaCalendar />}
                    label={isAggregatedCoverage ? 'Periodo total cubierto' : 'Periodo de mensualidad'}
                    value={`${formatDateStringShort(currentPayment.fecha_inicio)} - ${formatDateStringShort(currentPayment.fecha_fin)}`}
                  />

                  {isAggregatedCoverage ? (
                    <PaymentRow
                      icon={<FaClipboardList />}
                      label="Mensualidades enlazadas"
                      value={`${currentPayment.coverage_payment_count} periodos registrados`}
                    />
                  ) : null}

                  {remainingStatus ? (
                    <PaymentRow
                      icon={<FaClock />}
                      label="Tiempo restante"
                      value={(
                        <StatusBadge tone={remainingStatus.tone}>
                          {remainingStatus.icon}
                          {remainingStatus.label}
                        </StatusBadge>
                      )}
                    />
                  ) : null}

                  <PaymentRow
                    icon={<FaMoneyBillWave />}
                    label={isAggregatedCoverage ? 'Monto total registrado' : 'Monto'}
                    value={<span className="font-black text-white">${currentPayment.coverage_total_amount || currentPayment.monto}</span>}
                  />

                  <PaymentRow
                    icon={<FaClipboardList />}
                    label="Estado"
                    value={(
                      <StatusBadge tone={getPaymentStateTone(currentPayment.latest_payment_status || currentPayment.estado)}>
                        {formatStatusLabel(currentPayment.latest_payment_status || currentPayment.estado)}
                      </StatusBadge>
                    )}
                  />

                  {(currentPayment.latest_payment_date || currentPayment.fecha_pago) ? (
                    <PaymentRow
                      icon={<FaCheckCircle />}
                      label={isAggregatedCoverage ? 'Ultimo pago registrado' : 'Fecha de pago'}
                      value={formatDateStringShort(currentPayment.latest_payment_date || currentPayment.fecha_pago)}
                    />
                  ) : null}
                </div>
              ) : null}
            </Card>

            {!paymentStatus.hasPaid ? (
              <Card className="border-amber-300/45 bg-amber-600/10">
                <h4 className="text-base font-extrabold text-amber-200 mobile:text-lg">Como realizar el pago</h4>
                <p className="mt-1 text-sm text-slate-100 mobile:text-base">
                  Contacta con la administracion para obtener los detalles de pago o acercate directamente al club.
                </p>
              </Card>
            ) : null}
          </div>
        ) : (
          <EmptyState title="No hay informacion de pagos disponible" description="La mensualidad se actualizara automaticamente cuando exista un registro." />
        )}
      </Card>
    );
  };

  const renderAttendance = () => (
    <Card className="border-rv-gold/20 bg-black/30" padding="lg">
      <SectionHeader
        title="Mis Asistencias"
        subtitle="Resumen mensual de asistencia a entrenamientos."
        icon={<FaChartBar />}
      />

      {attendanceStats ? (
        <div className="space-y-4">
          <div className="grid gap-3 mobile:grid-cols-2">
            <Card className="border-emerald-300/35 bg-emerald-900/15" padding="sm">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-100">
                <FaCheckCircle />
                Dias presente este mes
              </p>
              <p className="mt-1 text-3xl font-black text-white">{attendanceStats.presentDays}</p>
            </Card>

            <Card className="border-cyan-300/35 bg-cyan-900/15" padding="sm">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-100">
                <FaCalendar />
                Entrenamientos registrados
              </p>
              <p className="mt-1 text-3xl font-black text-white">{attendanceStats.totalDays}</p>
            </Card>
          </div>

          <Card className="border-white/15 bg-black/25" padding="sm" data-guide-id="student-attendance-history">
            <h3 className="text-base font-extrabold text-white mobile:text-lg">Historial Reciente</h3>
            {attendanceStats.recentAttendances.length > 0 ? (
              <div className="mt-3 space-y-2">
                {attendanceStats.recentAttendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex flex-col gap-2 rounded-xl border border-white/15 bg-black/20 p-3 mobile:flex-row mobile:items-center mobile:justify-between"
                  >
                    <span className="text-sm font-bold capitalize text-slate-200">
                      {formatDateString(attendance.fecha, { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                    <StatusBadge tone="success">
                      <FaCheckCircle className="mr-1" />
                      Presente
                    </StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No hay registros de asistencia este mes.</p>
            )}
          </Card>
        </div>
      ) : (
        <EmptyState title="No hay informacion de asistencias disponible" description="La asistencia aparecera automaticamente cuando existan registros." />
      )}
    </Card>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <StudentProfileIdentityCard
        userId={user.id}
        gamification={gamification}
        loading={loading}
        onIdentityUpdated={setGamification}
      />
      <ProfileSettings user={user} />
    </div>
  );

  const renderGamification = () => (
    <StudentGamificationPanel
      gamification={gamification}
      userId={user.id}
      loading={loading}
      onRefresh={() => studentData && loadStudentData(user.id)}
      onIdentityUpdated={setGamification}
    />
  );

  const userRole = userProfile?.role?.toLowerCase();
  const accessDenied = !user?.id || (!profileLoading && !STUDENT_ROLES.includes(userRole));

  if (!accessDenied && (profileLoading || loading || loadedUserId !== user?.id)) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-rv-gold" />
        <p className="text-sm font-semibold mobile:text-base">Cargando informacion...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700"><FaBan />Acceso Denegado</h2>
        <p className="mt-3 text-slate-700">Esta seccion es solo para estudiantes.</p>
        {userRole && <p className="mt-1 text-slate-700">Tu rol actual es: <strong>{userRole}</strong></p>}
        <button
          onClick={() => { window.location.href = '/'; }}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-5 py-2.5 font-bold text-rv-dark transition-all duration-200 hover:brightness-105"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700"><FaTimes />Error</h2>
        <p className="mt-3 text-slate-700">No se pudo cargar la informacion del estudiante.</p>
        <p className="mt-1 text-slate-700">Por favor, contacta con la administracion.</p>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-5 py-2.5 font-bold text-rv-dark transition-all duration-200 hover:brightness-105"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: 'anuncios', guideId: 'student-menu-anuncios', icon: <FaBullhorn />, label: 'Anuncios' },
    { id: 'progreso', guideId: 'student-menu-progreso', icon: <FaStar />, label: 'Mi Progreso' },
    { id: 'mensualidad', guideId: 'student-menu-mensualidad', icon: <FaMoneyBillWave />, label: 'Mensualidad' },
    { id: 'asistencias', guideId: 'student-menu-asistencias', icon: <FaChartBar />, label: 'Asistencias' },
    { id: 'tests-fisicos', guideId: 'student-menu-tests-fisicos', icon: <FaDumbbell />, label: 'Tests Fisicos' },
    { id: 'perfil', guideId: 'student-menu-perfil', icon: <FaCog />, label: 'Mi Perfil' }
  ];

  const sidebarAvatar = gamification?.identity ? (
    <IdentityPortrait
      imageUrl={gamification.identity.profileImageUrl || gamification.identity.avatarUrl}
      displayName={gamification.identity.displayName}
      equipment={gamification.cosmetics?.equipment}
      equippedItems={gamification.cosmetics?.equippedItems}
      size="sm"
    />
  ) : (
    <FaUserCircle />
  );

  const handleGuideSkip = () => {
    markPanelGuideDismissed('student');
    setGuideOpen(false);
  };

  const handleGuideComplete = () => {
    markPanelGuideCompleted('student');
    setGuideOpen(false);
  };

  return (
    <RolePanelLayout
      as="aside"
      variant="student"
      title={`${studentData.users?.nombre || ''} ${studentData.users?.apellido || ''}`.trim() || 'Estudiante'}
      roleLabel="Estudiante"
      badgeLabel={studentData.categoria ? formatCategoryLabel(studentData.categoria) : 'Estudiante'}
      avatarIcon={sidebarAvatar}
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      showDescriptions={false}
      topBar={(
        <div className="min-w-0">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black leading-tight text-white mobile:text-2xl">Panel de Estudiante</h1>
            <p className="mt-0.5 truncate text-sm leading-5 text-slate-200 mobile:text-base">Bienvenido, {studentData.users?.nombre}</p>
          </div>
        </div>
      )}
      contentClassName="space-y-4 mobile:space-y-5"
    >
      <Suspense fallback={<SectionFallback />}>
        {activeSection === 'anuncios' && renderAnuncios()}
        {activeSection === 'progreso' && renderGamification()}
        {activeSection === 'mensualidad' && renderPaymentStatus()}
        {activeSection === 'asistencias' && renderAttendance()}
        {activeSection === 'tests-fisicos' && (
          <StudentPhysicalTests
            physicalTests={physicalTests}
            studentData={studentData}
          />
        )}
        {activeSection === 'perfil' && renderProfile()}
      </Suspense>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setGuideOpen(true)}
        className="fixed bottom-[max(env(safe-area-inset-bottom),1rem)] right-4 z-[90] h-11 w-11 rounded-full border-rv-gold/40 bg-black/80 p-0 text-rv-gold shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md desktop:bottom-6 desktop:right-6"
        aria-label="Abrir guia del panel"
        title="Abrir guia del panel"
      >
        <FaBookOpen />
      </Button>
      <PanelUserGuide
        open={guideOpen}
        role="student"
        panelLabel="Panel de Estudiante"
        steps={PANEL_GUIDE_STEPS.student}
        onClose={handleGuideSkip}
        onComplete={handleGuideComplete}
        onSectionChange={setActiveSection}
      />
    </RolePanelLayout>
  );
};

StudentPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string
  }).isRequired
};

export default StudentPanel;

const PaymentRow = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 mobile:flex-row mobile:items-center mobile:justify-between mobile:gap-3">
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-rv-gold mobile:text-xs">
      {icon}
      {label}
    </span>
    <span className="text-sm font-semibold leading-5 text-white mobile:text-base">{value}</span>
  </div>
);

PaymentRow.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired
};
