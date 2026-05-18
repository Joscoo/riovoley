// src/features/physical-tests/presentation/components/shared/PhysicalTestChart.js
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { FaChartBar } from 'react-icons/fa';
import { Button } from '../../../../../shared/ui';
import { Card } from '../../../../../shared/ui';
import { EmptyState } from '../../../../../shared/ui';

const METRICS = [
  { key: 'peso', label: 'Peso', color: '#8B5CF6', unit: 'kg' },
  { key: 'estatura', label: 'Estatura', color: '#22C55E', unit: 'm' },
  { key: 'brazo_extend_inicial', label: 'Brazo Extendido', color: '#F59E0B', unit: 'cm' },
  { key: 'brazo_extend_sin_impulso', label: 'Brazo Sin Impulso', color: '#F97316', unit: 'cm' },
  { key: 'brazo_extend_con_impulso', label: 'Brazo Con Impulso', color: '#0EA5E9', unit: 'cm' },
  { key: 'fuerza_explosiva_salto_largo', label: 'Salto Largo', color: '#EC4899', unit: 'm' },
  { key: 'envergadura_brazos_extendidos_lateral', label: 'Envergadura', color: '#06B6D4', unit: 'cm' },
  { key: 'fuerza_abdomen', label: 'Abdominales', color: '#EF4444', unit: 'reps' },
  { key: 'fuerza_brazos', label: 'Flexiones', color: '#14B8A6', unit: 'reps' },
  { key: 'fuerza_piernas', label: 'Sentadillas', color: '#34D399', unit: 'reps' },
  { key: 'elevaciones_barra', label: 'Elevaciones', color: '#FB7185', unit: 'reps' }
];

const CHART_VIEWS = {
  evolution: 'evolution',
  comparison: 'comparison',
  progress: 'progress'
};

const formatShortDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Guayaquil'
  });

const formatLongDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Guayaquil'
  });

const toNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getMetricTextClass = (metricKey) => {
  if (metricKey === 'peso') return 'text-violet-300';
  if (metricKey === 'estatura') return 'text-green-300';
  if (metricKey === 'brazo_extend_inicial') return 'text-amber-300';
  if (metricKey === 'brazo_extend_sin_impulso') return 'text-orange-300';
  if (metricKey === 'brazo_extend_con_impulso') return 'text-sky-300';
  if (metricKey === 'fuerza_explosiva_salto_largo') return 'text-pink-300';
  if (metricKey === 'envergadura_brazos_extendidos_lateral') return 'text-cyan-300';
  if (metricKey === 'fuerza_abdomen') return 'text-red-300';
  if (metricKey === 'fuerza_brazos') return 'text-teal-300';
  if (metricKey === 'fuerza_piernas') return 'text-emerald-300';
  if (metricKey === 'elevaciones_barra') return 'text-rose-300';
  return 'text-slate-200';
};

const WIDTH_BUCKETS = [
  { min: 100, className: 'w-full' },
  { min: 95, className: 'w-[95%]' },
  { min: 90, className: 'w-[90%]' },
  { min: 85, className: 'w-[85%]' },
  { min: 80, className: 'w-4/5' },
  { min: 75, className: 'w-3/4' },
  { min: 70, className: 'w-[70%]' },
  { min: 65, className: 'w-[65%]' },
  { min: 60, className: 'w-3/5' },
  { min: 55, className: 'w-[55%]' },
  { min: 50, className: 'w-1/2' },
  { min: 45, className: 'w-[45%]' },
  { min: 40, className: 'w-2/5' },
  { min: 35, className: 'w-[35%]' },
  { min: 30, className: 'w-[30%]' },
  { min: 25, className: 'w-1/4' },
  { min: 20, className: 'w-1/5' },
  { min: 15, className: 'w-[15%]' },
  { min: 10, className: 'w-[10%]' },
  { min: 5, className: 'w-[5%]' }
];

