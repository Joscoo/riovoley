// src/components/student/StudentPhysicalTests.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  FaCalendar,
  FaChartBar,
  FaChartLine,
  FaCheckCircle,
  FaClipboardList,
  FaDumbbell,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaFire,
  FaLightbulb,
  FaRuler,
  FaRunning,
  FaSyncAlt,
  FaUtensils,
  FaWeight
} from 'react-icons/fa';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import SectionHeader from '../ui/SectionHeader';
import { cn } from '../../lib/cn';

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatShortDate = (value) => {
  if (!value) return 'N/A';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    month: 'short',
    day: 'numeric'
  });
};

const formatLongDate = (value) => {
  if (!value) return 'N/A';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const calculateIMC = (peso, estatura) => {
  const pesoValue = toNumber(peso);
  const estaturaValue = toNumber(estatura);
  if (!pesoValue || !estaturaValue || estaturaValue === 0) return null;
  return (pesoValue / (estaturaValue * estaturaValue)).toFixed(2);
};

const getIMCCategory = (imc) => {
  const value = Number(imc);
  if (!Number.isFinite(value)) return null;

  if (value < 18.5) {
    return {
      category: 'Bajo peso',
      tone: 'text-amber-200',
      border: 'border-amber-300/45',
      badge: 'bg-amber-500/20 text-amber-200 border-amber-300/40',
      icon: <FaExclamationTriangle className="text-amber-300" />
    };
  }

  if (value < 25) {
    return {
      category: 'Peso normal',
      tone: 'text-emerald-200',
      border: 'border-emerald-300/45',
      badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-300/40',
      icon: <FaCheckCircle className="text-emerald-300" />
    };
  }

  if (value < 30) {
    return {
      category: 'Sobrepeso',
      tone: 'text-orange-200',
      border: 'border-orange-300/45',
      badge: 'bg-orange-500/20 text-orange-200 border-orange-300/40',
      icon: <FaExclamationTriangle className="text-orange-300" />
    };
  }

  return {
    category: 'Obesidad',
    tone: 'text-red-200',
    border: 'border-red-300/45',
    badge: 'bg-red-500/20 text-red-200 border-red-300/40',
    icon: <FaExclamationCircle className="text-red-300" />
  };
};

const getNutritionRecommendation = (imc) => {
  const imcValue = Number(imc);
  if (!Number.isFinite(imcValue)) return null;

  if (imcValue < 18.5) {
    return {
      title: 'Aumentar masa muscular',
      recommendations: [
        'Aumenta la ingesta de proteinas: carnes magras, huevos y legumbres.',
        'Consume grasas saludables: frutos secos, aguacate y aceite de oliva.',
        'Incrementa carbohidratos complejos: arroz integral, avena y batata.',
        'Incluye trabajo de fuerza junto con la practica de voleibol.',
        'Come 5 o 6 comidas pequenas para mantener energia estable.'
      ]
    };
  }

  if (imcValue < 25) {
    return {
      title: 'Mantener peso saludable',
      recommendations: [
        'Dieta balanceada con buen reparto de carbohidratos, proteinas y grasas.',
        'Prioriza proteinas magras: pollo, pescado y claras de huevo.',
        'Incluye vegetales y frutas para vitaminas, minerales y recuperacion.',
        'Hidratate de forma constante durante el dia.',
        'Usa snacks pre-entreno funcionales: banana o frutos secos.'
      ]
    };
  }

  if (imcValue < 30) {
    return {
      title: 'Reducir grasa corporal',
      recommendations: [
        'Aumenta vegetales y reduce carbohidratos simples.',
        'Mantene proteinas magras en cada comida para conservar masa muscular.',
        'Evita bebidas azucaradas, frituras y comida procesada.',
        'Complementa el voleibol con trabajo cardiovascular.',
        'Controla porciones y evita comidas pesadas cerca de la noche.'
      ]
    };
  }

  return {
    title: 'Plan de reduccion de peso',
    recommendations: [
      'Consulta con nutricionista para un plan individualizado.',
      'Usa una dieta hipocalorica con buena densidad nutricional.',
      'Inicia con ejercicio de baja intensidad y aumenta gradualmente.',
      'Monitorea avances de manera periodica para ajustar el plan.',
      'Prioriza cambios de habitos sostenibles a largo plazo.'
    ]
  };
};

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const buildSeries = (tests, key) =>
  tests
    .map((test) => ({ ...test, metric: toNumber(test[key]) }))
    .filter((test) => test.metric !== null);

const HEIGHT_BUCKETS = [
  { min: 96, className: 'h-52' },
  { min: 90, className: 'h-48' },
  { min: 84, className: 'h-44' },
  { min: 78, className: 'h-40' },
  { min: 72, className: 'h-36' },
  { min: 66, className: 'h-32' },
  { min: 60, className: 'h-28' },
  { min: 54, className: 'h-24' },
  { min: 48, className: 'h-20' },
  { min: 42, className: 'h-16' },
  { min: 36, className: 'h-14' },
  { min: 30, className: 'h-12' },
  { min: 24, className: 'h-12' }
];

const getHeightClass = (height) => {
  const safeHeight = Math.max(24, Math.min(100, Number(height) || 24));
  const bucket = HEIGHT_BUCKETS.find((item) => safeHeight >= item.min);
  return bucket?.className || 'h-12';
};

const ProgressChart = ({ title, icon, tests, metricKey, unit, barClass }) => {
  const series = buildSeries(tests, metricKey);
  if (series.length === 0) return null;

  const values = series.map((entry) => entry.metric);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  return (
    <Card className="border-white/20 bg-black/35">
      <h4 className="mb-4 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-white/90 mobile:text-base">
        <span className="text-rv-gold">{icon}</span>
        {title}
      </h4>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-end gap-2 rounded-xl bg-black/25 p-3 mobile:gap-3">
          {series.map((test) => {
            const height = ((test.metric - minValue) / range) * 76 + 24;
            const heightClass = getHeightClass(height);
            return (
              <div key={test.id} className="flex w-14 shrink-0 flex-col items-center mobile:w-16">
                <div
                  className={cn(
                    'relative flex w-full min-h-[48px] items-end justify-center rounded-t-xl border border-white/15',
                    heightClass,
                    barClass
                  )}
                  title={`${test.metric} ${unit}`}
                >
                  <span className="absolute -top-5 text-[11px] font-bold text-slate-200">
                    {test.metric}
                  </span>
                </div>
                <span className="mt-2 text-center text-[11px] font-semibold text-slate-300">
                  {formatShortDate(test.fecha_test)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

ProgressChart.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  tests: PropTypes.array.isRequired,
  metricKey: PropTypes.string.isRequired,
  unit: PropTypes.string.isRequired,
  barClass: PropTypes.string.isRequired
};

const StudentPhysicalTests = ({ physicalTests, studentData, onRefresh }) => {
  const latestTest = physicalTests.length > 0 ? physicalTests[physicalTests.length - 1] : null;
  const imc = latestTest ? calculateIMC(latestTest.peso, latestTest.estatura) : null;
  const imcInfo = imc ? getIMCCategory(imc) : null;
  const nutritionPlan = imc ? getNutritionRecommendation(imc) : null;
  const studentAge = studentData?.fecha_nacimiento ? calculateAge(studentData.fecha_nacimiento) : null;

  const testsWithJump = buildSeries(physicalTests, 'brazo_extend_con_impulso');
  const jumpProgress =
    testsWithJump.length >= 2
      ? (testsWithJump[testsWithJump.length - 1].metric - testsWithJump[0].metric).toFixed(1)
      : null;

  const weightSeries = buildSeries(physicalTests, 'peso');
  const weightDelta =
    weightSeries.length >= 2
      ? (weightSeries[weightSeries.length - 1].metric - weightSeries[0].metric).toFixed(1)
      : null;

  const daysSinceLastTest = (() => {
    if (!latestTest?.fecha_test) return null;
    const lastTestDate = new Date(`${latestTest.fecha_test}T00:00:00`);
    const today = new Date();
    return Math.floor((today - lastTestDate) / (1000 * 60 * 60 * 24));
  })();

  return (
    <Card className="border-rv-gold/20 bg-black/30" padding="lg">
      <SectionHeader
        title="Tests Fisicos y Rendimiento"
        subtitle="Monitorea tu progreso y revisa recomendaciones en base a tu ultima evaluacion."
        icon={<FaDumbbell />}
        actions={(
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            <FaSyncAlt className="mr-2" />
            Actualizar
          </Button>
        )}
      />

      {physicalTests.length === 0 ? (
        <EmptyState
          icon={<FaChartBar />}
          title="Aun no tienes tests fisicos registrados"
          description="Los entrenadores realizaran evaluaciones periodicas para monitorear tu progreso."
        />
      ) : (
        <div className="space-y-4 mobile:space-y-5">
          {physicalTests.length > 1 ? (
            <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-4">
              <Card className="border-white/20 bg-black/35" padding="sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Total de tests</p>
                <p className="mt-1 text-3xl font-black text-white">{physicalTests.length}</p>
              </Card>

              <Card className="border-white/20 bg-black/35" padding="sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Cambio de peso</p>
                <p className="mt-1 text-3xl font-black text-white">
                  {weightDelta !== null ? `${Number(weightDelta) > 0 ? '+' : ''}${weightDelta} kg` : 'N/A'}
                </p>
              </Card>

              <Card className="border-white/20 bg-black/35" padding="sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Progreso de salto</p>
                <p className="mt-1 text-3xl font-black text-white">
                  {jumpProgress !== null ? `${Number(jumpProgress) > 0 ? '+' : ''}${jumpProgress} cm` : 'N/A'}
                </p>
              </Card>

              <Card className="border-white/20 bg-black/35" padding="sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Ultimo test</p>
                <p className="mt-1 text-xl font-black text-white">
                  {daysSinceLastTest === 0 ? 'Hoy' : daysSinceLastTest === 1 ? 'Ayer' : `Hace ${daysSinceLastTest} dias`}
                </p>
              </Card>
            </div>
          ) : null}

          {latestTest && imc && imcInfo ? (
            <div className="grid gap-4 desktop:grid-cols-[1.15fr_1fr]">
              <Card className={cn('border-2 bg-black/40', imcInfo.border)}>
                <h3 className="inline-flex items-center gap-2 text-lg font-extrabold text-white">
                  {imcInfo.icon}
                  Indice de Masa Corporal
                </h3>
                <p className={cn('mt-2 text-4xl font-black', imcInfo.tone)}>{imc}</p>
                <p className={cn('mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', imcInfo.badge)}>
                  {imcInfo.category}
                </p>

                <div className="mt-4 space-y-2 rounded-xl border border-white/15 bg-black/30 p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
                    <p>Peso: <strong className="text-white">{latestTest.peso} kg</strong></p>
                    <p>Estatura: <strong className="text-white">{latestTest.estatura} m</strong></p>
                    {studentAge ? <p>Edad: <strong className="text-white">{studentAge} anios</strong></p> : null}
                    {studentData?.categoria ? <p>Categoria: <strong className="text-white">{studentData.categoria}</strong></p> : null}
                  </div>
                  <p className="text-xs font-semibold text-slate-300">
                    Ultima medicion: {formatLongDate(latestTest.fecha_test)}
                  </p>
                </div>
              </Card>

              {nutritionPlan ? (
                <Card className="border-emerald-300/35 bg-emerald-900/15">
                  <h3 className="inline-flex items-center gap-2 text-lg font-extrabold text-white">
                    <FaUtensils className="text-emerald-300" />
                    {nutritionPlan.title}
                  </h3>
                  <p className="mt-2 text-sm text-emerald-100">
                    Recomendaciones nutricionales generales segun tu IMC y carga deportiva:
                  </p>
                  <ul className="mt-3 space-y-2">
                    {nutritionPlan.recommendations.map((recommendation) => (
                      <li key={recommendation} className="rounded-lg border border-emerald-200/20 bg-black/20 p-2 text-sm text-slate-100">
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 inline-flex items-start gap-2 text-xs font-semibold text-emerald-100">
                    <FaLightbulb className="mt-0.5 shrink-0" />
                    Estas recomendaciones son referenciales. Para un plan personalizado, consulta con nutricionista deportivo.
                  </p>
                </Card>
              ) : null}
            </div>
          ) : null}

          <Card className="border-white/20 bg-black/35">
            <h3 className="inline-flex items-center gap-2 text-lg font-extrabold text-white">
              <FaChartLine className="text-rv-gold" />
              Progreso en el tiempo
            </h3>
            <div className="mt-4 grid gap-3 desktop:grid-cols-2">
              <ProgressChart
                title="Evolucion del peso"
                icon={<FaWeight />}
                tests={physicalTests}
                metricKey="peso"
                unit="kg"
                barClass="bg-gradient-to-br from-emerald-500 to-emerald-700"
              />
              <ProgressChart
                title="Estatura"
                icon={<FaRuler />}
                tests={physicalTests}
                metricKey="estatura"
                unit="m"
                barClass="bg-gradient-to-br from-cyan-500 to-sky-700"
              />
              <ProgressChart
                title="Brazo extendido inicial"
                icon={<FaDumbbell />}
                tests={physicalTests}
                metricKey="brazo_extend_inicial"
                unit="cm"
                barClass="bg-gradient-to-br from-cyan-500 to-cyan-700"
              />
              <ProgressChart
                title="Brazo sin impulso"
                icon={<FaDumbbell />}
                tests={physicalTests}
                metricKey="brazo_extend_sin_impulso"
                unit="cm"
                barClass="bg-gradient-to-br from-blue-500 to-blue-700"
              />
              <ProgressChart
                title="Brazo con impulso"
                icon={<FaDumbbell />}
                tests={physicalTests}
                metricKey="brazo_extend_con_impulso"
                unit="cm"
                barClass="bg-gradient-to-br from-amber-500 to-amber-700"
              />
            </div>
          </Card>

          <Card className="border-white/20 bg-black/35">
            <h3 className="inline-flex items-center gap-2 text-lg font-extrabold text-white">
              <FaClipboardList className="text-rv-gold" />
              Historial de tests fisicos
            </h3>
            <div className="mt-4 space-y-3">
              {[...physicalTests].reverse().map((test) => {
                const testIMC = calculateIMC(test.peso, test.estatura);
                const testIMCInfo = testIMC ? getIMCCategory(testIMC) : null;

                return (
                  <Card key={test.id} className="border-white/15 bg-black/30" padding="sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="inline-flex items-center gap-2 text-sm font-bold capitalize text-slate-200 mobile:text-base">
                        <FaCalendar className="text-rv-gold" />
                        {formatLongDate(test.fecha_test)}
                      </p>
                      {testIMCInfo ? (
                        <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide', testIMCInfo.badge)}>
                          IMC {testIMC} - {testIMCInfo.category}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-2 mobile:grid-cols-2 desktop:grid-cols-3">
                      <MetricCard icon={<FaWeight />} label="Peso" value={`${test.peso} kg`} />
                      <MetricCard icon={<FaRuler />} label="Estatura" value={`${test.estatura} m`} />
                      {test.brazo_extend_inicial != null ? (
                        <MetricCard icon={<FaDumbbell />} label="Brazo ext. inicial" value={`${test.brazo_extend_inicial} cm`} />
                      ) : null}
                      {test.brazo_extend_sin_impulso != null ? (
                        <MetricCard icon={<FaDumbbell />} label="Brazo sin impulso" value={`${test.brazo_extend_sin_impulso} cm`} />
                      ) : null}
                      {test.brazo_extend_con_impulso != null ? (
                        <MetricCard icon={<FaDumbbell />} label="Brazo con impulso" value={`${test.brazo_extend_con_impulso} cm`} />
                      ) : null}
                      {test.fuerza_abdomen != null ? (
                        <MetricCard icon={<FaFire />} label="Abdominales (1 min)" value={`${test.fuerza_abdomen} reps`} />
                      ) : null}
                      {test.fuerza_brazos != null ? (
                        <MetricCard icon={<FaDumbbell />} label="Flexiones (1 min)" value={`${test.fuerza_brazos} reps`} />
                      ) : null}
                      {test.fuerza_piernas != null ? (
                        <MetricCard icon={<FaRunning />} label="Sentadillas (1 min)" value={`${test.fuerza_piernas} reps`} />
                      ) : null}
                      {test.elevaciones_barra != null ? (
                        <MetricCard icon={<FaDumbbell />} label="Elevaciones (1 min)" value={`${test.elevaciones_barra} reps`} />
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="rounded-xl border border-white/15 bg-black/25 p-3">
    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
      <span className="text-rv-gold">{icon}</span>
      {label}
    </p>
    <p className="mt-1 text-base font-black text-white">{value}</p>
  </div>
);

MetricCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

StudentPhysicalTests.propTypes = {
  physicalTests: PropTypes.array.isRequired,
  studentData: PropTypes.object,
  onRefresh: PropTypes.func.isRequired
};

export default StudentPhysicalTests;
