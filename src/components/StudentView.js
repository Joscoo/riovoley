// src/components/StudentView.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';
import PagoStatusService from '../services/pagoStatusService';
import PhysicalTestChart from './PhysicalTestChart';
import styles from '../styles/StudentView.module.css';

const StudentView = ({ user }) => {
  const [studentData, setStudentData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [physicalTests, setPhysicalTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      console.log('🎯 Usuario logueado detectado:', user);
      console.log('🆔 User ID:', user.id);
      console.log('📧 User Email:', user.email);
      loadStudentData();
    } else {
      console.log('❌ No hay usuario logueado o falta ID');
      console.log('🕵️ Objeto user recibido:', user);
    }
  }, [user]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Buscando datos del estudiante para user.id:', user.id);
      
      // Obtener datos del estudiante
      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          categoria,
          user_id,
          users!inner(
            id,
            nombre,
            apellido,
            email,
            telefono,
            fecha_nacimiento
          )
        `)
        .eq('user_id', user.id)
        .single();

      console.log('📋 Resultado de consulta estudiante:', { studentInfo, studentError });

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          // Usuario no es estudiante
          console.log('❌ Usuario no encontrado como estudiante');
          setStudentData({ isStudent: false });
          return;
        }
        throw studentError;
      }

      console.log('✅ Usuario encontrado como estudiante:', studentInfo);
      setStudentData({
        ...studentInfo,
        isStudent: true
      });

      // Cargar pagos del estudiante
      await loadPayments(studentInfo.id);
      
      // Cargar tests físicos del estudiante
      await loadPhysicalTests(studentInfo.id);

    } catch (error) {
      console.error('Error cargando datos del estudiante:', error);
      setStudentData({ isStudent: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (studentId) => {
    try {
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('fecha_inicio', { ascending: false });

      if (error) throw error;

      // Calcular estado automático para cada pago
      const paymentsWithStatus = paymentsData.map(payment => {
        const statusInfo = PagoStatusService.getStatusInfo(payment);
        return {
          ...payment,
          statusInfo
        };
      });

      setPayments(paymentsWithStatus);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    }
  };

  const loadPhysicalTests = async (studentId) => {
    try {
      const { data: testsData, error } = await supabase
        .from('physical_tests')
        .select('*')
        .eq('student_id', studentId)
        .order('fecha_test', { ascending: true });

      if (error) throw error;
      setPhysicalTests(testsData || []);
    } catch (error) {
      console.error('Error cargando tests físicos:', error);
    }
  };

  const getCurrentPayment = () => {
    const today = new Date();
    return payments.find(payment => {
      const fechaInicio = new Date(payment.fecha_inicio);
      const fechaFin = new Date(payment.fecha_fin);
      return fechaInicio <= today && fechaFin >= today;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando información...</p>
      </div>
    );
  }

  if (!studentData?.isStudent) {
    return (
      <div className={styles.notStudent}>
        <div className={styles.notStudentContent}>
          <h2>👋 ¡Hola {user?.user_metadata?.full_name || user?.email}!</h2>
          <p>Tu cuenta no está registrada como estudiante del club.</p>
          <p>Si eres un atleta, contacta al administrador para que configure tu perfil.</p>
          {studentData?.error && (
            <div className={styles.errorMessage}>
              <p>Error: {studentData.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPayment = getCurrentPayment();

  return (
    <div className={styles.studentView}>
      {/* Header con información personal */}
      <div className={styles.header}>
        <div className={styles.studentInfo}>
          <div className={styles.avatar}>
            <span>{studentData.users.nombre?.[0]}{studentData.users.apellido?.[0]}</span>
          </div>
          <div className={styles.personalInfo}>
            <h1>{studentData.users.nombre} {studentData.users.apellido}</h1>
            <p className={styles.category}>
              📋 {studentData.categoria?.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p className={styles.email}>📧 {studentData.users.email}</p>
            {studentData.users.telefono && (
              <p className={styles.phone}>📱 {studentData.users.telefono}</p>
            )}
          </div>
        </div>

        {/* Estado de mensualidad actual */}
        {currentPayment && (
          <div className={styles.currentPaymentStatus}>
            <h3>Estado de Mensualidad</h3>
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: currentPayment.statusInfo.color }}
            >
              <span className={styles.statusIcon}>{currentPayment.statusInfo.icono}</span>
              <div className={styles.statusText}>
                <span className={styles.statusLabel}>{currentPayment.statusInfo.mensaje}</span>
                <small>Vigente hasta: {formatDate(currentPayment.fecha_fin)}</small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'payments' ? styles.active : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💰 Pagos
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'tests' ? styles.active : ''}`}
          onClick={() => setActiveTab('tests')}
        >
          🏋️ Tests Físicos
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.overviewGrid}>
              
              {/* Resumen de pagos */}
              <div className={styles.overviewCard}>
                <h3>💰 Estado de Pagos</h3>
                {payments.length > 0 ? (
                  <div className={styles.paymentsSummary}>
                    <div className={styles.summaryItem}>
                      <span>Total pagos:</span>
                      <strong>{payments.length}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Pagos al día:</span>
                      <strong>{payments.filter(p => p.fecha_pago).length}</strong>
                    </div>
                    {currentPayment && (
                      <div className={styles.currentStatus}>
                        <span>Estado actual:</span>
                        <span 
                          className={styles.statusIndicator}
                          style={{ color: currentPayment.statusInfo.color }}
                        >
                          {currentPayment.statusInfo.mensaje}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No hay registros de pagos</p>
                )}
              </div>

              {/* Resumen de tests físicos */}
              <div className={styles.overviewCard}>
                <h3>🏋️ Progreso Físico</h3>
                {physicalTests.length > 0 ? (
                  <div className={styles.testsSummary}>
                    <div className={styles.summaryItem}>
                      <span>Tests realizados:</span>
                      <strong>{physicalTests.length}</strong>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Último test:</span>
                      <strong>{formatDate(physicalTests[physicalTests.length - 1]?.fecha_test)}</strong>
                    </div>
                    {physicalTests.length >= 2 && (
                      <div className={styles.progressIndicator}>
                        <span>🚀 Evolución registrada</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No hay tests físicos registrados</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className={styles.paymentsTab}>
            <h3>💰 Historial de Pagos</h3>
            {payments.length > 0 ? (
              <div className={styles.paymentsGrid}>
                {payments.map(payment => (
                  <div key={payment.id} className={styles.paymentCard}>
                    <div className={styles.paymentHeader}>
                      <span className={styles.paymentPeriod}>
                        {formatDate(payment.fecha_inicio)} - {formatDate(payment.fecha_fin)}
                      </span>
                      <span 
                        className={styles.paymentStatus}
                        style={{ color: payment.statusInfo.color }}
                      >
                        {payment.statusInfo.icono} {payment.statusInfo.mensaje}
                      </span>
                    </div>
                    <div className={styles.paymentDetails}>
                      <div className={styles.paymentAmount}>
                        {formatCurrency(payment.monto)}
                      </div>
                      {payment.fecha_pago && (
                        <div className={styles.paymentDate}>
                          Pagado: {formatDate(payment.fecha_pago)}
                        </div>
                      )}
                      {payment.observaciones && (
                        <div className={styles.paymentNotes}>
                          {payment.observaciones}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No hay registros de pagos</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className={styles.testsTab}>
            <h3>🏋️ Evolución Física</h3>
            {physicalTests.length > 0 ? (
              <div className={styles.testsContent}>
                {physicalTests.length >= 2 && (
                  <div className={styles.chartContainer}>
                    <PhysicalTestChart tests={physicalTests} />
                  </div>
                )}
                
                <div className={styles.testsGrid}>
                  {physicalTests.map(test => (
                    <div key={test.id} className={styles.testCard}>
                      <div className={styles.testHeader}>
                        <h4>Test del {formatDate(test.fecha_test)}</h4>
                      </div>
                      <div className={styles.testMetrics}>
                        {test.estatura && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Estatura:</span>
                            <span className={styles.metricValue}>{test.estatura}m</span>
                          </div>
                        )}
                        {test.peso && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Peso:</span>
                            <span className={styles.metricValue}>{test.peso}kg</span>
                          </div>
                        )}
                        {test.brazo_extend_inicial && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Brazo extendido:</span>
                            <span className={styles.metricValue}>{test.brazo_extend_inicial}cm</span>
                          </div>
                        )}
                        {test.fuerza_explosiva_salto_largo && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Salto largo:</span>
                            <span className={styles.metricValue}>{test.fuerza_explosiva_salto_largo}m</span>
                          </div>
                        )}
                        {test.envergadura_brazos_extendidos_lateral && (
                          <div className={styles.metric}>
                            <span className={styles.metricLabel}>Envergadura:</span>
                            <span className={styles.metricValue}>{test.envergadura_brazos_extendidos_lateral}cm</span>
                          </div>
                        )}
                      </div>
                      {test.observaciones && (
                        <div className={styles.testNotes}>
                          <strong>Observaciones:</strong> {test.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>No hay tests físicos registrados</p>
                <small>Cuando tengas tests registrados, aquí verás tu evolución y progreso físico</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

StudentView.propTypes = {
  user: PropTypes.object.isRequired
};

export default StudentView;