const getWidthClass = (percentage) => {
  const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0));
  const bucket = WIDTH_BUCKETS.find((item) => safePercentage >= item.min);
  return bucket?.className || 'w-0';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const info = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-white/20 bg-slate-950/90 p-3 text-xs text-slate-100 shadow-xl">
      <p className="font-bold">{`Test #${label}`}</p>
      <p className="mb-2 text-slate-300">{info?.fechaCompleta || ''}</p>
      {payload.map((entry) => {
        const metric = METRICS.find((item) => item.key === entry.dataKey);
        return (
          <p key={`${entry.dataKey}-${entry.value}`} className={getMetricTextClass(entry.dataKey)}>
            {`${entry.name}: ${entry.value}${metric?.unit || ''}`}
          </p>
        );
      })}
    </div>
  );
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const PhysicalTestChart = ({ tests }) => {
  const [selectedMetric, setSelectedMetric] = useState('peso');
  const [view, setView] = useState(CHART_VIEWS.evolution);

  const evolutionData = useMemo(
    () =>
      tests.map((test, index) => {
        const row = {
          testNumber: index + 1,
          fecha: formatShortDate(test.fecha_test),
          fechaCompleta: formatLongDate(test.fecha_test)
        };

        METRICS.forEach((metric) => {
          const metricValue = toNumeric(test[metric.key]);
          if (metricValue !== null) {
            row[metric.key] = metricValue;
          }
        });

        return row;
      }),
    [tests]
  );

  const progressData = useMemo(() => {
    if (tests.length < 2) return {};

    const firstTest = tests[0];
    const lastTest = tests[tests.length - 1];
    const result = {};

    METRICS.forEach((metric) => {
      const first = toNumeric(firstTest[metric.key]);
      const last = toNumeric(lastTest[metric.key]);
      if (first === null || last === null || first === 0) return;

      const delta = last - first;
      const percentage = (delta / first) * 100;

      result[metric.key] = {
        first,
        last,
        delta,
        percentage,
        improved: delta > 0
      };
    });

    return result;
  }, [tests]);

  const comparisonData = useMemo(
    () =>
      METRICS.filter((metric) => progressData[metric.key]).map((metric) => ({
        metric: metric.label,
        primerTest: progressData[metric.key].first,
        ultimoTest: progressData[metric.key].last
      })),
    [progressData]
  );

  const selectedMetricInfo = METRICS.find((metric) => metric.key === selectedMetric);

  if (tests.length < 2) {
    return (
      <EmptyState
        icon={<FaChartBar />}
        title="Grafica de evolucion no disponible"
        description={`Se necesitan al menos 2 tests fisicos. Actualmente hay ${tests.length}.`}
      />
    );
  }

  return (
    <Card className="border-white/20 bg-black/25" padding="lg">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={view === CHART_VIEWS.evolution ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setView(CHART_VIEWS.evolution)}
        >
          Evolucion
        </Button>
        <Button
          variant={view === CHART_VIEWS.comparison ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setView(CHART_VIEWS.comparison)}
        >
          Comparacion
        </Button>
        <Button
          variant={view === CHART_VIEWS.progress ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setView(CHART_VIEWS.progress)}
        >
          Progreso
        </Button>
      </div>

      {view === CHART_VIEWS.evolution ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 mobile:flex-row mobile:items-center">
            <label htmlFor="metric-select" className="text-sm font-semibold text-slate-200">
              Metrica:
            </label>
            <select
              id="metric-select"
              className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-rv-gold/70 mobile:max-w-sm"
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
            >
              {METRICS.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label} ({metric.unit})
                </option>
              ))}
            </select>
          </div>

          <h4 className="text-base font-bold text-white">
            Evolucion de {selectedMetricInfo?.label}
          </h4>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="testNumber" tick={{ fill: '#cbd5e1' }} />
                <YAxis tick={{ fill: '#cbd5e1' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  name={selectedMetricInfo?.label}
                  stroke={selectedMetricInfo?.color}
                  strokeWidth={3}
                  dot={{ fill: selectedMetricInfo?.color, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {view === CHART_VIEWS.comparison ? (
        <div className="space-y-3">
          <h4 className="text-base font-bold text-white">Comparacion primer test vs ultimo test</h4>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                <YAxis tick={{ fill: '#cbd5e1' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="primerTest"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  name="Primer Test"
                />
                <Line
                  type="monotone"
                  dataKey="ultimoTest"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', r: 4 }}
                  name="Ultimo Test"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {view === CHART_VIEWS.progress ? (
        <div className="space-y-3">
          <h4 className="text-base font-bold text-white">Resumen de progreso</h4>
          <div className="grid gap-3 tablet:grid-cols-2">
            {Object.entries(progressData).map(([metricKey, progress]) => {
              const metric = METRICS.find((item) => item.key === metricKey);
              const percentageWidth = Math.min(100, Math.abs(progress.percentage));
              const widthClass = getWidthClass(percentageWidth);
              return (
                <Card key={metricKey} className="border-white/15 bg-black/30" padding="sm">
                  <p className="text-sm font-bold text-white">{metric?.label}</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-200">
                    <p>Inicial: {progress.first}{metric?.unit}</p>
                    <p>Actual: {progress.last}{metric?.unit}</p>
                    <p className={progress.improved ? 'text-emerald-300' : 'text-red-300'}>
                      Cambio: {progress.improved ? '+' : ''}{progress.delta.toFixed(2)}{metric?.unit}
                      {' '}
                      ({progress.improved ? '+' : ''}{progress.percentage.toFixed(1)}%)
                    </p>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className={`${progress.improved ? 'bg-emerald-400' : 'bg-red-400'} ${widthClass} h-full`}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </Card>
  );
};

PhysicalTestChart.propTypes = {
  tests: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default PhysicalTestChart;

