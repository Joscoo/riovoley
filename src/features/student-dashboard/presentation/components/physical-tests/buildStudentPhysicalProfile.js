import { getPhysicalTestFieldMeta } from '../../../../physical-tests/domain/physicalTestFieldMetadata';

const BLOCK_KEYS = {
  body: 'body',
  jump: 'jump',
  strength: 'strength',
};

const BLOCK_CONFIG = {
  [BLOCK_KEYS.body]: {
    label: 'Corporal',
    emptyMessage: 'Sin datos corporales suficientes.',
    metrics: ['peso', 'estatura', 'imc'],
  },
  [BLOCK_KEYS.jump]: {
    label: 'Salto y alcance',
    emptyMessage: 'Sin datos de salto suficientes.',
    metrics: [
      'brazo_extend_inicial',
      'brazo_extend_sin_impulso',
      'brazo_extend_con_impulso',
      'fuerza_explosiva_salto_largo',
      'envergadura_brazos_extendidos_lateral',
    ],
  },
  [BLOCK_KEYS.strength]: {
    label: 'Fuerza',
    emptyMessage: 'Sin datos de fuerza suficientes.',
    metrics: ['fuerza_abdomen', 'fuerza_brazos', 'fuerza_piernas', 'elevaciones_barra'],
  },
};

const CHART_COLORS = {
  peso: '#10b981',
  estatura: '#38bdf8',
  imc: '#f59e0b',
  brazo_extend_inicial: '#06b6d4',
  brazo_extend_sin_impulso: '#3b82f6',
  brazo_extend_con_impulso: '#f59e0b',
  fuerza_explosiva_salto_largo: '#ec4899',
  envergadura_brazos_extendidos_lateral: '#8b5cf6',
  fuerza_abdomen: '#ef4444',
  fuerza_brazos: '#14b8a6',
  fuerza_piernas: '#22c55e',
  elevaciones_barra: '#fb7185',
};

