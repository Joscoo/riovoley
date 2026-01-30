// src/components/PhysicalTestChart.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import styles from '../styles/PhysicalTestChart.module.css';
import { FaChartBar } from 'react-icons/fa';
  Legend,
  ResponsiveContainer
} from 'recharts';
import styles from '../styles/PhysicalTestChart.module.css';

const PhysicalTestChart = ({ tests }) => {
  const [selectedMetric, setSelectedMetric] = useState('peso');
  const [chartType, setChartType] = useState('evolution');

  // Métricas disponibles para mostrar
  const metrics = [
    { key: 'peso', label: 'Peso (kg)', color: '#8884d8', unit: 'kg' },
    { key: 'estatura', label: 'Estatura (m)', color: '#82ca9d', unit: 'm' },
    { key: 'brazo_extend_inicial', label: 'Brazo Extendido (cm)', color: '#ffc658', unit: 'cm' },
    { key: 'brazo_extend_sin_impulso', label: 'Brazo Sin Impulso (cm)', color: '#ff7300', unit: 'cm' },
    { key: 'brazo_extend_con_impulso', label: 'Brazo Con Impulso (cm)', color: '#8dd1e1', unit: 'cm' },
    { key: 'fuerza_explosiva_salto_largo', label: 'Salto Largo (m)', color: '#d084d0', unit: 'm' },
    { key: 'envergadura_brazos_extendidos_lateral', label: 'Envergadura (cm)', color: '#ffb347', unit: 'cm' },
    { key: 'fuerza_abdomen', label: 'Abdominales (reps/min)', color: '#ff6b6b', unit: 'reps' },
    { key: 'fuerza_brazos', label: 'Flexiones (reps/min)', color: '#4ecdc4', unit: 'reps' },
    { key: 'fuerza_piernas', label: 'Sentadillas (reps/min)', color: '#95e1d3', unit: 'reps' },
    { key: 'elevaciones_barra', label: 'Elevaciones (reps/min)', color: '#f38181', unit: 'reps' }
  ];

  // Preparar datos para el gráfico de evolución
  const evolutionData = tests.map((test, index) => {
    const dataPoint = {
      testNumber: index + 1,
      fecha: new Date(test.fecha_test).toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      fecha_completa: new Date(test.fecha_test).toLocaleDateString('es-AR')
    };

    metrics.forEach(metric => {
      if (test[metric.key] !== null && test[metric.key] !== undefined) {
        dataPoint[metric.key] = parseFloat(test[metric.key]);
      }
    });

    return dataPoint;
  });

  // Calcular métricas de progreso para el último test vs el primero
  const calculateProgress = () => {
    if (tests.length < 2) return {};

    const firstTest = tests[0];
    const lastTest = tests[tests.length - 1];
    const progress = {};

    metrics.forEach(metric => {
      const firstValue = firstTest[metric.key];
      const lastValue = lastTest[metric.key];

      if (firstValue && lastValue) {
        const difference = lastValue - firstValue;
        const percentageChange = ((difference / firstValue) * 100).toFixed(1);
        progress[metric.key] = {
          first: firstValue,
          last: lastValue,
          difference: difference.toFixed(2),
          percentage: percentageChange,
          improvement: difference > 0
        };
      }
    });

    return progress;
  };

  const progress = calculateProgress();

  // Datos para gráfico de comparación (primer vs último test)
  const comparisonData = metrics
    .filter(metric => progress[metric.key])
    .map(metric => ({
      metric: metric.label,
      primer_test: progress[metric.key].first,
      ultimo_test: progress[metric.key].last,
      diferencia: parseFloat(progress[metric.key].difference)
    }));

  // Función para el tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>
            {`Test #${label} - ${data.fecha_completa}`}
          </p>
          {payload.map(entry => (
            <p key={entry.dataKey} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${metrics.find(m => m.key === entry.dataKey)?.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Colores para el gráfico de barras
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  return (
    <div className={styles.chartContainer}>
      {/* Controles de la gráfica */}
      <div className={styles.chartControls}>
        <div className={styles.chartTypeSelector}>
          <button
            className={`${styles.controlButton} ${chartType === 'evolution' ? styles.active : ''}`}
            onClick={() => setChartType('evolution')}
          >
            📈 Evolución
          </button>
          <button
            className={`${styles.controlButton} ${chartType === 'comparison' ? styles.active : ''}`}
            onClick={() => setChartType('comparison')}
          >
            ⚖️ Comparación
          </button>
          <button
            className={`${styles.controlButton} ${chartType === 'progress' ? styles.active : ''}`}
            onClick={() => setChartType('progress')}
          >
            📊 Progreso
          </button>
        </div>

        {chartType === 'evolution' && (
          <div className={styles.metricSelector}>
            <label>Métrica a mostrar:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className={styles.metricSelect}
            >
              {metrics.map(metric => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Gráficas */}
      <div className={styles.chartContent}>
        {chartType === 'evolution' && (
          <div className={styles.evolutionChart}>
            <h4>
              Evolución de {metrics.find(m => m.key === selectedMetric)?.label}
            </h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="testNumber" 
                  label={{ value: 'Número de Test', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ 
                    value: metrics.find(m => m.key === selectedMetric)?.unit || '', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={metrics.find(m => m.key === selectedMetric)?.color}
                  strokeWidth={3}
                  dot={{ fill: metrics.find(m => m.key === selectedMetric)?.color, strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                  name={metrics.find(m => m.key === selectedMetric)?.label}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'comparison' && comparisonData.length > 0 && (
          <div className={styles.comparisonChart}>
            <h4>Comparación: Primer Test vs Último Test</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="metric" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="primer_test"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ fill: "#8884d8", strokeWidth: 2, r: 5 }}
                  name="Primer Test"
                />
                <Line
                  type="monotone"
                  dataKey="ultimo_test"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ fill: "#82ca9d", strokeWidth: 2, r: 5 }}
                  name="Último Test"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'progress' && Object.keys(progress).length > 0 && (
          <div className={styles.progressChart}>
            <h4>Resumen de Progreso</h4>
            <div className={styles.progressGrid}>
              {Object.entries(progress).map(([metricKey, data], index) => {
                const metric = metrics.find(m => m.key === metricKey);
                return (
                  <div key={metricKey} className={styles.progressCard}>
                    <h5>{metric?.label}</h5>
                    <div className={styles.progressValues}>
                      <div className={styles.progressValue}>
                        <span className={styles.progressLabel}>Inicial:</span>
                        <span>{data.first}{metric?.unit}</span>
                      </div>
                      <div className={styles.progressValue}>
                        <span className={styles.progressLabel}>Actual:</span>
                        <span>{data.last}{metric?.unit}</span>
                      </div>
                      <div className={`${styles.progressChange} ${data.improvement ? styles.positive : styles.negative}`}>
                        <span className={styles.progressLabel}>Cambio:</span>
                        <span>
                          {data.improvement ? '+' : ''}{data.difference}{metric?.unit}
                          <small>({data.improvement ? '+' : ''}{data.percentage}%)</small>
                        </span>
                      </div>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${Math.abs(parseFloat(data.percentage))}%`,
                          backgroundColor: data.improvement ? '#4CAF50' : '#FF5722'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay suficientes datos */}
        {tests.length < 2 && (
          <div className={styles.insufficientData}>
            <h4><FaChartBar style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Gráfica de Evolución</h4>
            <p>Se necesitan al menos 2 tests físicos para mostrar la evolución</p>
            <p>Actual: {tests.length} test{tests.length !== 1 ? 's' : ''} registrado{tests.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

PhysicalTestChart.propTypes = {
  tests: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default PhysicalTestChart;