// src/features/student-dashboard/presentation/components/StudentPanel.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import {
  FaBan,
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
  FaSyncAlt,
  FaTimes,
  FaUserCircle
} from 'react-icons/fa';
import {
  AnunciosViewer,
} from '../../../announcements';
import { useUserProfile } from '../../../auth-profile';
import {
  calcularDiferenciaDias,
  formatDateString,
  formatDateStringShort,
  getEcuadorDate
} from '../../../../utils/dateUtils';
import { studentDashboardService } from '../../studentDashboardService';
import { ProfileSettings } from '../../../account-admin';
import StudentPhysicalTests from './StudentPhysicalTests';
import StudentProfileIdentityCard from './StudentProfileIdentityCard';
import { IdentityPortrait, StudentGamificationPanel } from '../../../gamification';
import { Button, Card, EmptyState, RolePanelLayout, SectionHeader, StatusBadge } from '../../../../shared/ui';
import { cn } from '../../../../lib/cn';

const StudentPanel = ({ user }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('anuncios');
  const [studentData, setStudentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [physicalTests, setPhysicalTests] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const { profile: userProfile, loading: profileLoading } = useUserProfile(user);

  useEffect(() => {
    if (user?.id && !profileLoading) {
      loadStudentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profileLoading]);

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

  const loadStudentData = async (nextUserId = user?.id) => {
    setLoading(true);
    try {
      const panelData = await studentDashboardService.loadStudentPanelData(nextUserId);
      setStudentData(panelData.studentData);
      setPaymentStatus(panelData.paymentStatus);
      setAttendanceStats(panelData.attendanceStats);
      setPhysicalTests(panelData.physicalTests || []);
      setGamification(panelData.gamification || null);
    } catch (error) {
      console.error('Error cargando datos del estudiante:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStatus = async (studentId) => {
    try {
      const paymentData = await studentDashboardService.loadPaymentStatus(studentId);
      setPaymentStatus(paymentData);
    } catch (error) {
      console.error('Error cargando estado de pago:', error);
    }
  };

  const loadPhysicalTests = async (studentId) => {
    try {
      const tests = await studentDashboardService.loadPhysicalTests(studentId);
      setPhysicalTests(tests || []);
      const panelData = await studentDashboardService.loadStudentPanelData(user.id);
      setGamification(panelData.gamification || null);
    } catch (error) {
      console.error('Error cargando tests fisicos:', error);
    }
  };

  const loadAttendanceStats = async (studentId) => {
    try {
      const attendanceData = await studentDashboardService.loadAttendanceStats(studentId);
      setAttendanceStats(attendanceData);
    } catch (error) {
      console.error('Error cargando estadisticas de asistencia:', error);
    }
  };

  const renderAnuncios = () => (
    <Card className="border-rv-gold/20 bg-black/30" padding="lg">
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

    return (
      <Card className="border-rv-gold/20 bg-black/30" padding="lg">
        <SectionHeader
          title="Estado de Mensualidad"
          subtitle="Revisa el estado de tus pagos y el tiempo restante de tu mensualidad activa."
          icon={<FaMoneyBillWave />}
          actions={(
            <Button
              variant="secondary"
              size="sm"
              onClick={() => studentData && loadPaymentStatus(studentData.id)}
              title="Actualizar informacion"
            >
              <FaSyncAlt className="mr-2" />
              Actualizar
            </Button>
          )}
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
                    label="Periodo de mensualidad"
                    value={`${formatDateStringShort(currentPayment.fecha_inicio)} - ${formatDateStringShort(currentPayment.fecha_fin)}`}
                  />

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
                    label="Monto"
                    value={<span className="font-black text-white">${currentPayment.monto}</span>}
                  />

                  <PaymentRow
                    icon={<FaClipboardList />}
                    label="Estado"
                    value={<StatusBadge tone={getPaymentStateTone(currentPayment.estado)}>{currentPayment.estado?.toUpperCase() || 'N/A'}</StatusBadge>}
                  />

                  {currentPayment.fecha_pago ? (
                    <PaymentRow
                      icon={<FaCheckCircle />}
                      label="Fecha de pago"
                      value={formatDateStringShort(currentPayment.fecha_pago)}
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
          <EmptyState title="No hay informacion de pagos disponible" description="Intenta actualizar en unos segundos." />
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
        actions={(
          <Button
            variant="secondary"
            size="sm"
            onClick={() => studentData && loadAttendanceStats(studentData.id)}
            title="Actualizar informacion"
          >
            <FaSyncAlt className="mr-2" />
            Actualizar
          </Button>
        )}
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

          <Card className="border-white/15 bg-black/25" padding="sm">
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
        <EmptyState title="No hay informacion de asistencias disponible" description="Intenta actualizar en unos segundos." />
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

  if (profileLoading || loading) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-rv-gold" />
        <p className="text-sm font-semibold mobile:text-base">Cargando informacion...</p>
      </div>
    );
  }

  const userRole = userProfile?.role?.toLowerCase() || studentData?.users?.role?.toLowerCase();
  const validRoles = ['estudiante', 'usuario'];

  if (userRole && !validRoles.includes(userRole)) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-red-300/35 bg-white p-8 text-center shadow-xl">
        <h2 className="inline-flex items-center gap-2 text-2xl font-black text-red-700"><FaBan />Acceso Denegado</h2>
        <p className="mt-3 text-slate-700">Esta seccion es solo para estudiantes.</p>
        <p className="mt-1 text-slate-700">Tu rol actual es: <strong>{userRole}</strong></p>
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
    { id: 'anuncios', icon: <FaBullhorn />, label: 'Anuncios' },
    { id: 'progreso', icon: <FaStar />, label: 'Mi Progreso' },
    { id: 'mensualidad', icon: <FaMoneyBillWave />, label: 'Mensualidad' },
    { id: 'asistencias', icon: <FaChartBar />, label: 'Asistencias' },
    { id: 'tests-fisicos', icon: <FaDumbbell />, label: 'Tests Fisicos' },
    { id: 'perfil', icon: <FaCog />, label: 'Mi Perfil' }
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

  return (
    <RolePanelLayout
      as="aside"
      variant="student"
      title={`${studentData.users?.nombre || ''} ${studentData.users?.apellido || ''}`.trim() || 'Estudiante'}
      roleLabel="Estudiante"
      badgeLabel={studentData.categoria?.replaceAll('_', ' ').toUpperCase() || 'ESTUDIANTE'}
      avatarIcon={sidebarAvatar}
      menuItems={menuItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      showDescriptions={false}
      topBar={(
        <div>
          <h1 className="text-xl font-black text-white mobile:text-2xl">Panel de Estudiante</h1>
          <p className="mt-1 text-sm text-slate-200 mobile:text-base">Bienvenido, {studentData.users?.nombre}</p>
        </div>
      )}
      contentClassName="space-y-4 mobile:space-y-5"
    >
      {activeSection === 'anuncios' && renderAnuncios()}
      {activeSection === 'progreso' && renderGamification()}
      {activeSection === 'mensualidad' && renderPaymentStatus()}
      {activeSection === 'asistencias' && renderAttendance()}
      {activeSection === 'tests-fisicos' && (
        <StudentPhysicalTests
          physicalTests={physicalTests}
          studentData={studentData}
          onRefresh={() => studentData && loadPhysicalTests(studentData.id)}
        />
      )}
      {activeSection === 'perfil' && renderProfile()}
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
  <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 mobile:flex-row mobile:items-center mobile:justify-between">
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rv-gold">
      {icon}
      {label}
    </span>
    <span className="text-sm font-semibold text-white mobile:text-base">{value}</span>
  </div>
);

PaymentRow.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired
};




