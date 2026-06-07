import { getEcuadorDate, getEcuadorISOString } from '../../../../utils/dateUtils';

const LEVELS = [
  { level: 1, title: 'Semilla', minXp: 0 },
  { level: 2, title: 'En Marcha', minXp: 200 },
  { level: 3, title: 'Constante', minXp: 450 },
  { level: 4, title: 'Competidor', minXp: 750 },
  { level: 5, title: 'Impacto', minXp: 1100 },
];

const CORE_DRIVER_LABELS = {
  'Epic Meaning & Calling': 'Significado epico y llamado',
  'Development & Accomplishment': 'Desarrollo y logro',
  'Empowerment of Creativity & Feedback': 'Creatividad y retroalimentacion',
  'Ownership & Possession': 'Propiedad y pertenencia',
  'Social Influence & Relatedness': 'Influencia social y relacion',
  'Scarcity & Impatience': 'Escasez e impaciencia',
  'Unpredictability & Curiosity': 'Imprevisibilidad y curiosidad',
  'Loss & Avoidance': 'Perdida y prevencion',
};

const BASE_TEST_XP = 100;
const BASE_ATTENDANCE_XP = 35;
const BASE_PAYMENT_XP = 90;
const ACTIVE_PAYMENT_BONUS_XP = 45;
const DEFAULT_ACHIEVEMENTS = [
  {
    slug: 'first_test',
    title: 'Primer paso',
    description: 'Completa tu primer test fisico registrado.',
    core_driver: 'Significado epico y llamado',
    xp_reward: 100,
    sort_order: 10,
    visibility: 'public',
  },
  {
    slug: 'two_tests',
    title: 'Vuelves a medir',
    description: 'Registra al menos dos tests para comenzar a comparar tu evolucion.',
    core_driver: 'Desarrollo y logro',
    xp_reward: 80,
    sort_order: 20,
    visibility: 'public',
  },
  {
    slug: 'jump_up_5',
    title: 'Salto en ascenso',
    description: 'Mejora al menos 5 cm en tu salto con carrera respecto a tu linea base.',
    core_driver: 'Desarrollo y logro',
    xp_reward: 140,
    sort_order: 30,
    visibility: 'public',
  },
  {
    slug: 'strength_plus_10',
    title: 'Base de fuerza',
    description: 'Mejora 10 repeticiones en al menos una prueba de fuerza.',
    core_driver: 'Propiedad y pertenencia',
    xp_reward: 120,
    sort_order: 40,
    visibility: 'public',
  },
  {
    slug: 'streak_3_months',
    title: 'Constancia de 3 meses',
    description: 'Mantiene tests fisicos en tres meses consecutivos.',
    core_driver: 'Perdida y prevencion',
    xp_reward: 160,
    sort_order: 50,
    visibility: 'public',
  },
  {
    slug: 'five_tests',
    title: 'Historial serio',
    description: 'Acumula cinco tests fisicos registrados.',
    core_driver: 'Escasez e impaciencia',
    xp_reward: 180,
    sort_order: 60,
    visibility: 'public',
  },
  {
    slug: 'first_attendance',
    title: 'Siempre presente',
    description: 'Registra tu primera asistencia de entrenamiento.',
    core_driver: 'Influencia social y relacion',
    xp_reward: 60,
    sort_order: 70,
    visibility: 'public',
  },
  {
    slug: 'attendance_month_8',
    title: 'Semana tras semana',
    description: 'Completa 8 asistencias durante el mismo mes.',
    core_driver: 'Escasez e impaciencia',
    xp_reward: 130,
    sort_order: 80,
    visibility: 'public',
  },
  {
    slug: 'attendance_total_12',
    title: 'Ritmo de entrenamiento',
    description: 'Acumula 12 asistencias registradas.',
    core_driver: 'Influencia social y relacion',
    xp_reward: 150,
    sort_order: 90,
    visibility: 'public',
  },
  {
    slug: 'first_payment',
    title: 'Compromiso al dia',
    description: 'Registra tu primer pago de mensualidad.',
    core_driver: 'Propiedad y pertenencia',
    xp_reward: 90,
    sort_order: 95,
    visibility: 'public',
  },
  {
    slug: 'payment_streak_3',
    title: 'Tres meses al dia',
    description: 'Acumula pagos registrados en tres meses distintos.',
    core_driver: 'Escasez e impaciencia',
    xp_reward: 130,
    sort_order: 98,
    visibility: 'public',
  },
  {
    slug: 'payment_active_guard',
    title: 'Cobertura activa',
    description: 'Mantiene tu mensualidad activa en el periodo actual.',
    core_driver: 'Perdida y prevencion',
    xp_reward: 120,
    sort_order: 99,
    visibility: 'public',
  },
  {
    slug: 'mystery_dual_focus',
    title: 'Doble impulso',
    description: 'Combina constancia en entrenamientos con progreso fisico sostenido.',
    core_driver: 'Imprevisibilidad y curiosidad',
    xp_reward: 220,
    sort_order: 100,
    visibility: 'hidden',
  },
];

