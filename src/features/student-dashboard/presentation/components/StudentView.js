// src/features/student-dashboard/presentation/components/StudentView.js
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaDumbbell,
  FaEnvelope,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaPhone,
  FaUserCircle
} from 'react-icons/fa';
import { PhysicalTestChart, getPhysicalTestFieldMeta } from '../../../physical-tests';
import { studentDashboardService } from '../../studentDashboardService';
import { getLatestPaymentsList } from '../../../../utils/paymentUtils';
import { Button } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';
import { StatusBadge } from '../../../../shared/ui';

const PAGE_SIZE = 8;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' });
};

const statusToneByPayment = (statusInfo) => {
  if (!statusInfo) return 'neutral';
  if (statusInfo.estaVencido) return 'danger';
  if (statusInfo.estaProximoAVencer) return 'warning';
  return 'success';
};

const statusTextClassByPayment = (statusInfo) => {
  if (!statusInfo) return 'text-white';
  if (statusInfo.estaVencido) return 'text-red-300';
  if (statusInfo.estaProximoAVencer) return 'text-amber-300';
  return 'text-emerald-300';
};

const StudentView = ({ user }) => {
  const fieldMeta = {
    estatura: getPhysicalTestFieldMeta('estatura'),
    peso: getPhysicalTestFieldMeta('peso'),
    alcanceDePie: getPhysicalTestFieldMeta('brazo_extend_inicial'),
    saltoLargo: getPhysicalTestFieldMeta('fuerza_explosiva_salto_largo'),
    envergadura: getPhysicalTestFieldMeta('envergadura_brazos_extendidos_lateral'),
    observaciones: getPhysicalTestFieldMeta('observaciones'),
  };
  const [studentData, setStudentData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [physicalTests, setPhysicalTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.id) return;
    loadStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const panelData = await studentDashboardService.loadStudentViewData(user.id);
      setStudentData({
        ...panelData.studentData,
        isStudent: true
      });

      setPayments(panelData.payments || []);
      setPhysicalTests(panelData.physicalTests || []);
      setCurrentPage(1);
    } catch (error) {
      if (error?.details?.code === 'PGRST116') {
        setStudentData({ isStudent: false });
        return;
      }
      console.error('Error cargando datos del estudiante:', error);
      setStudentData({ isStudent: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const currentPayment = useMemo(() => getLatestPaymentsList(payments)[0] || null, [payments]);

  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return physicalTests.slice(start, start + PAGE_SIZE);
  }, [currentPage, physicalTests]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(physicalTests.length / PAGE_SIZE)), [physicalTests]);

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-rv-gold" />
        <p className="text-sm font-semibold mobile:text-base">Cargando informacion...</p>
      </div>
    );
  }

  if (!studentData?.isStudent) {
    return (
      <EmptyState
        icon={<FaUserCircle />}
        title={`Hola ${user?.user_metadata?.full_name || user?.email || 'usuario'}`}
        description="Tu cuenta no esta registrada como estudiante del club. Si eres atleta, contacta al administrador."
        className="mt-6"
        action={
          studentData?.error ? (
            <p className="text-xs text-red-200">Error: {studentData.error}</p>
          ) : null
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Card className="border-rv-gold/25 bg-black/35" padding="lg">
        <div className="flex flex-col gap-4 desktop:flex-row desktop:items-center desktop:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-rv-gold/35 bg-rv-gold/20 text-2xl font-black text-rv-gold">
              {(studentData.users?.nombre?.[0] || '').toUpperCase()}
              {(studentData.users?.apellido?.[0] || '').toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                {studentData.users?.nombre} {studentData.users?.apellido}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Categoria: {studentData.categoria?.replace(/_/g, ' ').toUpperCase()}
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-200">
                <FaEnvelope className="text-rv-gold" />
                {studentData.users?.email}
              </p>
              {studentData.users?.telefono ? (
                <p className="mt-0.5 inline-flex items-center gap-2 text-sm text-slate-200">
                  <FaPhone className="text-rv-gold" />
                  {studentData.users.telefono}
                </p>
              ) : null}
            </div>
          </div>

          {currentPayment ? (
            <Card className="border-white/20 bg-black/30" padding="sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Estado de mensualidad</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge tone={statusToneByPayment(currentPayment.statusInfo)}>
                  {currentPayment.statusInfo?.mensaje || 'Sin estado'}
                </StatusBadge>
                <span className="text-xs text-slate-300">
                  Vigente hasta: {formatDate(currentPayment.fecha_fin)}
                </span>
              </div>
            </Card>
          ) : null}
        </div>
      </Card>

      <Card className="border-white/15 bg-black/25" padding="sm">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeTab === 'overview' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('overview')}
          >
            Resumen
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'payments' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('payments')}
          >
            Pagos
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'tests' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('tests')}
          >
            Tests Fisicos
          </Button>
        </div>
      </Card>

      {activeTab === 'overview' ? (
        <div className="grid gap-4 desktop:grid-cols-2">
          <Card className="border-white/15 bg-black/30">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-white">
              <FaMoneyBillWave className="text-rv-gold" />
              Estado de Pagos
            </h3>
            {payments.length > 0 ? (
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p>Total pagos: <strong className="text-white">{payments.length}</strong></p>
                <p>Pagos al dia: <strong className="text-white">{payments.filter((payment) => payment.fecha_pago).length}</strong></p>
                {currentPayment ? (
                  <p>
                    Estado actual:{' '}
                    <span className={`font-bold ${statusTextClassByPayment(currentPayment.statusInfo)}`}>
                      {currentPayment.statusInfo?.mensaje}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No hay registros de pagos.</p>
            )}
          </Card>

          <Card className="border-white/15 bg-black/30">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-white">
              <FaDumbbell className="text-rv-gold" />
              Progreso Fisico
            </h3>
            {physicalTests.length > 0 ? (
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                <p>Tests realizados: <strong className="text-white">{physicalTests.length}</strong></p>
                <p>
                  Ultimo test:{' '}
                  <strong className="text-white">{formatDate(physicalTests[physicalTests.length - 1]?.fecha_test)}</strong>
                </p>
                {physicalTests.length >= 2 ? (
                  <StatusBadge tone="success">
                    <FaCheckCircle className="mr-1" />
                    Evolucion registrada
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="warning">
                    <FaExclamationTriangle className="mr-1" />
                    Falta historial para evolucion
                  </StatusBadge>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No hay tests fisicos registrados.</p>
            )}
          </Card>
        </div>
      ) : null}

      {activeTab === 'payments' ? (
        <Card className="border-white/15 bg-black/30" padding="lg">
          <h3 className="text-lg font-bold text-white">Historial de Pagos</h3>
          {payments.length > 0 ? (
            <div className="mt-3 grid gap-3 tablet:grid-cols-2">
              {payments.map((payment) => (
                <Card key={payment.id} className="border-white/15 bg-black/25" padding="sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white">
                      {formatDate(payment.fecha_inicio)} - {formatDate(payment.fecha_fin)}
                    </p>
                    <StatusBadge tone={statusToneByPayment(payment.statusInfo)}>
                      {payment.statusInfo?.mensaje}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-xl font-black text-rv-gold">{formatCurrency(payment.monto)}</p>
                  {payment.fecha_pago ? (
                    <p className="mt-1 text-xs text-slate-300">
                      <FaCalendarAlt className="mr-1 inline" />
                      Pagado: {formatDate(payment.fecha_pago)}
                    </p>
                  ) : null}
                  {payment.observaciones ? (
                    <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-slate-200">
                      {payment.observaciones}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No hay registros de pagos" description="Cuando existan pagos registrados, apareceran aqui." />
          )}
        </Card>
      ) : null}

      {activeTab === 'tests' ? (
        <Card className="border-white/15 bg-black/30" padding="lg">
          <h3 className="text-lg font-bold text-white">Evolucion Fisica</h3>
          {physicalTests.length > 0 ? (
            <div className="mt-4 space-y-4">
              {physicalTests.length >= 2 ? (
                <PhysicalTestChart tests={physicalTests} />
              ) : null}

              <div className="grid gap-3 tablet:grid-cols-2">
                {paginatedTests.map((test) => (
                  <Card key={test.id} className="border-white/15 bg-black/25" padding="sm">
                    <h4 className="text-sm font-bold text-white">Test del {formatDate(test.fecha_test)}</h4>
                    <div className="mt-2 space-y-1 text-xs text-slate-200">
                      {test.estatura != null ? <p>Estatura: {test.estatura}m</p> : null}
                      {test.peso != null ? <p>{fieldMeta.peso.shortLabel}: {test.peso}kg</p> : null}
                      {test.brazo_extend_inicial != null ? <p>{fieldMeta.alcanceDePie.shortLabel}: {test.brazo_extend_inicial}cm</p> : null}
                      {test.fuerza_explosiva_salto_largo != null ? <p>{fieldMeta.saltoLargo.shortLabel}: {test.fuerza_explosiva_salto_largo}m</p> : null}
                      {test.envergadura_brazos_extendidos_lateral != null ? (
                        <p>{fieldMeta.envergadura.shortLabel}: {test.envergadura_brazos_extendidos_lateral}cm</p>
                      ) : null}
                    </div>
                    {test.observaciones ? (
                      <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-slate-200">
                        <strong>{fieldMeta.observaciones.label}:</strong> {test.observaciones}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>

              <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/20 p-3 text-sm text-slate-200 mobile:flex-row">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span>
                  Pagina {currentPage} de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No hay tests fisicos registrados"
              description="Cuando existan tests, aqui veras tu evolucion y progreso fisico."
            />
          )}
        </Card>
      ) : null}
    </div>
  );
};

StudentView.propTypes = {
  user: PropTypes.object.isRequired
};

export default StudentView;