const STATUS_PRIORITY = {
  alerta: 3,
  mejora: 2,
  estable: 1,
  sin_datos: 0,
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatMetricDelta = (value, unit = '') => {
  if (!Number.isFinite(value) || value === 0) return `0${unit}`;
  const rounded = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${value > 0 ? '+' : ''}${rounded}${unit}`;
};

const formatLongDate = (value) => {
  if (!value) return 'N/A';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatShortDate = (value) => {
  if (!value) return 'N/A';
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: 'short',
  });
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

const calculateImc = (peso, estatura) => {
  const safePeso = toNumber(peso);
  const safeEstatura = toNumber(estatura);
  if (!safePeso || !safeEstatura) return null;
  return Number((safePeso / (safeEstatura * safeEstatura)).toFixed(2));
};

const normalizeTests = (physicalTests = []) =>
  [...physicalTests]
    .sort((left, right) => new Date(left.fecha_test) - new Date(right.fecha_test))
    .map((test) => ({
      ...test,
      peso: toNumber(test.peso),
      estatura: toNumber(test.estatura),
      envergadura_brazos_extendidos_lateral: toNumber(test.envergadura_brazos_extendidos_lateral),
      brazo_extend_inicial: toNumber(test.brazo_extend_inicial),
      brazo_extend_sin_impulso: toNumber(test.brazo_extend_sin_impulso),
      brazo_extend_con_impulso: toNumber(test.brazo_extend_con_impulso),
      fuerza_explosiva_salto_largo: toNumber(test.fuerza_explosiva_salto_largo),
      fuerza_abdomen: toNumber(test.fuerza_abdomen),
      fuerza_brazos: toNumber(test.fuerza_brazos),
      fuerza_piernas: toNumber(test.fuerza_piernas),
      elevaciones_barra: toNumber(test.elevaciones_barra),
      imc: calculateImc(test.peso, test.estatura),
    }));

const getMetricLabel = (metricKey) => {
  if (metricKey === 'imc') return 'IMC';
  return getPhysicalTestFieldMeta(metricKey).shortLabel;
};

const getMetricUnit = (metricKey) => {
  if (metricKey === 'peso') return ' kg';
  if (metricKey === 'estatura') return ' m';
  if (metricKey === 'imc') return '';
  if (metricKey === 'fuerza_explosiva_salto_largo') return ' m';
  if (
    [
      'brazo_extend_inicial',
      'brazo_extend_sin_impulso',
      'brazo_extend_con_impulso',
      'envergadura_brazos_extendidos_lateral',
    ].includes(metricKey)
  ) {
    return ' cm';
  }
  return ' reps';
};

const collectMetricValues = (tests, metricKey) =>
  tests
    .map((test) => ({
      id: test.id,
      fecha_test: test.fecha_test,
      value: toNumber(test[metricKey]),
    }))
    .filter((entry) => entry.value !== null);

const buildBlock = (tests, metricKeys, evaluator) => {
  const current = {};
  const previous = {};
  const baseline = {};
  const deltaFromPrevious = {};
  const deltaFromBaseline = {};
  const metricSignals = [];

  metricKeys.forEach((metricKey) => {
    const values = collectMetricValues(tests, metricKey);
    if (values.length === 0) return;

    const currentEntry = values[values.length - 1];
    const previousEntry = values.length > 1 ? values[values.length - 2] : null;
    const baselineEntry = values[0];

    current[metricKey] = currentEntry.value;
    baseline[metricKey] = baselineEntry.value;

    if (previousEntry) {
      previous[metricKey] = previousEntry.value;
      deltaFromPrevious[metricKey] = Number((currentEntry.value - previousEntry.value).toFixed(2));
    }

    if (values.length > 1) {
      deltaFromBaseline[metricKey] = Number((currentEntry.value - baselineEntry.value).toFixed(2));
    }

    metricSignals.push({
      metricKey,
      current: currentEntry.value,
      previous: previousEntry?.value ?? null,
      baseline: baselineEntry.value,
      deltaFromPrevious: deltaFromPrevious[metricKey] ?? null,
      deltaFromBaseline: deltaFromBaseline[metricKey] ?? null,
    });
  });

  if (metricSignals.length === 0) {
    return {
      current,
      previous,
      baseline,
      deltaFromPrevious,
      deltaFromBaseline,
      status: 'sin_datos',
      summary: evaluator.emptyMessage,
      metricSignals: [],
    };
  }

  const status = evaluator.getStatus(metricSignals);
  const summary = evaluator.getSummary(metricSignals, status);

  return {
    current,
    previous,
    baseline,
    deltaFromPrevious,
    deltaFromBaseline,
    status,
    summary,
    metricSignals,
  };
};

const buildBodyBlock = (tests) =>
  buildBlock(tests, BLOCK_CONFIG.body.metrics, {
    emptyMessage: BLOCK_CONFIG.body.emptyMessage,
    getStatus(metricSignals) {
      const weightSignal = metricSignals.find((signal) => signal.metricKey === 'peso');
      const imcSignal = metricSignals.find((signal) => signal.metricKey === 'imc');
      if (!weightSignal && !imcSignal) return 'sin_datos';
      if ((weightSignal?.deltaFromPrevious ?? 0) >= 2 || (imcSignal?.current ?? 0) >= 25) return 'alerta';
      if ((weightSignal?.deltaFromPrevious ?? 0) <= -0.5) return 'mejora';
      return 'estable';
    },
    getSummary(metricSignals, status) {
      const weightSignal = metricSignals.find((signal) => signal.metricKey === 'peso');
      const imcSignal = metricSignals.find((signal) => signal.metricKey === 'imc');
      if (!weightSignal && !imcSignal) return BLOCK_CONFIG.body.emptyMessage;
      if (status === 'alerta') {
        return 'Tu contexto corporal necesita seguimiento para no limitar el rendimiento de salto.';
      }
      if (status === 'mejora') {
        return 'Tu evolucion corporal acompana mejor la lectura deportiva reciente.';
      }
      return 'Tu bloque corporal se mantiene relativamente estable.';
    },
  });

const buildDirectionalBlock = (tests, metricKeys, blockKey) =>
  buildBlock(tests, metricKeys, {
    emptyMessage: BLOCK_CONFIG[blockKey].emptyMessage,
    getStatus(metricSignals) {
      const scoredSignals = metricSignals.filter((signal) => signal.deltaFromPrevious !== null);
      if (scoredSignals.length === 0) return 'sin_datos';

      const positives = scoredSignals.filter((signal) => signal.deltaFromPrevious > 0).length;
      const negatives = scoredSignals.filter((signal) => signal.deltaFromPrevious < 0).length;

      if (negatives > positives) return 'alerta';
      if (positives > 0 && negatives === 0) return 'mejora';
      if (positives > negatives) return 'mejora';
      return 'estable';
    },
    getSummary(metricSignals, status) {
      const bestSignal = metricSignals.find((signal) => signal.deltaFromPrevious > 0);
      const worstSignal = metricSignals.find((signal) => signal.deltaFromPrevious < 0);

      if (status === 'sin_datos') return BLOCK_CONFIG[blockKey].emptyMessage;
      if (status === 'alerta' && worstSignal) {
        return `${getMetricLabel(worstSignal.metricKey)} cayo ${formatMetricDelta(worstSignal.deltaFromPrevious, getMetricUnit(worstSignal.metricKey))}.`;
      }
      if (status === 'mejora' && bestSignal) {
        return `${getMetricLabel(bestSignal.metricKey)} mejoro ${formatMetricDelta(bestSignal.deltaFromPrevious, getMetricUnit(bestSignal.metricKey))}.`;
      }
      return `Tu bloque de ${BLOCK_CONFIG[blockKey].label.toLowerCase()} se mantiene estable.`;
    },
  });

const buildInsights = ({ bodyBlock, jumpBlock, strengthBlock, tests }) => {
  const improved = [];
  const needsWork = [];
  const stable = [];

  if (jumpBlock.status === 'mejora') {
    const signal = jumpBlock.metricSignals.find((item) => item.deltaFromPrevious > 0) || jumpBlock.metricSignals[0];
    if (signal) {
      improved.push(`${getMetricLabel(signal.metricKey)} subio ${formatMetricDelta(signal.deltaFromPrevious, getMetricUnit(signal.metricKey))}.`);
    }
  }

  if (strengthBlock.status === 'mejora') {
    const signal =
      strengthBlock.metricSignals.find((item) => item.metricKey === 'fuerza_piernas' && item.deltaFromPrevious > 0) ||
      strengthBlock.metricSignals.find((item) => item.deltaFromPrevious > 0);
    if (signal) {
      improved.push(`${getMetricLabel(signal.metricKey)} gano impulso reciente.`);
    }
  }

  if (jumpBlock.status === 'alerta') {
    const signal = jumpBlock.metricSignals.find((item) => item.deltaFromPrevious < 0);
    if (signal) {
      needsWork.push(`${getMetricLabel(signal.metricKey)} bajo y pide revisar tu explosividad.`);
    }
  }

  if (bodyBlock.status === 'alerta') {
    const weightSignal = bodyBlock.metricSignals.find((item) => item.metricKey === 'peso');
    if (weightSignal?.deltaFromPrevious > 0) {
      needsWork.push(`El peso subio ${formatMetricDelta(weightSignal.deltaFromPrevious, ' kg')} y puede estar afectando tu salto.`);
    }
  }

  if (bodyBlock.status === 'estable') {
    stable.push('Tu contexto corporal se mantiene estable.');
  }

  if (tests.length === 1) {
    stable.push('Todavia hace falta otra medicion para confirmar tendencias.');
  }

  return {
    improved,
    needsWork,
    stable,
  };
};

const pickOverallStatus = (blocks) =>
  Object.values(blocks)
    .map((block) => block.status)
    .sort((left, right) => STATUS_PRIORITY[right] - STATUS_PRIORITY[left])[0] || 'sin_datos';

const buildRecommendations = ({ tests, blocks }) => {
  const bodyWeightDelta = blocks.body.deltaFromPrevious.peso ?? null;
  const jumpDelta = blocks.jump.deltaFromPrevious.brazo_extend_con_impulso ?? null;
  const strengthLegDelta = blocks.strength.deltaFromPrevious.fuerza_piernas ?? null;

  if (tests.length === 0) {
    return {
      headline: 'Aun no hay evaluaciones para construir tu perfil.',
      priority: 'Completar el primer test fisico.',
      recommendations: ['Solicita tu primera evaluacion fisica para activar el seguimiento de progreso.'],
      confidence: 'preliminar',
      disclaimer: 'Las recomendaciones apareceran cuando existan mediciones registradas.',
    };
  }

  if (bodyWeightDelta !== null && bodyWeightDelta >= 2 && jumpDelta !== null && jumpDelta < 0) {
    return {
      headline: 'Tu perfil mixto muestra una alerta entre carga corporal y salto.',
      priority: 'Prioridad actual: recuperar explosividad y controlar carga corporal.',
      recommendations: [
        'Refuerza saltos cortos y gestos explosivos con buena tecnica.',
        'Cuida recuperacion, descanso e hidratacion para no llegar pesado a los entrenamientos.',
        'Monitorea tu peso en paralelo al rendimiento de salto durante las proximas evaluaciones.',
      ],
      confidence: 'media',
      disclaimer: 'Esta lectura es deportiva y orientativa; no reemplaza evaluacion medica o nutricional.',
    };
  }

  if (jumpDelta !== null && jumpDelta > 0 && strengthLegDelta !== null && strengthLegDelta > 0) {
    return {
      headline: 'Tu perfil va en una direccion positiva.',
      priority: 'Prioridad actual: sostener el bloque de salto y fuerza de piernas.',
      recommendations: [
        'Mantiene la continuidad del trabajo de fuerza y transferencia al salto.',
        'Registra otra medicion pronto para confirmar que la mejora se sostiene.',
        'Protege tu recuperacion para no perder calidad en los gestos explosivos.',
      ],
      confidence: 'alta',
      disclaimer: 'La recomendacion esta basada en el comportamiento reciente de tus tests.',
    };
  }

  if (jumpDelta !== null && jumpDelta > 0) {
    return {
      headline: 'Tu salto muestra una senal positiva.',
      priority: 'Prioridad actual: completar seguimiento y consolidar la mejora.',
      recommendations: [
        'Sostiene ejercicios de tecnica y explosividad que te dieron este avance.',
        'Agrega una nueva medicion para validar si la mejora se mantiene.',
        'Complementa con fuerza de piernas para transferir mejor al salto.',
      ],
      confidence: tests.length === 1 ? 'preliminar' : 'media',
      disclaimer: 'Con mas evaluaciones la recomendacion ganara precision.',
    };
  }

  return {
    headline: 'Tu perfil necesita mas seguimiento para una lectura completa.',
    priority: 'Prioridad actual: completar seguimiento y estabilizar tus metricas base.',
    recommendations: [
      'Completa nuevas evaluaciones para detectar tendencias mas claras.',
      'Trabaja fuerza general y tecnica de salto sin cambios bruscos de carga.',
      'Usa las proximas mediciones para validar si el rendimiento sube, baja o se estanca.',
    ],
    confidence: tests.length > 1 ? 'media' : 'preliminar',
    disclaimer: 'La recomendacion es orientativa y mejora con mas datos.',
  };
};

const buildChartGroups = (tests) => {
  const baseData = tests.map((test, index) => ({
    id: test.id,
    testNumber: index + 1,
    fecha: formatShortDate(test.fecha_test),
    fechaCompleta: formatLongDate(test.fecha_test),
  }));

  return Object.entries(BLOCK_CONFIG).reduce((acc, [blockKey, config]) => {
    const metrics = config.metrics
      .map((metricKey) => ({
        key: metricKey,
        label: getMetricLabel(metricKey),
        unit: getMetricUnit(metricKey).trim(),
        color: CHART_COLORS[metricKey] || '#e2e8f0',
      }))
      .filter((metric) =>
        tests.some((test) => toNumber(test[metric.key]) !== null)
      );

    const data = baseData.map((row, index) => {
      const test = tests[index];
      const withMetrics = { ...row };
      metrics.forEach((metric) => {
        const numericValue = toNumber(test[metric.key]);
        if (numericValue !== null) {
          withMetrics[metric.key] = numericValue;
        }
      });
      return withMetrics;
    });

    acc[blockKey] = {
      key: blockKey,
      label: config.label,
      emptyMessage: config.emptyMessage,
      metrics,
      data,
    };
    return acc;
  }, {});
};

const buildHeroSummary = ({ tests, studentData, blocks, recommendations }) => {
  const latest = tests[tests.length - 1];
  const age = calculateAge(studentData?.fecha_nacimiento);
  const overallStatus = pickOverallStatus(blocks);

  const statusHeadlineMap = {
    alerta: 'Hay una alerta de rendimiento a revisar',
    mejora: 'Tu progreso reciente va bien',
    estable: 'Tu perfil se mantiene estable',
    sin_datos: 'Perfil en construccion',
  };

  const hallazgos = [
    ...blocks.jump.metricSignals
      .filter((signal) => signal.deltaFromPrevious > 0)
      .slice(0, 1)
      .map((signal) => `${getMetricLabel(signal.metricKey)} al alza`),
    ...blocks.jump.metricSignals
      .filter((signal) => signal.deltaFromPrevious < 0)
      .slice(0, 1)
      .map((signal) => `${getMetricLabel(signal.metricKey)} bajo`),
    ...blocks.body.metricSignals
      .filter((signal) => signal.metricKey === 'peso' && signal.deltaFromPrevious > 0)
      .slice(0, 1)
      .map(() => 'Revisar carga corporal'),
  ].slice(0, 3);

  return {
    headline: statusHeadlineMap[overallStatus],
    summary: recommendations.headline,
    confidence: recommendations.confidence,
    latestDateLabel: formatLongDate(latest?.fecha_test),
    categoryLabel: studentData?.categoria || 'Sin categoria',
    age,
    hallazgos,
  };
};

const buildHistoryItems = (tests) =>
  [...tests]
    .reverse()
    .map((test) => ({
      id: test.id,
      fecha: formatLongDate(test.fecha_test),
      observaciones: test.observaciones || '',
      metrics: [
        test.peso !== null ? { label: 'Peso', value: `${test.peso} kg` } : null,
        test.estatura !== null ? { label: 'Estatura', value: `${test.estatura} m` } : null,
        test.brazo_extend_con_impulso !== null
          ? { label: getMetricLabel('brazo_extend_con_impulso'), value: `${test.brazo_extend_con_impulso} cm` }
          : null,
        test.fuerza_piernas !== null
          ? { label: getMetricLabel('fuerza_piernas'), value: `${test.fuerza_piernas} reps` }
          : null,
      ].filter(Boolean),
    }));

export const buildStudentPhysicalProfile = ({ physicalTests = [], studentData = {} }) => {
  const tests = normalizeTests(physicalTests);
  const emptyBlocks = {
    body: {
      current: {},
      previous: {},
      baseline: {},
      deltaFromPrevious: {},
      deltaFromBaseline: {},
      status: 'sin_datos',
      summary: BLOCK_CONFIG.body.emptyMessage,
      metricSignals: [],
    },
    jump: {
      current: {},
      previous: {},
      baseline: {},
      deltaFromPrevious: {},
      deltaFromBaseline: {},
      status: 'sin_datos',
      summary: BLOCK_CONFIG.jump.emptyMessage,
      metricSignals: [],
    },
    strength: {
      current: {},
      previous: {},
      baseline: {},
      deltaFromPrevious: {},
      deltaFromBaseline: {},
      status: 'sin_datos',
      summary: BLOCK_CONFIG.strength.emptyMessage,
      metricSignals: [],
    },
  };

  if (tests.length === 0) {
    return {
      hasTests: false,
      latestTestId: null,
      sortedTests: [],
      blocks: emptyBlocks,
      insights: { improved: [], needsWork: [], stable: [] },
      recommendations: buildRecommendations({ tests, blocks: emptyBlocks }),
      chartGroups: buildChartGroups([]),
      hero: {
        headline: 'Perfil en construccion',
        summary: 'Aun no hay evaluaciones para construir tu perfil.',
        confidence: 'preliminar',
        latestDateLabel: 'N/A',
        categoryLabel: studentData?.categoria || 'Sin categoria',
        age: calculateAge(studentData?.fecha_nacimiento),
        hallazgos: [],
      },
      history: [],
    };
  }

  const blocks = {
    body: buildBodyBlock(tests),
    jump: buildDirectionalBlock(tests, BLOCK_CONFIG.jump.metrics, BLOCK_KEYS.jump),
    strength: buildDirectionalBlock(tests, BLOCK_CONFIG.strength.metrics, BLOCK_KEYS.strength),
  };

  const recommendations = buildRecommendations({ tests, blocks });

  return {
    hasTests: true,
    latestTestId: tests[tests.length - 1]?.id || null,
    sortedTests: tests,
    blocks,
    insights: buildInsights({
      bodyBlock: blocks.body,
      jumpBlock: blocks.jump,
      strengthBlock: blocks.strength,
      tests,
    }),
    recommendations,
    chartGroups: buildChartGroups(tests),
    hero: buildHeroSummary({ tests, studentData, blocks, recommendations }),
    history: buildHistoryItems(tests),
  };
};

export default buildStudentPhysicalProfile;