const DEFAULT_CHALLENGES = [
  {
    slug: 'monthly_check_in',
    title: 'Registro mensual',
    description: 'Registra al menos un test en el mes actual.',
    core_driver: 'Perdida y prevencion',
    target_metric: 'monthly_tests',
    target_value: 1,
    window_type: 'calendar-month',
  },
  {
    slug: 'jump_next_level',
    title: 'Sube tu salto',
    description: 'Mejora 3 cm tu salto con carrera respecto a tu linea base.',
    core_driver: 'Desarrollo y logro',
    target_metric: 'jump_delta',
    target_value: 3,
    window_type: 'rolling',
  },
  {
    slug: 'strength_foundation',
    title: 'Activa tu fuerza',
    description: 'Mejora 5 repeticiones en alguna prueba de fuerza.',
    core_driver: 'Creatividad y retroalimentacion',
    target_metric: 'strength_delta',
    target_value: 5,
    window_type: 'rolling',
  },
  {
    slug: 'attendance_monthly_rhythm',
    title: 'Ritmo del mes',
    description: 'Completa 8 asistencias en el mes actual.',
    core_driver: 'Influencia social y relacion',
    target_metric: 'monthly_attendances',
    target_value: 8,
    window_type: 'calendar-month',
  },
  {
    slug: 'payment_active_now',
    title: 'Mensualidad al dia',
    description: 'Mantiene tu pago activo o proximo a vencer en este momento.',
    core_driver: 'Propiedad y pertenencia',
    target_metric: 'payment_active_now',
    target_value: 1,
    window_type: 'rolling',
  },
];

const translateCoreDriver = (value) => CORE_DRIVER_LABELS[value] || value || '';

const localizeCatalogEntries = (entries, defaults) => {
  const defaultsMap = new Map((defaults || []).map((entry) => [entry.slug, entry]));
  return (entries || []).map((entry) => {
    const fallback = defaultsMap.get(entry.slug) || defaultsMap.get(entry.challenge_slug) || defaultsMap.get(entry.achievement_slug) || {};
    return {
      ...entry,
      title: fallback.title || entry.title,
      description: fallback.description || entry.description,
      core_driver: translateCoreDriver(entry.core_driver || fallback.core_driver),
    };
  });
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getLevelInfo = (totalXp) => {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.minXp) {
      current = level;
    }
  }

  const next = LEVELS.find((level) => level.level === current.level + 1) || null;
  return {
    ...current,
    currentXp: totalXp - current.minXp,
    nextLevel: next,
    xpToNextLevel: next ? Math.max(next.minXp - totalXp, 0) : 0,
  };
};

const buildProfileView = ({ profile, levelInfo }) => ({
  studentId: profile.student_id,
  currentLevel: profile.current_level,
  currentXp: profile.current_xp,
  totalXp: profile.total_xp,
  activeStreak: profile.active_streak,
  longestStreak: profile.longest_streak,
  lastTestDate: profile.last_test_date,
  lastSyncedAt: profile.last_synced_at || null,
  levelTitle: profile.summary?.levelTitle || levelInfo.title,
  xpToNextLevel: profile.summary?.xpToNextLevel ?? levelInfo.xpToNextLevel,
  nextLevel: profile.summary?.nextLevel ?? (levelInfo.nextLevel?.title || null),
  progressPctToNextLevel: levelInfo.nextLevel
    ? Math.min(
        Math.max(
          ((profile.total_xp - levelInfo.minXp) / (levelInfo.nextLevel.minXp - levelInfo.minXp)) * 100,
          0
        ),
        100
      )
    : 100,
  currentLevelMinXp: levelInfo.minXp,
  nextLevelMinXp: levelInfo.nextLevel?.minXp || null,
  summary: profile.summary || {},
});

const parseMonthKey = (dateString) => {
  if (!dateString) return null;
  return dateString.slice(0, 7);
};

const monthDiff = (startKey, endKey) => {
  const [startYear, startMonth] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);
  return (endYear - startYear) * 12 + (endMonth - startMonth);
};

