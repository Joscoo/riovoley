// src/components/student/StudentPanel.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { useUserProfile } from '../../hooks/useUserProfile';
import AnunciosViewer from '../AnunciosViewer';
import ProfileSettings from '../admin/ProfileSettings';
import StudentPhysicalTests from './StudentPhysicalTests';
import styles from '../../styles/StudentPanel.module.css';
import { getEcuadorDate, getEcuadorFirstDayOfMonth, formatDateString, formatDateStringShort, calcularDiferenciaDias } from '../../utils/dateUtils';
import { FaCog, FaDumbbell, FaBullhorn, FaSyncAlt, FaCheckCircle, FaStar, FaExclamationTriangle, FaClock, FaCalendar, FaMoneyBillWave, FaClipboardList, FaChartBar, FaBan, FaTimes, FaUserCircle } from 'react-icons/fa';

const StudentPanel = ({ user }) => {
  const [activeSection, setActiveSection] = useState('anuncios');
  const [studentData, setStudentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [physicalTests, setPhysicalTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile: userProfile, loading: profileLoading } = useUserProfile(user);

  useEffect(() => {
    if (user?.id && !profileLoading) {
      loadStudentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profileLoading]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Cargar datos del estudiante con rol del usuario
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          users!inner(
            id,
            nombre,
            apellido,
            email,
            telefono,
            role
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        console.error('Error cargando estudiante:', studentError);
        throw studentError;
      }
      
      console.log('📚 Datos del estudiante cargados:', student);
      setStudentData(student);

      // Cargar estado de pago del mes actual
      await loadPaymentStatus(student.id);

      // Cargar estadísticas de asistencia
      await loadAttendanceStats(student.id);

      // Cargar tests físicos
      await loadPhysicalTests(student.id);

    } catch (error) {
      console.error('Error cargando datos del estudiante:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStatus = async (studentId) => {
    try {
      // Usar zona horaria de Ecuador
      const today = getEcuadorDate();

      console.log('💳 Consultando pagos del estudiante:', studentId);
      console.log('📅 Fecha actual (Ecuador):', today);

      // Buscar pagos que estén activos HOY (fecha_inicio <= hoy <= fecha_fin)
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .lte('fecha_inicio', today)  // fecha_inicio debe ser <= hoy
        .gte('fecha_fin', today)     // fecha_fin debe ser >= hoy
        .order('fecha_inicio', { ascending: false });

      if (error) {
        console.error('❌ Error consultando pagos:', error);
        throw error;
      }

      console.log('💰 Pagos encontrados:', payments);

      const currentPayment = payments && payments.length > 0 ? payments[0] : null;
      
      setPaymentStatus({
        hasPaid: Boolean(currentPayment),
        payment: currentPayment,
        monthName: new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'America/Guayaquil' })
      });

      console.log('✅ Estado de pago actualizado:', {
        hasPaid: Boolean(currentPayment),
        payment: currentPayment
      });

    } catch (error) {
      console.error('Error cargando estado de pago:', error);
    }
  };

  const loadPhysicalTests = async (studentId) => {
    try {
      const { data: tests, error } = await supabase
        .from('physical_tests')
        .select('*')
        .eq('student_id', studentId)
        .order('fecha_test', { ascending: true });

      if (error) throw error;

      console.log('[TESTS] Tests físicos cargados:', tests);
      setPhysicalTests(tests || []);
    } catch (error) {
      console.error('Error cargando tests físicos:', error);
    }
  };

  const loadAttendanceStats = async (studentId) => {
    try {
      // Usar zona horaria de Ecuador (UTC-5)
      const firstDayFormatted = getEcuadorFirstDayOfMonth();

      console.log('📅 Fecha actual Ecuador:', getEcuadorDate());
      console.log('📅 Primer día del mes:', firstDayFormatted);

      // Obtener asistencias del mes actual
      const { data: attendances, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('student_id', studentId)
        .gte('fecha', firstDayFormatted)
        .order('fecha', { ascending: false });

      if (error) throw error;

      console.log('📊 Asistencias cargadas:', attendances);

      // Sistema: si hay registro = PRESENTE, si NO hay registro = AUSENTE
      // Todos los registros obtenidos son días presentes
      const totalDays = attendances?.length || 0;
      const presentDays = totalDays; // Todos los registros son presencias
      const absentDays = 0; // No podemos calcular ausencias sin saber días totales de entrenamiento
      const attendanceRate = totalDays > 0 ? '100.0' : '0.0'; // Solo tenemos registros de presencias

      setAttendanceStats({
        totalDays,
        presentDays,
        absentDays,
        attendanceRate,
        recentAttendances: attendances?.slice(0, 10) || []
      });

    } catch (error) {
      console.error('Error cargando estadísticas de asistencia:', error);
    }
  };

  const renderAnuncios = () => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2><FaBullhorn style={{ marginRight: '10px', verticalAlign: 'middle' }} />Anuncios y Comunicados</h2>
        <p>Mantente informado de las novedades del club</p>
      </div>
      <div>
        <AnunciosViewer 
          userRole="estudiantes" 
          limit={null}
          showFilters={true}
        />
      </div>
    </div>
  );

  const renderPaymentStatus = () => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2><FaMoneyBillWave style={{ marginRight: '10px', verticalAlign: 'middle' }} />Estado de Mensualidad</h2>
          <p>Revisa el estado de tus pagos y el tiempo restante de tu mensualidad activa</p>
        </div>
        <button 
          onClick={() => studentData && loadPaymentStatus(studentData.id)}
          className={styles.refreshButton}
          title="Actualizar información"
        >
          <FaSyncAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} />Actualizar
        </button>
      </div>

      {paymentStatus ? (
        <div className={styles.paymentContent}>
          <div className={`${styles.paymentCard} ${paymentStatus.hasPaid ? styles.paid : styles.pending}`}>
            <div className={styles.paymentStatus}>
              {paymentStatus.hasPaid ? (
                <>
                  <span className={styles.statusIcon}><FaCheckCircle /></span>
                  <h3><FaStar style={{ marginRight: '8px', verticalAlign: 'middle' }} />Mensualidad Activa</h3>
                  <p>Tu pago está al día para {paymentStatus.monthName}</p>
                </>
              ) : (
                <>
                  <span className={styles.statusIcon}><FaExclamationTriangle /></span>
                  <h3><FaClock style={{ marginRight: '8px', verticalAlign: 'middle' }} />Pago Pendiente</h3>
                  <p>Tienes un pago pendiente para {paymentStatus.monthName}</p>
                </>
              )}
            </div>

            {paymentStatus.payment && (
              <div className={styles.paymentDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}><FaCalendar style={{ marginRight: '8px', verticalAlign: 'middle' }} />Período de Mensualidad</span>
                  <span className={styles.value}>
                    {formatDateStringShort(paymentStatus.payment.fecha_inicio)} - {formatDateStringShort(paymentStatus.payment.fecha_fin)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}><FaClock style={{ marginRight: '8px', verticalAlign: 'middle' }} />Tiempo restante</span>
                  <span className={`${styles.value} ${styles.timeRemaining}`}>
                    {(() => {
                      const today = getEcuadorDate();
                      const diffDays = calcularDiferenciaDias(paymentStatus.payment.fecha_fin, today);
                      
                      if (diffDays < 0) return <span className={styles.expired}><FaExclamationTriangle style={{ marginRight: '4px' }} />Vencido</span>;
                      if (diffDays === 0) return <span className={styles.urgent}><FaExclamationTriangle style={{ marginRight: '4px' }} />Vence hoy</span>;
                      if (diffDays === 1) return <span className={styles.urgent}><FaExclamationTriangle style={{ marginRight: '4px' }} />1 día</span>;
                      if (diffDays <= 7) return <span className={styles.warning}>{diffDays} días</span>;
                      return <span className={styles.normal}>{diffDays} días</span>;
                    })()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}><FaMoneyBillWave style={{ marginRight: '8px', verticalAlign: 'middle' }} />Monto</span>
                  <span className={styles.value}>${paymentStatus.payment.monto}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}><FaClipboardList style={{ marginRight: '8px', verticalAlign: 'middle' }} />Estado</span>
                  <span className={`${styles.badge} ${styles[paymentStatus.payment.estado]}`}>
                    {paymentStatus.payment.estado.toUpperCase()}
                  </span>
                </div>
                {paymentStatus.payment.fecha_pago && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}><FaCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />Fecha de pago</span>
                    <span className={styles.value}>
                      {formatDateStringShort(paymentStatus.payment.fecha_pago)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!paymentStatus.hasPaid && (
            <div className={styles.paymentHelp}>
              <h4>¿Cómo realizar el pago?</h4>
              <p>Contacta con la administración para obtener los detalles de pago o acércate directamente al club.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noData}>
          <p>No hay información de pagos disponible</p>
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2><FaChartBar style={{ marginRight: '10px', verticalAlign: 'middle' }} />Mis Asistencias</h2>
          <p>Resumen de tu asistencia a entrenamientos</p>
        </div>
        <button 
          onClick={() => studentData && loadAttendanceStats(studentData.id)}
          className={styles.refreshButton}
          title="Actualizar información"
        >
          <FaSyncAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} />Actualizar
        </button>
      </div>

      {attendanceStats ? (
        <div className={styles.attendanceContent}>
          {/* Estadísticas generales */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><FaCheckCircle /></div>
              <div className={styles.statInfo}>
                <h3>{attendanceStats.presentDays}</h3>
                <p>Días presente este mes</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><FaCalendar /></div>
              <div className={styles.statInfo}>
                <h3>{attendanceStats.totalDays}</h3>
                <p>Entrenamientos registrados</p>
              </div>
            </div>
          </div>

          {/* Historial reciente */}
          <div className={styles.recentAttendance}>
            <h3>Historial Reciente</h3>
            {attendanceStats.recentAttendances.length > 0 ? (
              <div className={styles.attendanceList}>
                {attendanceStats.recentAttendances.map((attendance) => {
                  return (
                    <div key={attendance.id} className={styles.attendanceItem}>
                      <span className={styles.attendanceDate}>
                        {formatDateString(attendance.fecha, { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                      <span className={`${styles.attendanceStatus} ${styles.present}`}>
                        <FaCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} />Presente
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noData}>No hay registros de asistencia este mes</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.noData}>
          <p>No hay información de asistencias disponible</p>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2><FaCog style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Configuración de Perfil</h2>
        <p>Actualiza tu información personal</p>
      </div>
      <ProfileSettings user={user} />
    </div>
  );

  // Verificar acceso
  if (profileLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando información...</p>
      </div>
    );
  }

  // Verificar rol de estudiante desde userProfile o desde studentData
  // Aceptar tanto "estudiante" como "usuario" como roles válidos
  const userRole = userProfile?.role?.toLowerCase() || studentData?.users?.role?.toLowerCase();
  const validRoles = ['estudiante', 'usuario'];
  
  if (userRole && !validRoles.includes(userRole)) {
    return (
      <div className={styles.error}>
        <h2><FaBan style={{ marginRight: '10px', verticalAlign: 'middle' }} />Acceso Denegado</h2>
        <p>Esta sección es solo para estudiantes.</p>
        <p>Tu rol actual es: <strong>{userRole}</strong></p>
        <button 
          onClick={() => window.location.href = '/'}
          className={styles.errorButton}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className={styles.error}>
        <h2><FaTimes style={{ marginRight: '10px', verticalAlign: 'middle' }} />Error</h2>
        <p>No se pudo cargar la información del estudiante</p>
        <p>Por favor, contacta con la administración.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className={styles.errorButton}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className={styles.studentPanel}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userAvatar}><FaUserCircle /></div>
          <h3>{studentData.users?.nombre} {studentData.users?.apellido}</h3>
          <p className={styles.userRole}>Estudiante</p>
          <span className={styles.categoryBadge}>{studentData.categoria?.replaceAll('_', ' ').toUpperCase()}</span>
        </div>

        <nav className={styles.menu}>
          <button
            className={`${styles.menuItem} ${activeSection === 'anuncios' ? styles.active : ''}`}
            onClick={() => setActiveSection('anuncios')}
          >
            <span className={styles.menuIcon}><FaBullhorn /></span>
            <span>Anuncios</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeSection === 'mensualidad' ? styles.active : ''}`}
            onClick={() => setActiveSection('mensualidad')}
          >
            <span className={styles.menuIcon}><FaMoneyBillWave /></span>
            <span>Mensualidad</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeSection === 'asistencias' ? styles.active : ''}`}
            onClick={() => setActiveSection('asistencias')}
          >
            <span className={styles.menuIcon}><FaChartBar /></span>
            <span>Asistencias</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeSection === 'tests-fisicos' ? styles.active : ''}`}
            onClick={() => setActiveSection('tests-fisicos')}
          >
            <span className={styles.menuIcon}><FaDumbbell /></span>
            <span>Tests Físicos</span>
          </button>

          <button
            className={`${styles.menuItem} ${activeSection === 'perfil' ? styles.active : ''}`}
            onClick={() => setActiveSection('perfil')}
          >
            <span className={styles.menuIcon}><FaCog /></span>
            <span>Mi Perfil</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentHeader}>
          <h1>Panel de Estudiante</h1>
          <p>Bienvenido, {studentData.users?.nombre}</p>
        </div>

        <div className={styles.contentBody}>
          {activeSection === 'anuncios' && renderAnuncios()}
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
        </div>
      </main>
    </div>
  );
};

StudentPanel.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string
  }).isRequired
};

export default StudentPanel;
