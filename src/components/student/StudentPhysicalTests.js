// src/components/student/StudentPhysicalTests.js
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/StudentPanel.module.css';
import { FaDumbbell, FaFire, FaClipboardList, FaRunning, FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaWeight, FaUtensils, FaChartBar, FaSyncAlt, FaCalendar, FaRuler, FaChartLine, FaLightbulb } from 'react-icons/fa';

const StudentPhysicalTests = ({ physicalTests, studentData, onRefresh }) => {
  const calculateIMC = (peso, estatura) => {
    if (!peso || !estatura || estatura === 0) return null;
    return (peso / (estatura * estatura)).toFixed(2);
  };

  const getIMCCategory = (imc) => {
    if (imc < 18.5) return { category: 'Bajo peso', color: '#ffeb3b', icon: <FaExclamationTriangle /> };
    if (imc < 25) return { category: 'Peso normal', color: '#4caf50', icon: <FaCheckCircle /> };
    if (imc < 30) return { category: 'Sobrepeso', color: '#ff9800', icon: <FaExclamationTriangle /> };
    return { category: 'Obesidad', color: '#ff5252', icon: <FaExclamationCircle /> };
  };

  const getNutritionRecommendation = (imc) => {
    const imcValue = parseFloat(imc);
    
    if (imcValue < 18.5) {
      return {
        title: 'Aumentar masa muscular',
        recommendations: [
          '• Aumenta la ingesta de proteínas: carnes magras, huevos, legumbres',
          '• Consume grasas saludables: frutos secos, aguacate, aceite de oliva',
          '• Incrementa carbohidratos complejos: arroz integral, avena, batata',
          '• Realiza entrenamiento de fuerza junto con tu práctica de voleibol',
          '• Come 5-6 comidas pequeñas al día para mantener energía'
        ]
      };
    } else if (imcValue < 25) {
      return {
        title: 'Mantener peso saludable',
        recommendations: [
          '• Dieta balanceada: 40% carbohidratos, 30% proteínas, 30% grasas',
          '• Proteínas magras: pollo, pescado, claras de huevo',
          '• Abundantes vegetales y frutas para vitaminas y minerales',
          '• Hidratación constante: 2-3 litros de agua al día',
          '• Snacks pre-entreno: banana, frutos secos, barras energéticas'
        ]
      };
    } else if (imcValue < 30) {
      return {
        title: 'Reducir grasa corporal',
        recommendations: [
          '• Aumenta consumo de vegetales y reduce carbohidratos simples',
          '• Proteínas magras en cada comida para mantener masa muscular',
          '• Evita: bebidas azucaradas, frituras, comida procesada',
          '• Aumenta actividad cardiovascular además del voleibol',
          '• Controla porciones y evita comer 2-3 horas antes de dormir'
        ]
      };
    } else {
      return {
        title: 'Plan de reducción de peso',
        recommendations: [
          '• Consulta con un nutricionista para plan personalizado',
          '• Dieta hipocalórica rica en vegetales y proteínas',
          '• Inicia con ejercicio de baja intensidad y aumenta gradualmente',
          '• Monitoreo constante de progreso y ajustes según resultados',
          '• Enfócate en cambios de hábitos a largo plazo, no dietas extremas'
        ]
      };
    }
  };

  const latestTest = physicalTests.length > 0 ? physicalTests[physicalTests.length - 1] : null;
  const imc = latestTest ? calculateIMC(latestTest.peso, latestTest.estatura) : null;
  const imcInfo = imc ? getIMCCategory(imc) : null;
  const nutritionPlan = imc ? getNutritionRecommendation(imc) : null;

  // Calcular edad del estudiante
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const studentAge = studentData?.fecha_nacimiento ? calculateAge(studentData.fecha_nacimiento) : null;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2><FaDumbbell style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Tests Físicos y Rendimiento</h2>
          <p>Monitorea tu progreso físico y obtén recomendaciones personalizadas</p>
        </div>
        <button 
          onClick={onRefresh}
          className={styles.refreshButton}
          title="Actualizar información"
        >
          <FaSyncAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} />Actualizar
        </button>
      </div>

      {physicalTests.length > 0 ? (
        <div className={styles.testsContent}>
          {/* Resumen General */}
          {physicalTests.length > 1 && (
            <div className={styles.summaryCards}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}><FaChartBar /></div>
                <div className={styles.summaryInfo}>
                  <div className={styles.summaryLabel}>Total de Tests</div>
                  <div className={styles.summaryValue}>{physicalTests.length}</div>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}><FaWeight /></div>
                <div className={styles.summaryInfo}>
                  <div className={styles.summaryLabel}>Cambio de Peso</div>
                  <div className={styles.summaryValue}>
                    {(physicalTests[physicalTests.length - 1].peso - physicalTests[0].peso).toFixed(1)} kg
                  </div>
                </div>
              </div>

              {physicalTests.some(t => t.brazo_extend_con_impulso) && (
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon}><FaDumbbell /></div>
                  <div className={styles.summaryInfo}>
                    <div className={styles.summaryLabel}>Progreso Salto</div>
                    <div className={styles.summaryValue}>
                      {(() => {
                        const testsConSalto = physicalTests.filter(t => t.brazo_extend_con_impulso);
                        if (testsConSalto.length < 2) return 'N/A';
                        const diff = testsConSalto[testsConSalto.length - 1].brazo_extend_con_impulso - testsConSalto[0].brazo_extend_con_impulso;
                        return `${diff > 0 ? '+' : ''}${diff} cm`;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}><FaCalendar /></div>
                <div className={styles.summaryInfo}>
                  <div className={styles.summaryLabel}>Último Test</div>
                  <div className={styles.summaryValue}>
                    {(() => {
                      const lastTest = new Date(latestTest.fecha_test);
                      const today = new Date();
                      const diffDays = Math.floor((today - lastTest) / (1000 * 60 * 60 * 24));
                      if (diffDays === 0) return 'Hoy';
                      if (diffDays === 1) return 'Ayer';
                      return `Hace ${diffDays} días`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IMC y Estado Actual */}
          {latestTest && imc && (
            <div className={styles.imcSection}>
              <div className={styles.imcCard} style={{ borderColor: imcInfo.color }}>
                <div className={styles.imcHeader}>
                  <span className={styles.imcIcon}>{imcInfo.icon}</span>
                  <h3>Índice de Masa Corporal</h3>
                </div>
                <div className={styles.imcValue} style={{ color: imcInfo.color }}>
                  {imc}
                </div>
                <div className={styles.imcCategory} style={{ color: imcInfo.color }}>
                  {imcInfo.category}
                </div>
                <div className={styles.imcScale}>
                  <div className={styles.scaleBar}>
                    <div className={styles.scaleSegment} style={{ background: '#ffeb3b', flex: 1 }}>
                      <span>&lt;18.5</span>
                    </div>
                    <div className={styles.scaleSegment} style={{ background: '#4caf50', flex: 1.5 }}>
                      <span>18.5-25</span>
                    </div>
                    <div className={styles.scaleSegment} style={{ background: '#ff9800', flex: 1 }}>
                      <span>25-30</span>
                    </div>
                    <div className={styles.scaleSegment} style={{ background: '#ff5252', flex: 1 }}>
                      <span>&gt;30</span>
                    </div>
                  </div>
                  <div className={styles.imcIndicator} style={{ 
                    left: `${Math.min(Math.max((parseFloat(imc) / 40) * 100, 0), 100)}%` 
                  }}>
                    ▼
                  </div>
                </div>
                <div className={styles.imcDetails}>
                  <div className={styles.imcDetailItem}>
                    <span>Peso:</span>
                    <strong>{latestTest.peso} kg</strong>
                  </div>
                  <div className={styles.imcDetailItem}>
                    <span>Estatura:</span>
                    <strong>{latestTest.estatura} m</strong>
                  </div>
                  {studentAge && (
                    <div className={styles.imcDetailItem}>
                      <span>Edad:</span>
                      <strong>{studentAge} años</strong>
                    </div>
                  )}
                  {studentData?.categoria && (
                    <div className={styles.imcDetailItem}>
                      <span>Categoría:</span>
                      <strong>{studentData.categoria}</strong>
                    </div>
                  )}
                  <div className={styles.imcDetailItem}>
                    <span>Última medición:</span>
                    <strong>
                      {new Date(latestTest.fecha_test + 'T00:00:00').toLocaleDateString('es-EC', {
                        timeZone: 'America/Guayaquil',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Plan de Alimentación */}
              {nutritionPlan && (
                <div className={styles.nutritionCard}>
                  <h3><FaUtensils style={{ marginRight: '10px' }} /> {nutritionPlan.title}</h3>
                  <p className={styles.nutritionIntro}>Recomendaciones nutricionales basadas en tu IMC y actividad deportiva:</p>
                  <ul className={styles.recommendationsList}>
                    {nutritionPlan.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                  <div className={styles.nutritionNote}>
                    <strong><FaLightbulb style={{ marginRight: '6px', verticalAlign: 'middle' }} />Nota:</strong> Estas son recomendaciones generales. Para un plan personalizado, consulta con un nutricionista deportivo.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gráficas de Progreso */}
          <div className={styles.progressSection}>
            <h3><FaChartLine style={{ marginRight: '10px', verticalAlign: 'middle' }} />Progreso en el Tiempo</h3>
            
            {/* Gráfica de Peso */}
            <div className={styles.chartCard}>
              <h4><FaWeight style={{ marginRight: '8px' }} /> Evolución del Peso (kg)</h4>
              <div className={styles.chart}>
                {physicalTests.map((test) => {
                  const maxPeso = Math.max(...physicalTests.map(t => t.peso));
                  const minPeso = Math.min(...physicalTests.map(t => t.peso));
                  const range = maxPeso - minPeso || 1;
                  const height = ((test.peso - minPeso) / range) * 80 + 20;
                  return (
                    <div key={test.id} className={styles.chartBar}>
                      <div 
                        className={styles.bar} 
                        style={{ height: `${height}%`, background: 'linear-gradient(135deg, #4caf50, #45a049)' }}
                        title={`${test.peso} kg`}
                      >
                        <span className={styles.barValue}>{test.peso}</span>
                      </div>
                      <span className={styles.barLabel}>
                        {new Date(test.fecha_test).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfica de Estatura */}
            {physicalTests.some(t => t.estatura) && (
              <div className={styles.chartCard}>
                <h4><FaRuler style={{ marginRight: '8px' }} />Estatura (m)</h4>
                <div className={styles.chart}>
                  {physicalTests.filter(t => t.estatura).map((test) => {
                    const testsConEstatura = physicalTests.filter(t => t.estatura);
                    const maxEstatura = Math.max(...testsConEstatura.map(t => t.estatura));
                    const minEstatura = Math.min(...testsConEstatura.map(t => t.estatura));
                    const range = maxEstatura - minEstatura || 0.01;
                    const height = ((test.estatura - minEstatura) / range) * 80 + 20;
                    return (
                      <div key={test.id} className={styles.chartBar}>
                        <div 
                          className={styles.bar} 
                          style={{ height: `${height}%`, background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)' }}
                          title={`${test.estatura} m`}
                        >
                          <span className={styles.barValue}>{test.estatura}</span>
                        </div>
                        <span className={styles.barLabel}>
                          {new Date(test.fecha_test).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gráfica de Brazo Extendido Inicial */}
            {physicalTests.some(t => t.brazo_extend_inicial) && (
              <div className={styles.chartCard}>
                <h4>🙌 Brazo Extendido Inicial (cm)</h4>
                <div className={styles.chart}>
                  {physicalTests.filter(t => t.brazo_extend_inicial).map((test) => {
                    const testsConBrazo = physicalTests.filter(t => t.brazo_extend_inicial);
                    const maxBrazo = Math.max(...testsConBrazo.map(t => t.brazo_extend_inicial));
                    const minBrazo = Math.min(...testsConBrazo.map(t => t.brazo_extend_inicial));
                    const range = maxBrazo - minBrazo || 1;
                    const height = ((test.brazo_extend_inicial - minBrazo) / range) * 80 + 20;
                    return (
                      <div key={test.id} className={styles.chartBar}>
                        <div 
                          className={styles.bar} 
                          style={{ height: `${height}%`, background: 'linear-gradient(135deg, #00bcd4, #0097a7)' }}
                          title={`${test.brazo_extend_inicial} cm`}
                        >
                          <span className={styles.barValue}>{test.brazo_extend_inicial}</span>
                        </div>
                        <span className={styles.barLabel}>
                          {new Date(test.fecha_test).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gráfica de Brazo Extendido Sin Impulso */}
            {physicalTests.some(t => t.brazo_extend_sin_impulso) && (
              <div className={styles.chartCard}>
                <h4>🤚 Brazo Extendido Sin Impulso (cm)</h4>
                <div className={styles.chart}>
                  {physicalTests.filter(t => t.brazo_extend_sin_impulso).map((test) => {
                    const testsConBrazo = physicalTests.filter(t => t.brazo_extend_sin_impulso);
                    const maxBrazo = Math.max(...testsConBrazo.map(t => t.brazo_extend_sin_impulso));
                    const minBrazo = Math.min(...testsConBrazo.map(t => t.brazo_extend_sin_impulso));
                    const range = maxBrazo - minBrazo || 1;
                    const height = ((test.brazo_extend_sin_impulso - minBrazo) / range) * 80 + 20;
                    return (
                      <div key={test.id} className={styles.chartBar}>
                        <div 
                          className={styles.bar} 
                          style={{ height: `${height}%`, background: 'linear-gradient(135deg, #03a9f4, #0288d1)' }}
                          title={`${test.brazo_extend_sin_impulso} cm`}
                        >
                          <span className={styles.barValue}>{test.brazo_extend_sin_impulso}</span>
                        </div>
                        <span className={styles.barLabel}>
                          {new Date(test.fecha_test).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gráfica de Brazo Extendido Con Impulso */}
            {physicalTests.some(t => t.brazo_extend_con_impulso) && (
              <div className={styles.chartCard}>
                <h4><FaDumbbell style={{ marginRight: '8px' }} /> Brazo Extendido Con Impulso (cm)</h4>
                <div className={styles.chart}>
                  {physicalTests.filter(t => t.brazo_extend_con_impulso).map((test) => {
                    const testsConBrazo = physicalTests.filter(t => t.brazo_extend_con_impulso);
                    const maxBrazo = Math.max(...testsConBrazo.map(t => t.brazo_extend_con_impulso));
                    const minBrazo = Math.min(...testsConBrazo.map(t => t.brazo_extend_con_impulso));
                    const range = maxBrazo - minBrazo || 1;
                    const height = ((test.brazo_extend_con_impulso - minBrazo) / range) * 80 + 20;
                    return (
                      <div key={test.id} className={styles.chartBar}>
                        <div 
                          className={styles.bar} 
                          style={{ height: `${height}%`, background: 'linear-gradient(135deg, #2196F3, #1976D2)' }}
                          title={`${test.brazo_extend_con_impulso} cm`}
                        >
                          <span className={styles.barValue}>{test.brazo_extend_con_impulso}</span>
                        </div>
                        <span className={styles.barLabel}>
                          {new Date(test.fecha_test).toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Historial de Tests */}
          <div className={styles.testsHistory}>
            <h3><FaClipboardList style={{ marginRight: '10px' }} /> Historial Completo de Tests Físicos</h3>
            <div className={styles.testsTable}>
              {[...physicalTests].reverse().map((test) => {
                const testIMC = calculateIMC(test.peso, test.estatura);
                const testIMCInfo = testIMC ? getIMCCategory(testIMC) : null;
                
                return (
                  <div key={test.id} className={styles.testRow}>
                    <div className={styles.testHeader}>
                      <div className={styles.testDate}>
                        <FaCalendar style={{ marginRight: '8px', verticalAlign: 'middle' }} />{new Date(test.fecha_test + 'T00:00:00').toLocaleDateString('es-EC', {
                          timeZone: 'America/Guayaquil',
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {testIMCInfo && (
                        <div className={styles.testIMCBadge} style={{ background: testIMCInfo.color }}>
                          IMC: {testIMC} - {testIMCInfo.category}
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.testMetricsGrid}>
                      <div className={styles.metricCard}>
                        <div className={styles.metricIcon}><FaWeight /></div>
                        <div className={styles.metricInfo}>
                          <div className={styles.metricLabel}>Peso</div>
                          <div className={styles.metricValue}>{test.peso} kg</div>
                        </div>
                      </div>

                      <div className={styles.metricCard}>
                        <div className={styles.metricIcon}><FaRuler /></div>
                        <div className={styles.metricInfo}>
                          <div className={styles.metricLabel}>Estatura</div>
                          <div className={styles.metricValue}>{test.estatura} m</div>
                        </div>
                      </div>

                      {test.brazo_extend_inicial && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}>🙌</div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Brazo Ext. Inicial</div>
                            <div className={styles.metricValue}>{test.brazo_extend_inicial} cm</div>
                          </div>
                        </div>
                      )}

                      {test.brazo_extend_sin_impulso && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}>🤚</div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Sin Impulso</div>
                            <div className={styles.metricValue}>{test.brazo_extend_sin_impulso} cm</div>
                          </div>
                        </div>
                      )}

                      {test.brazo_extend_con_impulso && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}><FaDumbbell /></div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Con Impulso</div>
                            <div className={styles.metricValue}>{test.brazo_extend_con_impulso} cm</div>
                          </div>
                        </div>
                      )}

                      {test.fuerza_abdomen && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}><FaFire /></div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Abdominales (1min)</div>
                            <div className={styles.metricValue}>{test.fuerza_abdomen} reps</div>
                          </div>
                        </div>
                      )}

                      {test.fuerza_brazos && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}><FaDumbbell /></div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Flexiones (1min)</div>
                            <div className={styles.metricValue}>{test.fuerza_brazos} reps</div>
                          </div>
                        </div>
                      )}

                      {test.fuerza_piernas && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}><FaRunning /></div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Sentadillas (1min)</div>
                            <div className={styles.metricValue}>{test.fuerza_piernas} reps</div>
                          </div>
                        </div>
                      )}

                      {test.elevaciones_barra && (
                        <div className={styles.metricCard}>
                          <div className={styles.metricIcon}><FaDumbbell /></div>
                          <div className={styles.metricInfo}>
                            <div className={styles.metricLabel}>Elevaciones (1min)</div>
                            <div className={styles.metricValue}>{test.elevaciones_barra} reps</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.noData}>
          <p><FaChartBar style={{ marginRight: '8px', verticalAlign: 'middle' }} />Aún no tienes tests físicos registrados</p>
          <p>Los entrenadores realizarán evaluaciones periódicas para monitorear tu progreso</p>
        </div>
      )}
    </div>
  );
};

StudentPhysicalTests.propTypes = {
  physicalTests: PropTypes.array.isRequired,
  studentData: PropTypes.object,
  onRefresh: PropTypes.func.isRequired
};

export default StudentPhysicalTests;