const calculateStreaks = (tests, today) => {
  const uniqueMonths = [...new Set((tests || []).map((test) => parseMonthKey(test.fecha_test)).filter(Boolean))].sort();
  if (uniqueMonths.length === 0) {
    return {
      activeStreak: 0,
      longestStreak: 0,
      currentMonthTests: 0,
    };
  }

  let longestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < uniqueMonths.length; index += 1) {
    if (monthDiff(uniqueMonths[index - 1], uniqueMonths[index]) === 1) {
      currentStreak += 1;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  const currentMonthKey = parseMonthKey(today);
  let activeStreak = 0;
  if (uniqueMonths.includes(currentMonthKey)) {
    activeStreak = 1;
    let cursor = uniqueMonths.indexOf(currentMonthKey);
    while (cursor > 0 && monthDiff(uniqueMonths[cursor - 1], uniqueMonths[cursor]) === 1) {
      activeStreak += 1;
      cursor -= 1;
    }
  }

  const currentMonthTests = (tests || []).filter((test) => parseMonthKey(test.fecha_test) === currentMonthKey).length;

  return {
    activeStreak,
    longestStreak,
    currentMonthTests,
  };
};

const calculateAttendanceStats = (attendances, today) => {
  const rows = attendances || [];
  const currentMonthKey = parseMonthKey(today);
  const monthBuckets = rows.reduce((acc, attendance) => {
    const monthKey = parseMonthKey(attendance.fecha);
    if (!monthKey) return acc;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {});

  return {
    totalAttendances: rows.length,
    currentMonthAttendances: monthBuckets[currentMonthKey] || 0,
    bestMonthAttendances: Math.max(0, ...Object.values(monthBuckets)),
  };
};

const getPaymentSortValue = (payment) =>
  payment.fecha_fin || payment.fecha_inicio || payment.fecha_pago || payment.created_at || '';

const calculatePaymentStats = (payments, today) => {
  const rows = [...(payments || [])].sort((left, right) => getPaymentSortValue(left).localeCompare(getPaymentSortValue(right)));
  const currentMonthKey = parseMonthKey(today);
  const latestPayment = rows[rows.length - 1] || null;
  const uniquePaymentMonths = [
    ...new Set(rows.map((payment) => parseMonthKey(payment.fecha_inicio || payment.fecha_pago)).filter(Boolean)),
  ];
  const currentMonthPayments = rows.filter(
    (payment) => parseMonthKey(payment.fecha_pago || payment.fecha_inicio) === currentMonthKey
  ).length;
  const latestStatus = latestPayment?.estado || null;
  const hasActiveCoverage = ['activo', 'proximo_a_vencer'].includes(latestStatus);

  return {
    totalPayments: rows.length,
    currentMonthPayments,
    uniquePaymentMonths: uniquePaymentMonths.length,
    latestStatus,
    hasActiveCoverage,
  };
};

const buildDelta = (tests, metricKey) => {
  if (!tests || tests.length < 2) return null;
  const baseline = toNumber(tests[0]?.[metricKey]);
  const latest = toNumber(tests[tests.length - 1]?.[metricKey]);
  if (baseline == null || latest == null) return null;
  return Number((latest - baseline).toFixed(2));
};

const buildStrengthDelta = (tests) => {
  const metrics = ['fuerza_abdomen', 'fuerza_brazos', 'fuerza_piernas', 'elevaciones_barra'];
  return metrics.reduce((best, metricKey) => {
    const delta = buildDelta(tests, metricKey);
    if (delta == null) return best;
    return Math.max(best, delta);
  }, 0);
};

const deriveAgeBand = (birthDate, todayString) => {
  if (!birthDate) return 'sin-dato';
  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date(`${todayString}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(today.getTime())) return 'sin-dato';

  let age = today.getFullYear() - birth.getFullYear();
  const sameYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (today < sameYearBirthday) {
    age -= 1;
  }

  return age >= 18 ? 'adulto' : 'menor';
};

const getAchievementCatalog = (catalog) => {
  if (catalog && catalog.length > 0) {
    return localizeCatalogEntries(
      [...catalog].sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0)),
      DEFAULT_ACHIEVEMENTS
    );
  }
  return DEFAULT_ACHIEVEMENTS;
};

const getChallengeCatalog = (catalog) => {
  if (catalog && catalog.length > 0) {
    return localizeCatalogEntries(catalog, DEFAULT_CHALLENGES);
  }
  return DEFAULT_CHALLENGES;
};

const evaluateAchievements = ({
  catalog,
  tests,
  jumpDelta,
  strengthDelta,
  streaks,
  attendanceStats,
  paymentStats,
  syncedAt,
}) => {
  const effectiveCatalog = getAchievementCatalog(catalog);
  const latestTest = tests?.[tests.length - 1] || null;

  const earned = effectiveCatalog.filter((achievement) => {
    switch (achievement.slug) {
      case 'first_test':
        return (tests?.length || 0) >= 1;
      case 'two_tests':
        return (tests?.length || 0) >= 2;
      case 'jump_up_5':
        return jumpDelta != null && jumpDelta >= 5;
      case 'strength_plus_10':
        return strengthDelta >= 10;
      case 'streak_3_months':
        return streaks.longestStreak >= 3;
      case 'five_tests':
        return (tests?.length || 0) >= 5;
      case 'first_attendance':
        return attendanceStats.totalAttendances >= 1;
      case 'attendance_month_8':
        return attendanceStats.currentMonthAttendances >= 8;
      case 'attendance_total_12':
        return attendanceStats.totalAttendances >= 12;
      case 'first_payment':
        return paymentStats.totalPayments >= 1;
      case 'payment_streak_3':
        return paymentStats.uniquePaymentMonths >= 3;
      case 'payment_active_guard':
        return paymentStats.hasActiveCoverage;
      case 'mystery_dual_focus':
        return (tests?.length || 0) >= 3 && attendanceStats.currentMonthAttendances >= 6;
      default:
        return false;
    }
  });

  return earned.map((achievement) => ({
    achievement_slug: achievement.slug,
    source_test_id: latestTest?.id || null,
    metadata: {
      coreDriver: achievement.core_driver,
      derivedAt: syncedAt,
    },
    earned_at: syncedAt,
    title: achievement.title,
    description: achievement.description,
    core_driver: achievement.core_driver,
    xp_reward: achievement.xp_reward || 0,
  }));
};

const buildRewardEvents = ({ studentId, tests, attendances, payments, paymentStats, achievements, syncedAt }) => {
  const baseEvents = (tests || []).map((test) => ({
    student_id: studentId,
    source_type: 'physical_test',
    source_id: test.id,
    event_type: 'physical_test_recorded',
    xp_awarded: BASE_TEST_XP,
    payload: {
      fecha_test: test.fecha_test,
      categoria: 'base-test',
      derivedAt: syncedAt,
    },
    created_at: syncedAt,
  }));

  const attendanceEvents = (attendances || []).map((attendance) => ({
    student_id: studentId,
    source_type: 'attendance',
    source_id: attendance.id,
    event_type: 'attendance_recorded',
    xp_awarded: BASE_ATTENDANCE_XP,
    payload: {
      fecha: attendance.fecha,
      categoria: 'attendance',
      derivedAt: syncedAt,
    },
    created_at: attendance.created_at || syncedAt,
  }));

  const paymentEvents = (payments || []).map((payment) => ({
    student_id: studentId,
    source_type: 'payment',
    source_id: payment.id,
    event_type: 'payment_recorded',
    xp_awarded: BASE_PAYMENT_XP,
    payload: {
      fecha_pago: payment.fecha_pago,
      estado: payment.estado || null,
      derivedAt: syncedAt,
    },
    created_at: payment.created_at || syncedAt,
  }));

  const activeCoverageEvents = paymentStats?.hasActiveCoverage
    ? [{
        student_id: studentId,
        source_type: 'payment_status',
        source_id: payments?.[payments.length - 1]?.id || studentId,
        event_type: 'payment_active_bonus',
        xp_awarded: ACTIVE_PAYMENT_BONUS_XP,
        payload: {
          estado: paymentStats.latestStatus,
          derivedAt: syncedAt,
        },
        created_at: syncedAt,
      }]
    : [];

  const achievementEvents = (achievements || []).map((achievement) => ({
    student_id: studentId,
    source_type: 'achievement',
    source_id: achievement.source_test_id,
    event_type: achievement.achievement_slug,
    xp_awarded: achievement.xp_reward || 0,
    payload: {
      title: achievement.title,
      coreDriver: achievement.core_driver,
      derivedAt: syncedAt,
    },
    created_at: achievement.earned_at || syncedAt,
  }));

  return [...baseEvents, ...attendanceEvents, ...paymentEvents, ...activeCoverageEvents, ...achievementEvents];
};

const buildChallenges = ({
  catalog,
  tests,
  jumpDelta,
  strengthDelta,
  currentMonthTests,
  currentMonthAttendances,
  paymentStats,
  syncedAt,
}) => {
  const effectiveCatalog = getChallengeCatalog(catalog);

  return effectiveCatalog.map((challenge) => {
    let progressValue = 0;

    switch (challenge.slug) {
      case 'monthly_check_in':
        progressValue = currentMonthTests;
        break;
      case 'jump_next_level':
        progressValue = Math.max(jumpDelta || 0, 0);
        break;
      case 'strength_foundation':
        progressValue = Math.max(strengthDelta || 0, 0);
        break;
      case 'attendance_monthly_rhythm':
        progressValue = currentMonthAttendances;
        break;
      case 'payment_active_now':
        progressValue = paymentStats.hasActiveCoverage ? 1 : 0;
        break;
      default:
        progressValue = 0;
        break;
    }

    const isCompleted = progressValue >= Number(challenge.target_value || 0);

    return {
      challenge_slug: challenge.slug,
      progress_value: progressValue,
      is_completed: isCompleted,
      completed_at: isCompleted ? syncedAt : null,
      updated_at: syncedAt,
      title: challenge.title,
      description: challenge.description,
      core_driver: challenge.core_driver,
      target_metric: challenge.target_metric,
      target_value: Number(challenge.target_value || 0),
      window_type: challenge.window_type,
      tests_count: tests?.length || 0,
    };
  });
};

const buildProjection = ({ student, tests, attendances, payments, achievementCatalog, challengeCatalog, today, syncedAt }) => {
  const jumpDelta = buildDelta(tests, 'brazo_extend_con_impulso');
  const strengthDelta = buildStrengthDelta(tests);
  const streaks = calculateStreaks(tests, today);
  const attendanceStats = calculateAttendanceStats(attendances, today);
  const paymentStats = calculatePaymentStats(payments, today);
  const achievements = evaluateAchievements({
    catalog: achievementCatalog,
    tests,
    jumpDelta,
    strengthDelta,
    streaks,
    attendanceStats,
    paymentStats,
    syncedAt,
  });
  const rewardEvents = buildRewardEvents({
    studentId: student.id,
    tests,
    attendances,
    payments,
    paymentStats,
    achievements,
    syncedAt,
  });
  const totalXp = rewardEvents.reduce((sum, event) => sum + Number(event.xp_awarded || 0), 0);
  const levelInfo = getLevelInfo(totalXp);
  const challenges = buildChallenges({
    catalog: challengeCatalog,
    tests,
    jumpDelta,
    strengthDelta,
    currentMonthTests: streaks.currentMonthTests,
    currentMonthAttendances: attendanceStats.currentMonthAttendances,
    paymentStats,
    syncedAt,
  });
  const ageBand = deriveAgeBand(student.fecha_nacimiento || student.users?.fecha_nacimiento, today);
  const latestTest = tests?.[tests.length - 1] || null;

  const profile = {
    student_id: student.id,
    current_level: levelInfo.level,
    current_xp: levelInfo.currentXp,
    total_xp: totalXp,
    active_streak: streaks.activeStreak,
    longest_streak: streaks.longestStreak,
    last_test_date: latestTest?.fecha_test || null,
    last_synced_at: syncedAt,
    updated_at: syncedAt,
    summary: {
      levelTitle: levelInfo.title,
      xpToNextLevel: levelInfo.xpToNextLevel,
      nextLevel: levelInfo.nextLevel?.title || null,
      testsCount: tests?.length || 0,
      jumpDelta,
      strengthDelta,
      currentMonthTests: streaks.currentMonthTests,
      totalAttendances: attendanceStats.totalAttendances,
      currentMonthAttendances: attendanceStats.currentMonthAttendances,
      bestMonthAttendances: attendanceStats.bestMonthAttendances,
      totalPayments: paymentStats.totalPayments,
      currentMonthPayments: paymentStats.currentMonthPayments,
      uniquePaymentMonths: paymentStats.uniquePaymentMonths,
      hasActivePayment: paymentStats.hasActiveCoverage,
      latestPaymentStatus: paymentStats.latestStatus,
      ageBand,
      completedChallenges: challenges.filter((challenge) => challenge.is_completed).length,
      unlockedAchievements: achievements.length,
    },
  };

  return {
    profile,
    achievements,
    rewardEvents,
    challenges,
    ageBand,
  };
};

const formatAchievementRows = ({ rows, catalog }) => {
  const catalogMap = new Map(getAchievementCatalog(catalog).map((achievement) => [achievement.slug, achievement]));
  return (rows || []).map((row) => {
    const definition = catalogMap.get(row.achievement_slug) || {};
    return {
      achievementSlug: row.achievement_slug,
      title: definition.title || row.title || row.achievement_slug,
      description: definition.description || row.description || '',
      coreDriver: translateCoreDriver(definition.core_driver || row.core_driver || ''),
      xpReward: definition.xp_reward || row.xp_reward || 0,
      earnedAt: row.earned_at,
      sourceTestId: row.source_test_id || null,
      metadata: row.metadata || {},
      visibility: definition.visibility || 'public',
      isUnlocked: true,
    };
  });
};

const getAchievementProgress = ({ slug, tests, jumpDelta, strengthDelta, streaks, attendanceStats, paymentStats }) => {
  switch (slug) {
    case 'first_test':
      return { current: Math.min((tests?.length || 0), 1), target: 1, hint: 'Completa tu primera evaluacion fisica.' };
    case 'two_tests':
      return { current: Math.min((tests?.length || 0), 2), target: 2, hint: 'Necesitas dos tests para comparar tu avance.' };
    case 'jump_up_5':
      return { current: Math.max(jumpDelta || 0, 0), target: 5, hint: 'Mejora tu salto con carrera frente a tu linea base.' };
    case 'strength_plus_10':
      return { current: Math.max(strengthDelta || 0, 0), target: 10, hint: 'Eleva al menos una prueba de fuerza en 10 repeticiones.' };
    case 'streak_3_months':
      return { current: streaks.longestStreak || 0, target: 3, hint: 'Mantente activo con tests en meses consecutivos.' };
    case 'five_tests':
      return { current: Math.min((tests?.length || 0), 5), target: 5, hint: 'Sigue sumando evaluaciones fisicas.' };
    case 'first_attendance':
      return { current: Math.min(attendanceStats.totalAttendances || 0, 1), target: 1, hint: 'Registra tu primera asistencia.' };
    case 'attendance_month_8':
      return { current: attendanceStats.currentMonthAttendances || 0, target: 8, hint: 'Asiste con regularidad durante este mes.' };
    case 'attendance_total_12':
      return { current: Math.min(attendanceStats.totalAttendances || 0, 12), target: 12, hint: 'Acumula asistencias a entrenamientos.' };
    case 'first_payment':
      return { current: Math.min(paymentStats.totalPayments || 0, 1), target: 1, hint: 'Registra tu primera mensualidad.' };
    case 'payment_streak_3':
      return { current: Math.min(paymentStats.uniquePaymentMonths || 0, 3), target: 3, hint: 'Mantente al dia durante varios meses.' };
    case 'payment_active_guard':
      return { current: paymentStats.hasActiveCoverage ? 1 : 0, target: 1, hint: 'Conserva una mensualidad vigente en el periodo actual.' };
    case 'mystery_dual_focus':
      return { current: Math.min(((tests?.length || 0) >= 3 ? 1 : 0) + ((attendanceStats.currentMonthAttendances || 0) >= 6 ? 1 : 0), 2), target: 2, hint: 'Combina entrenamiento constante con progreso fisico.' };
    default:
      return { current: 0, target: 1, hint: 'Sigue avanzando para desbloquearlo.' };
  }
};

const buildLockedAchievements = ({ catalog, earnedRows, tests, jumpDelta, strengthDelta, streaks, attendanceStats, paymentStats }) => {
  const earnedSlugs = new Set((earnedRows || []).map((row) => row.achievement_slug || row.achievementSlug));
  return getAchievementCatalog(catalog)
    .filter((achievement) => !earnedSlugs.has(achievement.slug))
    .map((achievement) => {
      const progress = getAchievementProgress({
        slug: achievement.slug,
        tests,
        jumpDelta,
        strengthDelta,
        streaks,
        attendanceStats,
        paymentStats,
      });
      const isHidden = achievement.visibility === 'hidden';
      return {
        achievementSlug: achievement.slug,
        title: isHidden ? 'Logro misterioso' : achievement.title,
        description: isHidden ? 'Sigue avanzando para descubrir este logro sorpresa.' : achievement.description,
        xpReward: achievement.xp_reward || 0,
        coreDriver: translateCoreDriver(achievement.core_driver || ''),
        isUnlocked: false,
        isHidden,
        progressValue: progress.current,
        targetValue: progress.target,
        progressPct: progress.target > 0 ? Math.min((progress.current / progress.target) * 100, 100) : 0,
        hint: progress.hint,
      };
    });
};

const buildNudges = ({ profile, challenges, lockedAchievements }) => {
  const nudges = [];
  const pendingChallenges = (challenges || []).filter((challenge) => !challenge.isCompleted);
  const nearestChallenge = [...pendingChallenges].sort((left, right) => {
    const leftPct = left.targetValue > 0 ? left.progressValue / left.targetValue : 0;
    const rightPct = right.targetValue > 0 ? right.progressValue / right.targetValue : 0;
    return rightPct - leftPct;
  })[0];

  if (profile?.xpToNextLevel > 0) {
    nudges.push({
      id: 'next-level',
      tone: 'info',
      title: 'Sube de nivel',
      message: `Te faltan ${profile.xpToNextLevel} XP para alcanzar ${profile.nextLevel}.`,
      cta: 'Sigue sumando progreso',
    });
  }

  if (nearestChallenge) {
    nudges.push({
      id: `challenge-${nearestChallenge.slug}`,
      tone: nearestChallenge.progressValue > 0 ? 'success' : 'info',
      title: 'Reto en curso',
      message: `${nearestChallenge.title}: llevas ${nearestChallenge.progressValue} de ${nearestChallenge.targetValue}.`,
      cta: 'Completa este reto',
    });
  }

  const attendanceGoal = lockedAchievements.find((achievement) => achievement.achievementSlug === 'attendance_month_8');
  if (attendanceGoal && !attendanceGoal.isUnlocked) {
    nudges.push({
      id: 'attendance-rhythm',
      tone: 'warning',
      title: 'No pierdas el ritmo',
      message: `Te faltan ${Math.max(attendanceGoal.targetValue - attendanceGoal.progressValue, 0)} asistencias este mes para desbloquear "${attendanceGoal.title}".`,
      cta: 'Mantente constante',
    });
  }

  const paymentGoal = lockedAchievements.find((achievement) => achievement.achievementSlug === 'payment_active_guard');
  if (paymentGoal && !paymentGoal.isUnlocked) {
    nudges.push({
      id: 'payment-cover',
      tone: 'warning',
      title: 'Cuida tu cobertura',
      message: 'Tu progreso tambien toma en cuenta mantener tu mensualidad vigente.',
      cta: 'Revisa tu estado de pago',
    });
  }

  const streakAchievement = lockedAchievements.find((achievement) => achievement.achievementSlug === 'streak_3_months');
  if ((profile?.activeStreak || 0) > 0 && streakAchievement) {
    nudges.push({
      id: 'streak',
      tone: 'success',
      title: 'Tu racha sigue viva',
      message: `Llevas ${profile.activeStreak} mes${profile.activeStreak === 1 ? '' : 'es'} seguidos con progreso. No dejes que se enfrie.`,
      cta: 'Protege tu racha',
    });
  }

  return nudges.slice(0, 3);
};

const formatChallenges = ({ rows, catalog }) => {
  const catalogMap = new Map(getChallengeCatalog(catalog).map((challenge) => [challenge.slug, challenge]));
  return (rows || []).map((row) => {
    const definition = catalogMap.get(row.challenge_slug) || {};
    return {
      slug: row.challenge_slug,
      title: definition.title || row.title || row.challenge_slug,
      description: definition.description || row.description || '',
      coreDriver: translateCoreDriver(definition.core_driver || row.core_driver || ''),
      targetMetric: definition.target_metric || row.target_metric || '',
      targetValue: Number(definition.target_value || row.target_value || 0),
      progressValue: Number(row.progress_value || 0),
      isCompleted: Boolean(row.is_completed),
      completedAt: row.completed_at || null,
      windowType: definition.window_type || row.window_type || 'rolling',
    };
  });
};

const formatLeaderboard = ({ rows, studentId }) =>
  (rows || []).map((row) => ({
    studentId: row.student_id,
    categoria: row.categoria,
    ageBand: row.age_band,
    score: Number(row.score || 0),
    currentLevel: Number(row.current_level || 1),
    rankPosition: Number(row.rank_position || 0),
    snapshotDate: row.snapshot_date,
    publicAlias: row.public_alias || 'Anonimo',
    isCurrentStudent: row.student_id === studentId,
  }));

const buildDerivedLeaderboardRows = ({ students, profiles, currentStudent, currentProfileView, today, ageBand }) => {
  const profileMap = new Map((profiles || []).map((profile) => [profile.student_id, profile]));

  if (currentStudent?.id && currentProfileView) {
    profileMap.set(currentStudent.id, {
      student_id: currentStudent.id,
      total_xp: currentProfileView.totalXp,
      current_level: currentProfileView.currentLevel,
    });
  }

  const rows = (students || [])
    .map((categoryStudent) => {
      const profile = profileMap.get(categoryStudent.id);
      if (!profile) return null;

      const resolvedAgeBand = deriveAgeBand(
        categoryStudent.fecha_nacimiento || categoryStudent.users?.fecha_nacimiento,
        today
      );

      if (ageBand && resolvedAgeBand !== ageBand) {
        return null;
      }

      return {
        student_id: categoryStudent.id,
        categoria: categoryStudent.categoria || 'sin-categoria',
        age_band: resolvedAgeBand,
        score: Number(profile.total_xp || 0),
        current_level: Number(profile.current_level || 1),
        rank_position: 0,
        snapshot_date: today,
        public_alias:
          categoryStudent.public_alias ||
          categoryStudent.users?.public_alias ||
          `${categoryStudent.users?.nombre?.[0] || 'E'}*** ${categoryStudent.users?.apellido?.[0] || ''}`.trim(),
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.current_level !== left.current_level) return right.current_level - left.current_level;
      return left.student_id.localeCompare(right.student_id);
    })
    .map((row, index) => ({
      ...row,
      rank_position: index + 1,
    }));

  return rows;
};

export const createGamificationUseCases = (repository, deps = {}) => {
  const todayProvider = deps.getEcuadorDate || getEcuadorDate;
  const isoProvider = deps.getEcuadorISOString || getEcuadorISOString;
  const listAttendances = async (studentId) => {
    if (typeof repository.listAttendances !== 'function') {
      return [];
    }
    return repository.listAttendances(studentId);
  };
  const listPayments = async (studentId) => {
    if (typeof repository.listPayments !== 'function') {
      return [];
    }
    return repository.listPayments(studentId);
  };

  const loadStudentGamificationByStudentIdUseCase = {
    execute: async ({ studentId, studentData = null, physicalTests = null }) => {
      const student = studentData || await repository.findStudentById(studentId);
      const tests = physicalTests || await repository.listPhysicalTests(studentId);
      const [attendances, payments, storedProfile, storedAchievements, achievementCatalog, challengeCatalog, storedChallengeProgress] = await Promise.all([
        listAttendances(studentId),
        listPayments(studentId),
        repository.getProfile(studentId),
        repository.listStudentAchievements(studentId),
        repository.listAchievementCatalog(),
        repository.listActiveChallenges(todayProvider()),
        repository.listStudentChallengeProgress(studentId),
      ]);

      const derived = buildProjection({
        student,
        tests,
        attendances,
        payments,
        achievementCatalog,
        challengeCatalog,
        today: todayProvider(),
        syncedAt: storedProfile?.last_synced_at || isoProvider(),
      });

      const shouldUseStoredProfile = Boolean(storedProfile) && Number(storedProfile.total_xp || 0) >= Number(derived.profile.total_xp || 0);
      const baseProfile = shouldUseStoredProfile ? storedProfile : derived.profile;
      const levelInfo = getLevelInfo(baseProfile.total_xp);
      const effectiveProfile = shouldUseStoredProfile
        ? {
            ...storedProfile,
            summary: {
              ...(derived.profile.summary || {}),
              ...(storedProfile.summary || {}),
              levelTitle: storedProfile.summary?.levelTitle || levelInfo.title,
              xpToNextLevel: storedProfile.summary?.xpToNextLevel ?? levelInfo.xpToNextLevel,
              nextLevel: storedProfile.summary?.nextLevel ?? (levelInfo.nextLevel?.title || null),
            },
          }
        : derived.profile;

      const achievementRows = storedAchievements?.length >= derived.achievements.length
        ? storedAchievements
        : derived.achievements;
      const achievements = formatAchievementRows({ rows: achievementRows, catalog: achievementCatalog });
      const shouldUseStoredChallenges = storedChallengeProgress?.length > 0
        && storedChallengeProgress.length >= getChallengeCatalog(challengeCatalog).length;
      const lockedAchievements = buildLockedAchievements({
        catalog: achievementCatalog,
        earnedRows: achievementRows,
        tests,
        jumpDelta: derived.profile.summary?.jumpDelta,
        strengthDelta: derived.profile.summary?.strengthDelta,
        streaks: {
          longestStreak: derived.profile.longest_streak,
        },
        attendanceStats: {
          totalAttendances: derived.profile.summary?.totalAttendances || 0,
          currentMonthAttendances: derived.profile.summary?.currentMonthAttendances || 0,
        },
        paymentStats: {
          totalPayments: derived.profile.summary?.totalPayments || 0,
          uniquePaymentMonths: derived.profile.summary?.uniquePaymentMonths || 0,
          hasActiveCoverage: Boolean(derived.profile.summary?.hasActivePayment),
        },
      });
      const challenges = shouldUseStoredChallenges
        ? formatChallenges({ rows: storedChallengeProgress, catalog: challengeCatalog })
        : formatChallenges({ rows: derived.challenges, catalog: challengeCatalog });
      const profileView = buildProfileView({ profile: effectiveProfile, levelInfo });
      let leaderboardRows = await repository.listCategoryLeaderboard({
        category: student.categoria,
        ageBand: derived.ageBand,
        limit: 5,
      });

      if (!leaderboardRows || leaderboardRows.length === 0) {
        const studentsInCategory = await repository.listStudentsByCategory(student.categoria);
        const profiles = await repository.listProfilesByStudentIds(studentsInCategory.map((categoryStudent) => categoryStudent.id));
        leaderboardRows = buildDerivedLeaderboardRows({
          students: studentsInCategory,
          profiles,
          currentStudent: student,
          currentProfileView: profileView,
          today: todayProvider(),
          ageBand: derived.ageBand,
        }).slice(0, 5);
      }

      const nudges = buildNudges({
        profile: profileView,
        challenges,
        lockedAchievements,
      });

      return {
        profile: profileView,
        achievements,
        lockedAchievements,
        challenges,
        nudges,
        leaderboard: formatLeaderboard({ rows: leaderboardRows, studentId: student.id }),
        status: {
          hasStoredProfile: Boolean(storedProfile),
          source: shouldUseStoredProfile ? 'stored' : 'derived',
        },
      };
    },
  };

  const loadStudentGamificationUseCase = {
    execute: async ({ userId }) => {
      const student = await repository.findStudentByUserId(userId);
      return loadStudentGamificationByStudentIdUseCase.execute({ studentId: student.id, studentData: student });
    },
  };

  const refreshStudentProgressUseCase = {
    execute: async ({ studentId }) => {
      const today = todayProvider();
      const syncedAt = isoProvider();
      const [student, tests, attendances, payments, achievementCatalog, challengeCatalog] = await Promise.all([
        repository.findStudentById(studentId),
        repository.listPhysicalTests(studentId),
        listAttendances(studentId),
        listPayments(studentId),
        repository.listAchievementCatalog(),
        repository.listActiveChallenges(today),
      ]);

      const projection = buildProjection({
        student,
        tests,
        attendances,
        payments,
        achievementCatalog,
        challengeCatalog,
        today,
        syncedAt,
      });

      await repository.upsertProfile(projection.profile);
      await repository.replaceRewardEvents(studentId, projection.rewardEvents);
      await repository.replaceStudentAchievements(
        studentId,
        projection.achievements.map((achievement) => ({
          student_id: studentId,
          achievement_slug: achievement.achievement_slug,
          source_test_id: achievement.source_test_id,
          metadata: achievement.metadata,
          earned_at: achievement.earned_at,
        }))
      );
      await repository.replaceChallengeProgress(
        studentId,
        projection.challenges.map((challenge) => ({
          student_id: studentId,
          challenge_slug: challenge.challenge_slug,
          progress_value: challenge.progress_value,
          is_completed: challenge.is_completed,
          completed_at: challenge.completed_at,
          updated_at: challenge.updated_at,
        }))
      );

      const studentsInCategory = await repository.listStudentsByCategory(student.categoria);
      const profiles = await repository.listProfilesByStudentIds(studentsInCategory.map((categoryStudent) => categoryStudent.id));
      const profileMap = new Map((profiles || []).map((profile) => [profile.student_id, profile]));

      const groupedLeaderboardRows = studentsInCategory.reduce((groups, categoryStudent) => {
        const profile = profileMap.get(categoryStudent.id);
        if (!profile) return groups;

        const ageBand = deriveAgeBand(
          categoryStudent.fecha_nacimiento || categoryStudent.users?.fecha_nacimiento,
          today
        );
        const groupKey = `${categoryStudent.categoria || 'sin-categoria'}::${ageBand}`;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push({
          student_id: categoryStudent.id,
          categoria: categoryStudent.categoria || 'sin-categoria',
          age_band: ageBand,
          score: Number(profile.total_xp || 0),
          current_level: Number(profile.current_level || 1),
        });
        return groups;
      }, {});

      const leaderboardRows = Object.values(groupedLeaderboardRows).flatMap((rows) =>
        rows
          .sort((left, right) => {
            if (right.score !== left.score) return right.score - left.score;
            if (right.current_level !== left.current_level) return right.current_level - left.current_level;
            return left.student_id.localeCompare(right.student_id);
          })
          .map((row, index) => ({
            ...row,
            rank_position: index + 1,
            snapshot_date: today,
            updated_at: syncedAt,
          }))
      );

      await repository.replaceLeaderboardSnapshots({
        category: student.categoria || 'sin-categoria',
        snapshotDate: today,
        rows: leaderboardRows,
      });

      return {
        studentId,
        totalXp: projection.profile.total_xp,
        currentLevel: projection.profile.current_level,
      };
    },
  };

  const processPhysicalTestRecordedUseCase = {
    execute: async ({ studentId }) => refreshStudentProgressUseCase.execute({ studentId }),
  };

  const getCategoryLeaderboardUseCase = {
    execute: async ({ category, ageBand, limit = 10 }) => {
      const rows = await repository.listCategoryLeaderboard({ category, ageBand, limit });
      return formatLeaderboard({ rows, studentId: null });
    },
  };

  const listStudentAchievementsUseCase = {
    execute: async ({ studentId }) => {
      const [rows, catalog] = await Promise.all([
        repository.listStudentAchievements(studentId),
        repository.listAchievementCatalog(),
      ]);
      return formatAchievementRows({ rows, catalog });
    },
  };

  const listActiveChallengesUseCase = {
    execute: async ({ studentId }) => {
      const [rows, catalog] = await Promise.all([
        repository.listStudentChallengeProgress(studentId),
        repository.listActiveChallenges(todayProvider()),
      ]);
      return formatChallenges({ rows, catalog });
    },
  };

  return {
    loadStudentGamificationUseCase,
    loadStudentGamificationByStudentIdUseCase,
    refreshStudentProgressUseCase,
    processPhysicalTestRecordedUseCase,
    getCategoryLeaderboardUseCase,
    listStudentAchievementsUseCase,
    listActiveChallengesUseCase,
  };
};
