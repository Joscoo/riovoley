import { getEcuadorDate, getEcuadorISOString } from '../../../../utils/dateUtils';
import {
  createGamificationFoundationUseCases,
  formatCurrencyLedgerRows,
  formatXpLedgerRows,
} from './createGamificationFoundationUseCases';
import {
  AVATAR_STYLE_OPTIONS,
  DEFAULT_AVATAR_STYLE,
  getAvatarStyleMeta,
  isValidAvatarStyle,
} from '../../domain/avatarCatalog';
import { buildAvatarUrl } from '../../domain/buildAvatarUrl';

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
const LEVEL_COIN_REWARDS = {
  2: 10,
  3: 15,
  4: 22,
  5: 30,
};
const CURRENT_MONTH_CHALLENGE_TARGETS = {
  monthly_check_in: 1,
  attendance_monthly_rhythm: 8,
};
const NEXT_MONTH_CHALLENGE_TARGETS = {
  monthly_check_in: 2,
  attendance_monthly_rhythm: 10,
};

const isWeekdayDate = (dateValue) => {
  if (!dateValue) return false;
  const day = new Date(`${dateValue}T00:00:00`).getUTCDay();
  return day >= 1 && day <= 5;
};

const getPreviousBusinessDay = (dateValue) => {
  const cursor = new Date(`${dateValue}T00:00:00`);
  do {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  } while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6);
  return cursor.toISOString().slice(0, 10);
};
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
    slug: 'jump_up_10',
    title: 'Despegue serio',
    description: 'Mejora al menos 10 cm en tu salto con carrera respecto a tu linea base.',
    core_driver: 'Desarrollo y logro',
    xp_reward: 180,
    sort_order: 101,
    visibility: 'public',
  },
  {
    slug: 'long_jump_200',
    title: 'Potencia horizontal',
    description: 'Alcanza al menos 200 cm en salto largo desde parado.',
    core_driver: 'Desarrollo y logro',
    xp_reward: 170,
    sort_order: 102,
    visibility: 'public',
  },
  {
    slug: 'pullups_8',
    title: 'Dominio en barra',
    description: 'Consigue 8 dominadas en barra en un minuto.',
    core_driver: 'Propiedad y pertenencia',
    xp_reward: 160,
    sort_order: 103,
    visibility: 'public',
  },
  {
    slug: 'abs_40',
    title: 'Centro firme',
    description: 'Llega a 40 abdominales en un minuto.',
    core_driver: 'Creatividad y retroalimentacion',
    xp_reward: 150,
    sort_order: 104,
    visibility: 'public',
  },
  {
    slug: 'strength_total_120',
    title: 'Circuito completo',
    description: 'Suma 120 repeticiones entre abdomen, brazos, piernas y dominadas.',
    core_driver: 'Desarrollo y logro',
    xp_reward: 200,
    sort_order: 105,
    visibility: 'public',
  },
  {
    slug: 'attendance_month_12',
    title: 'Mes impecable',
    description: 'Completa 12 asistencias en el mismo mes.',
    core_driver: 'Escasez e impaciencia',
    xp_reward: 190,
    sort_order: 106,
    visibility: 'public',
  },
  {
    slug: 'attendance_total_24',
    title: 'Presencia total',
    description: 'Acumula 24 asistencias registradas.',
    core_driver: 'Influencia social y relacion',
    xp_reward: 210,
    sort_order: 107,
    visibility: 'public',
  },
  {
    slug: 'payment_streak_6',
    title: 'Media temporada al dia',
    description: 'Registra pagos en seis meses distintos.',
    core_driver: 'Propiedad y pertenencia',
    xp_reward: 210,
    sort_order: 108,
    visibility: 'public',
  },
  {
    slug: 'monthly_combo',
    title: 'Mes redondo',
    description: 'En el mismo mes completa al menos 1 test, 8 asistencias y mantien tu mensualidad activa.',
    core_driver: 'Epic Meaning & Calling',
    xp_reward: 240,
    sort_order: 109,
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

const DEFAULT_TITLES = [
  {
    slug: 'primer_impulso',
    name: 'Primer Impulso',
    description: 'Se desbloquea al completar tu primer test fisico.',
    rarity: 'common',
    sort_order: 10,
    criteria: { type: 'achievement', slug: 'first_test' },
  },
  {
    slug: 'ritmo_firme',
    name: 'Ritmo Firme',
    description: 'Reconoce una base real de constancia en entrenamientos.',
    rarity: 'common',
    sort_order: 20,
    criteria: { type: 'achievement', slug: 'attendance_total_12' },
  },
  {
    slug: 'guardian_del_mes',
    name: 'Guardian del Mes',
    description: 'Premia mantener tu mensualidad vigente.',
    rarity: 'common',
    sort_order: 30,
    criteria: { type: 'achievement', slug: 'payment_active_guard' },
  },
  {
    slug: 'salto_en_ascenso',
    name: 'Salto en Ascenso',
    description: 'Distingue una mejora seria en salto con carrera.',
    rarity: 'rare',
    sort_order: 40,
    criteria: { type: 'achievement', slug: 'jump_up_10' },
  },
  {
    slug: 'presencia_total',
    name: 'Presencia Total',
    description: 'Premia una constancia alta en asistencias.',
    rarity: 'rare',
    sort_order: 50,
    criteria: { type: 'achievement', slug: 'attendance_total_24' },
  },
  {
    slug: 'motor_constante',
    name: 'Motor Constante',
    description: 'Se obtiene al alcanzar el nivel Constante.',
    rarity: 'rare',
    sort_order: 60,
    criteria: { type: 'level', min: 3 },
  },
  {
    slug: 'capitan_del_progreso',
    name: 'Capitan del Progreso',
    description: 'Se obtiene al entrar a un nivel claramente competitivo.',
    rarity: 'epic',
    sort_order: 70,
    criteria: { type: 'level', min: 4 },
  },
  {
    slug: 'rey_del_salto',
    name: 'Rey del Salto',
    description: 'Reconoce a quien lidera el salto con carrera.',
    rarity: 'epic',
    sort_order: 80,
    criteria: { type: 'leaderboard_top', board: 'jump_approach' },
  },
  {
    slug: 'muro_del_equipo',
    name: 'Muro del Equipo',
    description: 'Premia liderar la tabla de asistencias.',
    rarity: 'epic',
    sort_order: 90,
    criteria: { type: 'leaderboard_top', board: 'attendance_total' },
  },
  {
    slug: 'leyenda_riovoley',
    name: 'Leyenda Riovoley',
    description: 'Premia liderar el progreso general de tu categoria.',
    rarity: 'legendary',
    sort_order: 100,
    criteria: { type: 'leaderboard_top', board: 'overall' },
  },
];

const translateCoreDriver = (value) => CORE_DRIVER_LABELS[value] || value || '';

const normalizeNickname = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
};

const isValidNickname = (value) =>
  !value || (
    value.length >= 3
    && value.length <= 24
    && /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ _-]+$/.test(value)
  );

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

const getCoinsFromXpSource = ({ sourceType, xpDelta = 0, label = '' }) => {
  switch (sourceType) {
    case 'physical_test':
      return 4;
    case 'attendance':
      return 2;
    case 'payment':
      return 6;
    case 'payment_status':
      return 4;
    case 'daily_login':
      return 1;
    case 'achievement':
      return Math.max(5, Math.round(Number(xpDelta || 0) / 20));
    default:
      return label.toLowerCase().includes('logro desbloqueado')
        ? Math.max(5, Math.round(Number(xpDelta || 0) / 20))
        : 0;
  }
};

const mapRowsByKey = (rows, key) =>
  (rows || []).reduce((map, row) => {
    const rowKey = row?.[key];
    if (rowKey) {
      map[rowKey] = row;
    }
    return map;
  }, {});

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
  const weekdayDates = [...new Set(rows.map((attendance) => attendance.fecha).filter(Boolean))]
    .filter(isWeekdayDate)
    .sort();
  let weekdayAttendanceStreak = 0;

  if (weekdayDates.length > 0) {
    weekdayAttendanceStreak = 1;
    for (let index = weekdayDates.length - 1; index > 0; index -= 1) {
      if (getPreviousBusinessDay(weekdayDates[index]) === weekdayDates[index - 1]) {
        weekdayAttendanceStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    totalAttendances: rows.length,
    currentMonthAttendances: monthBuckets[currentMonthKey] || 0,
    bestMonthAttendances: Math.max(0, ...Object.values(monthBuckets)),
    weekdayAttendanceStreak,
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

const buildStrengthTotal = (test) =>
  ['fuerza_abdomen', 'fuerza_brazos', 'fuerza_piernas', 'elevaciones_barra']
    .map((key) => toNumber(test?.[key]) || 0)
    .reduce((sum, value) => sum + value, 0);

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

const getTitleCatalog = (catalog) => {
  if (catalog && catalog.length > 0) {
    const defaultsMap = new Map(DEFAULT_TITLES.map((entry) => [entry.slug, entry]));
    return [...catalog]
      .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0))
      .map((entry) => {
        const fallback = defaultsMap.get(entry.slug) || {};
        return {
          ...entry,
          name: entry.name || fallback.name || entry.slug,
          description: entry.description || fallback.description || '',
          rarity: entry.rarity || fallback.rarity || 'common',
          criteria: entry.criteria || fallback.criteria || {},
        };
      });
  }

  return DEFAULT_TITLES;
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
  const strengthTotal = buildStrengthTotal(latestTest);
  const longJump = toNumber(latestTest?.fuerza_explosiva_salto_largo) || 0;
  const pullups = toNumber(latestTest?.elevaciones_barra) || 0;
  const absCount = toNumber(latestTest?.fuerza_abdomen) || 0;

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
      case 'jump_up_10':
        return jumpDelta != null && jumpDelta >= 10;
      case 'long_jump_200':
        return longJump >= 200;
      case 'pullups_8':
        return pullups >= 8;
      case 'abs_40':
        return absCount >= 40;
      case 'strength_total_120':
        return strengthTotal >= 120;
      case 'attendance_month_12':
        return attendanceStats.currentMonthAttendances >= 12;
      case 'attendance_total_24':
        return attendanceStats.totalAttendances >= 24;
      case 'payment_streak_6':
        return paymentStats.uniquePaymentMonths >= 6;
      case 'monthly_combo':
        return (tests?.length || 0) > 0
          && streaks.currentMonthTests >= 1
          && attendanceStats.currentMonthAttendances >= 8
          && paymentStats.hasActiveCoverage;
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

const buildXpLedgerEntries = ({ studentId, rewardEvents }) =>
  (rewardEvents || []).map((event) => {
    if (event.source_type === 'physical_test') {
      return {
        student_id: studentId,
        source_type: 'physical_test',
        source_ref: event.source_id || null,
        xp_delta: Number(event.xp_awarded || 0),
        label: 'Test fisico registrado',
        description: 'Nueva evaluacion fisica validada dentro de tu progreso.',
        metadata: event.payload || {},
        occurred_at: event.created_at,
        created_at: event.created_at,
      };
    }

    if (event.source_type === 'attendance') {
      return {
        student_id: studentId,
        source_type: 'attendance',
        source_ref: event.source_id || null,
        xp_delta: Number(event.xp_awarded || 0),
        label: 'Asistencia registrada',
        description: 'Entrenamiento validado dentro de tu progreso.',
        metadata: event.payload || {},
        occurred_at: event.created_at,
        created_at: event.created_at,
      };
    }

    if (event.source_type === 'payment') {
      return {
        student_id: studentId,
        source_type: 'payment',
        source_ref: event.source_id || null,
        xp_delta: Number(event.xp_awarded || 0),
        label: 'Mensualidad registrada',
        description: 'Se registro un pago que suma a tu continuidad.',
        metadata: event.payload || {},
        occurred_at: event.created_at,
        created_at: event.created_at,
      };
    }

    if (event.source_type === 'payment_status') {
      return {
        student_id: studentId,
        source_type: 'payment_status',
        source_ref: event.source_id || null,
        xp_delta: Number(event.xp_awarded || 0),
        label: 'Cobertura activa',
        description: 'Tu mensualidad vigente aporto un bono ligero de continuidad.',
        metadata: event.payload || {},
        occurred_at: event.created_at,
        created_at: event.created_at,
      };
    }

    return {
      student_id: studentId,
      source_type: event.source_type || 'achievement',
      source_ref: event.source_id || null,
      xp_delta: Number(event.xp_awarded || 0),
      label: event.payload?.title ? `Logro desbloqueado: ${event.payload.title}` : 'Logro desbloqueado',
      description: 'Completaste un logro que aporta XP adicional.',
      metadata: event.payload || {},
      occurred_at: event.created_at,
      created_at: event.created_at,
    };
  });

const buildCurrencyLedgerEntries = ({ studentId, xpLedger, currentLevel }) => {
  const baseEntries = (xpLedger || [])
    .map((entry) => {
      const coinsDelta = getCoinsFromXpSource({
        sourceType: entry.source_type,
        xpDelta: entry.xp_delta,
        label: entry.label || '',
      });

      if (coinsDelta <= 0) {
        return null;
      }

      return {
        student_id: studentId,
        source_type: entry.source_type,
        source_ref: entry.source_ref || null,
        coins_delta: coinsDelta,
        label: `${entry.label || 'Progreso'} + monedas`,
        description: entry.source_type === 'daily_login'
          ? 'Tu regreso del dia tambien sumo una moneda ligera.'
          : 'Tu progreso verificado tambien te entrego monedas blandas.',
        metadata: entry.metadata || {},
        occurred_at: entry.occurred_at,
        created_at: entry.created_at,
      };
    })
    .filter(Boolean);

  const levelEntries = Object.entries(LEVEL_COIN_REWARDS)
    .filter(([level]) => Number(level) <= Number(currentLevel || 0))
    .map(([level, coins]) => ({
      student_id: studentId,
      source_type: 'level_reward',
      source_ref: `level-${level}`,
      coins_delta: Number(coins),
      label: `Nivel ${level} alcanzado`,
      description: 'Recompensa especial por subir de nivel en tu progreso.',
      metadata: { level: Number(level) },
      occurred_at: null,
      created_at: null,
    }));

  return [...baseEntries, ...levelEntries]
    .sort((left, right) => String(left.occurred_at || left.created_at || '').localeCompare(String(right.occurred_at || right.created_at || '')));
};

const buildCurrencyWallet = ({ studentId, currencyLedger, syncedAt }) => {
  const totalEarned = (currencyLedger || [])
    .filter((row) => Number(row.coins_delta || 0) > 0)
    .reduce((sum, row) => sum + Number(row.coins_delta || 0), 0);
  const totalSpent = Math.abs((currencyLedger || [])
    .filter((row) => Number(row.coins_delta || 0) < 0)
    .reduce((sum, row) => sum + Number(row.coins_delta || 0), 0));
  return {
    student_id: studentId,
    balance: Math.max(totalEarned - totalSpent, 0),
    total_earned: totalEarned,
    total_spent: totalSpent,
    last_synced_at: syncedAt,
    updated_at: syncedAt,
  };
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

const formatMonthLabel = (dateString) => {
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }
  return parsed.toLocaleDateString('es-EC', {
    timeZone: 'America/Guayaquil',
    month: 'long',
    year: 'numeric',
  });
};

const getNextMonthStart = (today) => {
  const [year, month] = today.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${`${nextMonth}`.padStart(2, '0')}-01`;
};

const buildUpcomingChallenges = ({ catalog, today, currentChallenges }) => {
  const effectiveCatalog = getChallengeCatalog(catalog);
  const nextMonthStart = getNextMonthStart(today);
  const nextMonthLabel = formatMonthLabel(nextMonthStart);
  const currentChallengeMap = new Map((currentChallenges || []).map((challenge) => [challenge.slug || challenge.challenge_slug, challenge]));

  return effectiveCatalog
    .filter((challenge) => ['calendar-month', 'rolling'].includes(challenge.window_type))
    .slice(0, 4)
    .map((challenge) => {
      const currentProgress = currentChallengeMap.get(challenge.slug);
      const nextTarget = NEXT_MONTH_CHALLENGE_TARGETS[challenge.slug] || Number(challenge.target_value || 0);
      return {
        slug: challenge.slug,
        title: challenge.window_type === 'calendar-month' ? `${challenge.title} de ${nextMonthLabel}` : challenge.title,
        description: challenge.window_type === 'calendar-month'
          ? `${challenge.description} El proximo objetivo sera en ${nextMonthLabel}.`
          : challenge.description,
        targetValue: nextTarget,
        currentProgressValue: Number(currentProgress?.progressValue || currentProgress?.progress_value || 0),
        currentTargetValue: CURRENT_MONTH_CHALLENGE_TARGETS[challenge.slug] || Number(challenge.target_value || 0),
        startsOn: nextMonthStart,
        windowType: challenge.window_type,
      };
    });
};

const buildProjection = ({
  student,
  tests,
  attendances,
  payments,
  achievementCatalog,
  challengeCatalog,
  today,
  syncedAt,
  existingXpLedger = [],
  existingCurrencyLedger = [],
}) => {
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
  const projectedXpLedger = buildXpLedgerEntries({
    studentId: student.id,
    rewardEvents,
  });
  const preservedDailyLoginEntries = (existingXpLedger || []).filter((entry) => entry.source_type === 'daily_login');
  const xpLedger = [...projectedXpLedger, ...preservedDailyLoginEntries]
    .sort((left, right) => String(left.occurred_at || '').localeCompare(String(right.occurred_at || '')));
  const totalXp = xpLedger.reduce((sum, entry) => sum + Number(entry.xp_delta || 0), 0);
  const levelInfo = getLevelInfo(totalXp);
  const currencyLedger = buildCurrencyLedgerEntries({
    studentId: student.id,
    xpLedger,
    currentLevel: levelInfo.level,
  });
  const preservedPurchaseEntries = (existingCurrencyLedger || []).filter((entry) => entry.source_type === 'cosmetic_purchase');
  const combinedCurrencyLedger = [...currencyLedger, ...preservedPurchaseEntries]
    .sort((left, right) => String(left.occurred_at || left.created_at || '').localeCompare(String(right.occurred_at || right.created_at || '')));
  const currencyWallet = buildCurrencyWallet({
    studentId: student.id,
    currencyLedger: combinedCurrencyLedger,
    syncedAt,
  });
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
  const strengthTotal = buildStrengthTotal(latestTest);

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
      strengthTotal,
      currentMonthTests: streaks.currentMonthTests,
      totalAttendances: attendanceStats.totalAttendances,
      currentMonthAttendances: attendanceStats.currentMonthAttendances,
      bestMonthAttendances: attendanceStats.bestMonthAttendances,
      weekdayAttendanceStreak: attendanceStats.weekdayAttendanceStreak,
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
    xpLedger,
    currencyLedger: combinedCurrencyLedger,
    currencyWallet,
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
  const latestTest = tests?.[tests.length - 1] || null;
  const strengthTotal = buildStrengthTotal(latestTest);
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
    case 'jump_up_10':
      return { current: Math.max(jumpDelta || 0, 0), target: 10, hint: 'Empuja tu salto con carrera hasta romper la barrera de 10 cm de mejora.' };
    case 'long_jump_200':
      return { current: Math.max(toNumber(latestTest?.fuerza_explosiva_salto_largo) || 0, 0), target: 200, hint: 'Trabaja potencia horizontal y recepcion de salto.' };
    case 'pullups_8':
      return { current: Math.max(toNumber(latestTest?.elevaciones_barra) || 0, 0), target: 8, hint: 'Refuerza espalda y brazos para subir tu marca en barra.' };
    case 'abs_40':
      return { current: Math.max(toNumber(latestTest?.fuerza_abdomen) || 0, 0), target: 40, hint: 'La estabilidad del tronco te ayudara a sostener mas potencia.' };
    case 'strength_total_120':
      return { current: Math.max(strengthTotal, 0), target: 120, hint: 'Suma repeticiones en todo tu bloque de fuerza.' };
    case 'attendance_month_12':
      return { current: attendanceStats.currentMonthAttendances || 0, target: 12, hint: 'Mantente presente en casi todas las sesiones del mes.' };
    case 'attendance_total_24':
      return { current: Math.min(attendanceStats.totalAttendances || 0, 24), target: 24, hint: 'La constancia larga tambien se recompensa.' };
    case 'payment_streak_6':
      return { current: Math.min(paymentStats.uniquePaymentMonths || 0, 6), target: 6, hint: 'Sostener tu continuidad administrativa tambien cuenta.' };
    case 'monthly_combo':
      return {
        current: Math.min(
          (streaks.currentMonthTests >= 1 ? 1 : 0)
          + (attendanceStats.currentMonthAttendances >= 8 ? 1 : 0)
          + (paymentStats.hasActiveCoverage ? 1 : 0),
          3
        ),
        target: 3,
        hint: 'Completa evaluacion, constancia y cobertura vigente dentro del mismo mes.',
      };
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

const buildRecommendations = ({ profile, latestTest, challenges, lockedAchievements }) => {
  const recommendations = [];
  const jumpGap = Math.max(
    (toNumber(latestTest?.brazo_extend_con_impulso) || 0) - (toNumber(latestTest?.brazo_extend_sin_impulso) || 0),
    0
  );
  const pullups = toNumber(latestTest?.elevaciones_barra) || 0;
  const longJump = toNumber(latestTest?.fuerza_explosiva_salto_largo) || 0;
  const absCount = toNumber(latestTest?.fuerza_abdomen) || 0;
  const nextChallenge = (challenges || []).find((challenge) => !challenge.isCompleted);

  if ((profile?.summary?.currentMonthTests || 0) === 0) {
    recommendations.push({
      id: 'schedule-test',
      title: 'Agenda tu evaluacion del mes',
      message: 'Todavia no registras un test este mes. Hacerlo te dara una nueva referencia y puede abrir varios logros.',
      focus: 'Medicion',
    });
  }

  if (jumpGap < 8) {
    recommendations.push({
      id: 'approach-jump',
      title: 'Convierte mejor tu carrera en altura',
      message: 'Tu salto con carrera todavia no se despega mucho de tu salto estatico. Trabaja la coordinacion del remate y la transferencia de velocidad.',
      focus: 'Salto',
    });
  }

  if (pullups < 6) {
    recommendations.push({
      id: 'pullups',
      title: 'Sube tu fuerza de traccion',
      message: 'Ganar dominadas te ayudara a mejorar control corporal, estabilidad y fuerza general.',
      focus: 'Barra',
    });
  }

  if (longJump > 0 && longJump < 190) {
    recommendations.push({
      id: 'long-jump',
      title: 'Empuja mas tu potencia horizontal',
      message: 'Tu salto largo aun tiene margen. Trabaja salida de cadera, recepcion y fuerza explosiva de piernas.',
      focus: 'Potencia',
    });
  }

  if (absCount > 0 && absCount < 35) {
    recommendations.push({
      id: 'core',
      title: 'Fortalece tu zona media',
      message: 'Mejorar el abdomen te dara mas estabilidad para saltar, aterrizar y sostener repeticiones de fuerza.',
      focus: 'Core',
    });
  }

  if (nextChallenge) {
    recommendations.push({
      id: `challenge-focus-${nextChallenge.slug}`,
      title: `Preparate para ${nextChallenge.title}`,
      message: `Tu reto mas cercano pide ${nextChallenge.targetValue} y ya llevas ${nextChallenge.progressValue}. Organiza tu semana para cerrarlo.`,
      focus: 'Reto',
    });
  }

  const comboAchievement = lockedAchievements.find((achievement) => achievement.achievementSlug === 'monthly_combo');
  if (comboAchievement) {
    recommendations.push({
      id: 'combo',
      title: 'Busca un mes redondo',
      message: 'Si completas evaluacion, constancia y mensualidad vigente en el mismo mes, desbloqueas una de las recompensas mas fuertes.',
      focus: 'Combo',
    });
  }

  return recommendations.slice(0, 4);
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

const LEADERBOARD_DEFINITIONS = [
  {
    type: 'overall',
    title: 'Progreso general',
    description: 'Ranking por experiencia total acumulada.',
    metricKey: 'total_xp',
    unit: 'XP',
    scoreLabel: 'Puntaje',
    isEligible: ({ hasAnyActivity }) => hasAnyActivity,
    getScore: ({ profile }) => Number(profile.total_xp || 0),
  },
  {
    type: 'jump_approach',
    title: 'Salto con carrera',
    description: 'Mayor alcance vertical con carrera de remate.',
    metricKey: 'brazo_extend_con_impulso',
    unit: 'cm',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.brazo_extend_con_impulso) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.brazo_extend_con_impulso),
  },
  {
    type: 'standing_reach',
    title: 'Alcance de pie',
    description: 'Mayor alcance de pie con brazo dominante extendido.',
    metricKey: 'brazo_extend_inicial',
    unit: 'cm',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.brazo_extend_inicial) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.brazo_extend_inicial),
  },
  {
    type: 'wingspan',
    title: 'Envergadura',
    description: 'Mayor envergadura registrada en brazos extendidos.',
    metricKey: 'envergadura_brazos_extendidos_lateral',
    unit: 'cm',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.envergadura_brazos_extendidos_lateral) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.envergadura_brazos_extendidos_lateral),
  },
  {
    type: 'jump_static',
    title: 'Salto estatico',
    description: 'Mayor alcance vertical desde salto estatico.',
    metricKey: 'brazo_extend_sin_impulso',
    unit: 'cm',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.brazo_extend_sin_impulso) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.brazo_extend_sin_impulso),
  },
  {
    type: 'long_jump',
    title: 'Salto largo',
    description: 'Mayor distancia alcanzada en salto largo desde parado.',
    metricKey: 'fuerza_explosiva_salto_largo',
    unit: 'cm',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.fuerza_explosiva_salto_largo) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.fuerza_explosiva_salto_largo),
  },
  {
    type: 'strength_total',
    title: 'Fuerza total',
    description: 'Suma de tus repeticiones en abdomen, brazos, piernas y dominadas.',
    metricKey: 'strength_total',
    unit: 'reps',
    scoreLabel: 'Total',
    isEligible: ({ latestTest }) => latestTest != null,
    getScore: ({ latestTest }) =>
      ['fuerza_abdomen', 'fuerza_brazos', 'fuerza_piernas', 'elevaciones_barra']
        .map((key) => toNumber(latestTest?.[key]) || 0)
        .reduce((sum, value) => sum + value, 0),
  },
  {
    type: 'abs_reps',
    title: 'Abdominales',
    description: 'Mayor cantidad de abdominales en un minuto.',
    metricKey: 'fuerza_abdomen',
    unit: 'reps',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.fuerza_abdomen) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.fuerza_abdomen),
  },
  {
    type: 'pushups_reps',
    title: 'Flexiones',
    description: 'Mayor cantidad de flexiones de brazo en un minuto.',
    metricKey: 'fuerza_brazos',
    unit: 'reps',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.fuerza_brazos) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.fuerza_brazos),
  },
  {
    type: 'squats_reps',
    title: 'Sentadillas',
    description: 'Mayor cantidad de sentadillas en un minuto.',
    metricKey: 'fuerza_piernas',
    unit: 'reps',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.fuerza_piernas) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.fuerza_piernas),
  },
  {
    type: 'pullups_reps',
    title: 'Dominadas',
    description: 'Mayor cantidad de dominadas en barra en un minuto.',
    metricKey: 'elevaciones_barra',
    unit: 'reps',
    scoreLabel: 'Marca',
    isEligible: ({ latestTest }) => toNumber(latestTest?.elevaciones_barra) != null,
    getScore: ({ latestTest }) => toNumber(latestTest?.elevaciones_barra),
  },
  {
    type: 'attendance_total',
    title: 'Asistencias totales',
    description: 'Quien mas entrenamientos ha registrado.',
    metricKey: 'attendance_total',
    unit: 'asis.',
    scoreLabel: 'Asistencias',
    isEligible: ({ attendanceStats }) => Number(attendanceStats.totalAttendances || 0) > 0,
    getScore: ({ attendanceStats }) => Number(attendanceStats.totalAttendances || 0),
  },
  {
    type: 'attendance_month',
    title: 'Asistencias del mes',
    description: 'Quien mejor ritmo lleva durante el mes actual.',
    metricKey: 'attendance_month',
    unit: 'asis.',
    scoreLabel: 'Este mes',
    isEligible: ({ attendanceStats }) => Number(attendanceStats.currentMonthAttendances || 0) > 0,
    getScore: ({ attendanceStats }) => Number(attendanceStats.currentMonthAttendances || 0),
  },
  {
    type: 'payments_total',
    title: 'Mensualidades registradas',
    description: 'Quien mas mensualidades tiene registradas en el sistema.',
    metricKey: 'payments_total',
    unit: 'pagos',
    scoreLabel: 'Registros',
    isEligible: ({ paymentStats }) => Number(paymentStats.totalPayments || 0) > 0,
    getScore: ({ paymentStats }) => Number(paymentStats.totalPayments || 0),
  },
];

const buildCompetitorName = (student, identity = null) => {
  const nickname = normalizeNickname(identity?.nickname);
  if (nickname) {
    return nickname;
  }
  const fullName = `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim();
  return fullName || student.public_alias || student.users?.public_alias || 'Estudiante';
};

const buildStudentRealName = (student) => {
  const fullName = `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim();
  return fullName || 'Estudiante';
};

const hasAchievementSlug = (achievements, slug) =>
  (achievements || []).some((achievement) => achievement.achievement_slug === slug || achievement.achievementSlug === slug);

const isTitleUnlocked = ({ title, achievements, profile, leaderboardSections, studentId }) => {
  const criteria = title.criteria || {};

  switch (criteria.type) {
    case 'achievement':
      return hasAchievementSlug(achievements, criteria.slug);
    case 'level':
      return Number(profile?.current_level || 0) >= Number(criteria.min || 0);
    case 'leaderboard_top': {
      const board = (leaderboardSections || []).find((section) => section.type === criteria.board);
      return board?.rows?.[0]?.student_id === studentId;
    }
    default:
      return false;
  }
};

const buildUnlockedTitles = ({ titleCatalog, achievements, profile, leaderboardSections, identity, studentId }) => {
  const catalog = getTitleCatalog(titleCatalog);
  const selectedTitleSlug = identity?.selected_title_slug || null;
  const unlockedTitles = catalog.map((title) => {
    const unlocked = isTitleUnlocked({
      title,
      achievements,
      profile,
      leaderboardSections,
      studentId,
    });

    return {
      slug: title.slug,
      name: title.name,
      description: title.description,
      rarity: title.rarity || 'common',
      isUnlocked: unlocked,
      isSelected: unlocked && selectedTitleSlug === title.slug,
    };
  });

  const equippedTitle = unlockedTitles.find((title) => title.isSelected)
    || unlockedTitles.find((title) => title.isUnlocked)
    || null;

  return {
    selectedTitleSlug: equippedTitle?.slug || null,
    equippedTitle,
    availableTitles: unlockedTitles,
  };
};

const buildIdentityView = ({ student, identity, titlesState, cosmetics }) => {
  const avatarStyle = isValidAvatarStyle(identity?.avatar_style) ? identity.avatar_style : DEFAULT_AVATAR_STYLE;
  const displayName = buildCompetitorName(student, identity);
  return {
    studentId: student.id,
    nickname: normalizeNickname(identity?.nickname),
    displayName,
    realName: buildStudentRealName(student),
    selectedTitleSlug: titlesState.selectedTitleSlug,
    equippedTitle: titlesState.equippedTitle,
    availableTitles: titlesState.availableTitles,
    avatarStyle,
    avatarStyleMeta: getAvatarStyleMeta(avatarStyle),
    avatarStyleOptions: AVATAR_STYLE_OPTIONS,
    avatarUrl: buildAvatarUrl({
      seed: `${student.id}-${displayName}`,
      style: avatarStyle,
      equipment: cosmetics?.equipment || {},
    }),
  };
};

const buildCosmeticsView = ({ catalog, ownedItems, equipment, wallet }) => {
  const ownedSlugs = new Set((ownedItems || []).map((item) => item.item_slug));
  const equippedBySlot = {
    frame: equipment?.frame_item_slug || null,
    background: equipment?.background_item_slug || null,
    badge: equipment?.badge_item_slug || null,
    effect: equipment?.effect_item_slug || null,
  };

  const items = (catalog || []).map((item) => {
    const category = item.category || 'misc';
    const isOwned = ownedSlugs.has(item.slug);
    return {
      slug: item.slug,
      name: item.name,
      description: item.description,
      rarity: item.rarity || 'common',
      category,
      priceCoins: Number(item.price_coins || 0),
      isOwned,
      isEquipped: equippedBySlot[category] === item.slug,
      canAfford: Number(wallet?.balance || 0) >= Number(item.price_coins || 0),
      metadata: item.metadata || {},
    };
  });

  return {
    balance: Number(wallet?.balance || 0),
    totalEarned: Number(wallet?.totalEarned || wallet?.total_earned || 0),
    totalSpent: Number(wallet?.totalSpent || wallet?.total_spent || 0),
    ledger: wallet?.ledger || [],
    items,
    equipment: equippedBySlot,
    inventoryCount: items.filter((item) => item.isOwned).length,
  };
};

const groupRowsByStudentId = (rows) =>
  (rows || []).reduce((map, row) => {
    const key = row.student_id;
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(row);
    return map;
  }, {});

const buildLeaderboardStudentEntry = ({
  student,
  identity = null,
  tests,
  attendances,
  payments,
  today,
  syncedAt,
}) => {
  const projection = buildProjection({
    student,
    tests,
    attendances,
    payments,
    achievementCatalog: [],
    challengeCatalog: [],
    today,
    syncedAt,
  });
  const latestTest = tests?.[tests.length - 1] || null;
  const attendanceStats = calculateAttendanceStats(attendances, today);
  const paymentStats = calculatePaymentStats(payments, today);
  const hasAnyActivity = (tests?.length || 0) > 0 || (attendances?.length || 0) > 0 || (payments?.length || 0) > 0;

  return {
    student,
    ageBand: deriveAgeBand(student.fecha_nacimiento || student.users?.fecha_nacimiento, today),
    identity,
    competitorName: buildCompetitorName(student, identity),
    realName: buildStudentRealName(student),
    profile: projection.profile,
    achievements: projection.achievements,
    latestTest,
    attendanceStats,
    paymentStats,
    hasAnyActivity,
  };
};

const limitLeaderboardRows = ({ rows, currentStudentId, limit }) => {
  const ordered = rows || [];
  if (!currentStudentId || ordered.length <= limit) {
    return ordered.slice(0, limit);
  }

  const topRows = ordered.slice(0, limit);
  if (topRows.some((row) => row.student_id === currentStudentId)) {
    return topRows;
  }

  const currentRow = ordered.find((row) => row.student_id === currentStudentId);
  return currentRow ? [...topRows.slice(0, Math.max(limit - 1, 0)), currentRow] : topRows;
};

const buildLeaderboardSections = ({
  students,
  identitiesByStudentId = {},
  testsByStudentId,
  attendancesByStudentId,
  paymentsByStudentId,
  today,
  syncedAt,
  ageBandFilter = null,
  currentStudentId = null,
  limit = 5,
}) => {
  const entries = (students || [])
    .map((student) =>
      buildLeaderboardStudentEntry({
        student,
        identity: identitiesByStudentId[student.id] || null,
        tests: testsByStudentId[student.id] || [],
        attendances: attendancesByStudentId[student.id] || [],
        payments: paymentsByStudentId[student.id] || [],
        today,
        syncedAt,
      })
    )
    .filter((entry) => (ageBandFilter ? entry.ageBand === ageBandFilter : true));

  return LEADERBOARD_DEFINITIONS.map((definition) => {
    const rankedRows = entries
      .filter((entry) => definition.isEligible(entry))
      .map((entry) => {
        const score = Number(definition.getScore(entry) || 0);
        return {
          student_id: entry.student.id,
          categoria: entry.student.categoria || 'sin-categoria',
          age_band: entry.ageBand,
          score,
          current_level: Number(entry.profile.current_level || 1),
          rank_position: 0,
          snapshot_date: today,
          public_alias: entry.competitorName,
          leaderboard_type: definition.type,
          metric_key: definition.metricKey,
        };
      })
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (right.current_level !== left.current_level) return right.current_level - left.current_level;
        return left.student_id.localeCompare(right.student_id);
      })
      .map((row, index) => ({
        ...row,
        rank_position: index + 1,
      }));

    const visibleRows = limitLeaderboardRows({
      rows: rankedRows,
      currentStudentId,
      limit,
    });

    return {
      type: definition.type,
      title: definition.title,
      description: definition.description,
      unit: definition.unit,
      scoreLabel: definition.scoreLabel,
      metricKey: definition.metricKey,
      totalParticipants: rankedRows.length,
      currentStudentRank: rankedRows.find((row) => row.student_id === currentStudentId)?.rank_position || null,
      rows: visibleRows,
    };
  }).filter((section) => section.totalParticipants > 0);
};

const buildEntriesByStudentId = (entries) =>
  (entries || []).reduce((map, entry) => {
    map[entry.student.id] = entry;
    return map;
  }, {});

const formatLeaderboard = ({ rows, studentId, definition, entriesByStudentId = {}, sections = [], titleCatalog = [] }) =>
  (rows || []).map((row) => {
    const entry = entriesByStudentId[row.student_id] || {};
    const titlesState = buildUnlockedTitles({
      titleCatalog,
      achievements: entry.achievements || [],
      profile: entry.profile || null,
      leaderboardSections: sections,
      identity: entry.identity || null,
      studentId: row.student_id,
    });

    return {
      studentId: row.student_id,
      categoria: row.categoria,
      ageBand: row.age_band,
      score: Number(row.score || 0),
      currentLevel: Number(row.current_level || 1),
      rankPosition: Number(row.rank_position || 0),
      snapshotDate: row.snapshot_date,
      publicAlias: row.public_alias || 'Anonimo',
      realName: row.real_name || entry.realName || row.public_alias || 'Estudiante',
      avatarUrl: buildAvatarUrl({
        seed: `${row.student_id}-${row.public_alias || entry.realName || 'Estudiante'}`,
        style: isValidAvatarStyle(entry.identity?.avatar_style) ? entry.identity.avatar_style : DEFAULT_AVATAR_STYLE,
      }),
      equippedTitle: titlesState.equippedTitle,
      leaderboardType: row.leaderboard_type || definition?.type || 'overall',
      metricKey: row.metric_key || definition?.metricKey || 'total_xp',
      unit: definition?.unit || 'XP',
      scoreLabel: definition?.scoreLabel || 'Puntaje',
      isCurrentStudent: row.student_id === studentId,
    };
  });

const formatLeaderboardSections = ({ sections, studentId, entriesByStudentId = {}, titleCatalog = [] }) =>
  (sections || []).map((section) => ({
    type: section.type,
    title: section.title,
    description: section.description,
    unit: section.unit,
    scoreLabel: section.scoreLabel,
    metricKey: section.metricKey,
    totalParticipants: section.totalParticipants,
    currentStudentRank: section.currentStudentRank,
    rows: formatLeaderboard({
      rows: section.rows,
      studentId,
      definition: section,
      entriesByStudentId,
      sections,
      titleCatalog,
    }),
  }));

export const createGamificationUseCases = (repository, deps = {}) => {
  const foundationUseCases = createGamificationFoundationUseCases(repository, deps);
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
  const listPhysicalTestsByStudentIds = async (studentIds) => {
    if (typeof repository.listPhysicalTestsByStudentIds !== 'function') {
      return [];
    }
    return repository.listPhysicalTestsByStudentIds(studentIds);
  };
  const listAttendancesByStudentIds = async (studentIds) => {
    if (typeof repository.listAttendancesByStudentIds !== 'function') {
      return [];
    }
    return repository.listAttendancesByStudentIds(studentIds);
  };
  const listPaymentsByStudentIds = async (studentIds) => {
    if (typeof repository.listPaymentsByStudentIds !== 'function') {
      return [];
    }
    return repository.listPaymentsByStudentIds(studentIds);
  };
  const listIdentitiesByStudentIds = async (studentIds) => {
    if (typeof repository.listIdentitiesByStudentIds !== 'function') {
      return [];
    }
    return repository.listIdentitiesByStudentIds(studentIds);
  };
  const getIdentity = async (studentId) => {
    if (typeof repository.getIdentity !== 'function') {
      return null;
    }
    return repository.getIdentity(studentId);
  };
  const listTitleCatalog = async () => {
    if (typeof repository.listTitleCatalog !== 'function') {
      return [];
    }
    return repository.listTitleCatalog();
  };
  const listCosmeticCatalog = async () => {
    if (typeof repository.listCosmeticCatalog !== 'function') {
      return [];
    }
    return repository.listCosmeticCatalog();
  };

  const loadStudentGamificationByStudentIdUseCase = {
    execute: async ({ studentId, studentData = null, physicalTests = null }) => {
      const student = studentData || await repository.findStudentById(studentId);
      const tests = physicalTests || await repository.listPhysicalTests(studentId);
      const [
        attendances,
        payments,
        storedProfile,
        storedIdentity,
        storedCurrencyWallet,
        storedAchievements,
        achievementCatalog,
        titleCatalog,
        cosmeticCatalog,
        challengeCatalog,
        storedChallengeProgress,
        storedXpLedger,
        storedCurrencyLedger,
        ownedCosmeticItems,
        cosmeticEquipment,
      ] = await Promise.all([
        listAttendances(studentId),
        listPayments(studentId),
        repository.getProfile(studentId),
        getIdentity(studentId),
        typeof repository.getCurrencyWallet === 'function' ? repository.getCurrencyWallet(studentId) : Promise.resolve(null),
        repository.listStudentAchievements(studentId),
        repository.listAchievementCatalog(),
        listTitleCatalog(),
        listCosmeticCatalog(),
        repository.listActiveChallenges(todayProvider()),
        repository.listStudentChallengeProgress(studentId),
        typeof repository.listXpLedger === 'function' ? repository.listXpLedger(studentId, null) : Promise.resolve([]),
        typeof repository.listCurrencyLedger === 'function' ? repository.listCurrencyLedger(studentId, null) : Promise.resolve([]),
        typeof repository.listStudentCosmeticItems === 'function' ? repository.listStudentCosmeticItems(studentId) : Promise.resolve([]),
        typeof repository.getStudentCosmeticEquipment === 'function' ? repository.getStudentCosmeticEquipment(studentId) : Promise.resolve(null),
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
        existingXpLedger: storedXpLedger,
        existingCurrencyLedger: storedCurrencyLedger,
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
      const studentsInCategory = await repository.listStudentsByCategory(student.categoria);
      const studentIds = studentsInCategory.map((categoryStudent) => categoryStudent.id);
      const [categoryTests, categoryAttendances, categoryPayments, categoryIdentities] = await Promise.all([
        listPhysicalTestsByStudentIds(studentIds),
        listAttendancesByStudentIds(studentIds),
        listPaymentsByStudentIds(studentIds),
        listIdentitiesByStudentIds(studentIds),
      ]);
      const identitiesByStudentId = mapRowsByKey(categoryIdentities, 'student_id');
      const testsByStudentId = groupRowsByStudentId(categoryTests);
      const attendancesByStudentId = groupRowsByStudentId(categoryAttendances);
      const paymentsByStudentId = groupRowsByStudentId(categoryPayments);
      const leaderboardSections = buildLeaderboardSections({
        students: studentsInCategory,
        identitiesByStudentId,
        testsByStudentId,
        attendancesByStudentId,
        paymentsByStudentId,
        today: todayProvider(),
        syncedAt: isoProvider(),
        ageBandFilter: derived.ageBand,
        currentStudentId: student.id,
        limit: 5,
      });
      const leaderboardEntriesByStudentId = buildEntriesByStudentId(
        (studentsInCategory || []).map((categoryStudent) =>
            buildLeaderboardStudentEntry({
              student: categoryStudent,
              identity: identitiesByStudentId[categoryStudent.id] || null,
              tests: testsByStudentId[categoryStudent.id] || [],
              attendances: attendancesByStudentId[categoryStudent.id] || [],
              payments: paymentsByStudentId[categoryStudent.id] || [],
              today: todayProvider(),
              syncedAt: isoProvider(),
            })
        )
      );
      const overallLeaderboardSection = leaderboardSections.find((section) => section.type === 'overall') || leaderboardSections[0] || null;
      const recommendations = buildRecommendations({
        profile: profileView,
        latestTest: tests?.[tests.length - 1] || null,
        challenges,
        lockedAchievements,
      });
      const upcomingChallenges = buildUpcomingChallenges({
        catalog: challengeCatalog,
        today: todayProvider(),
        currentChallenges: challenges,
      });

      const nudges = buildNudges({
        profile: profileView,
        challenges,
        lockedAchievements,
      });

      const xpLedger = storedXpLedger?.length > 0
        ? await foundationUseCases.loadXpLedgerUseCase.execute({ studentId: student.id, limit: 25 })
        : formatXpLedgerRows(derived.xpLedger).slice(0, 25);
      const currency = storedCurrencyWallet || storedCurrencyLedger?.length > 0
        ? await foundationUseCases.loadCurrencyWalletUseCase.execute({ studentId: student.id, limit: 20 })
        : {
            balance: Number(derived.currencyWallet.balance || 0),
            totalEarned: Number(derived.currencyWallet.total_earned || 0),
            totalSpent: Number(derived.currencyWallet.total_spent || 0),
            lastSyncedAt: derived.currencyWallet.last_synced_at || null,
            ledger: formatCurrencyLedgerRows(derived.currencyLedger).slice(0, 20),
          };
      const cosmetics = buildCosmeticsView({
        catalog: cosmeticCatalog,
        ownedItems: ownedCosmeticItems,
        equipment: cosmeticEquipment,
        wallet: currency,
      });
      const identity = buildIdentityView({
        student,
        identity: storedIdentity,
        titlesState: buildUnlockedTitles({
          titleCatalog,
          achievements: achievementRows,
          profile: effectiveProfile,
          leaderboardSections,
          identity: storedIdentity,
          studentId: student.id,
        }),
        cosmetics,
      });

      return {
        profile: profileView,
        identity,
        cosmetics,
        achievements,
        lockedAchievements,
        challenges,
        recommendations,
        upcomingChallenges,
        nudges,
        xpLedger,
        currency,
        leaderboard: overallLeaderboardSection
          ? formatLeaderboard({
              rows: overallLeaderboardSection.rows,
              studentId: student.id,
              definition: overallLeaderboardSection,
              entriesByStudentId: leaderboardEntriesByStudentId,
              sections: leaderboardSections,
              titleCatalog,
            })
          : [],
        leaderboards: formatLeaderboardSections({
          sections: leaderboardSections,
          studentId: student.id,
          entriesByStudentId: leaderboardEntriesByStudentId,
          titleCatalog,
        }),
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
      const [student, tests, attendances, payments, achievementCatalog, challengeCatalog, existingXpLedger, existingCurrencyLedger] = await Promise.all([
        repository.findStudentById(studentId),
        repository.listPhysicalTests(studentId),
        listAttendances(studentId),
        listPayments(studentId),
        repository.listAchievementCatalog(),
        repository.listActiveChallenges(today),
        typeof repository.listXpLedger === 'function' ? repository.listXpLedger(studentId, null) : Promise.resolve([]),
        typeof repository.listCurrencyLedger === 'function' ? repository.listCurrencyLedger(studentId, null) : Promise.resolve([]),
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
        existingXpLedger,
        existingCurrencyLedger,
      });

      await repository.upsertProfile(projection.profile);
      await repository.replaceRewardEvents(studentId, projection.rewardEvents);
      if (typeof repository.replaceXpLedger === 'function') {
        await repository.replaceXpLedger(studentId, projection.xpLedger);
      }
      if (typeof repository.upsertCurrencyWallet === 'function') {
        await repository.upsertCurrencyWallet(projection.currencyWallet);
      }
      if (typeof repository.replaceCurrencyLedger === 'function') {
        await repository.replaceCurrencyLedger(studentId, projection.currencyLedger);
      }
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
      const studentIds = studentsInCategory.map((categoryStudent) => categoryStudent.id);
      const [categoryTests, categoryAttendances, categoryPayments, categoryIdentities] = await Promise.all([
        listPhysicalTestsByStudentIds(studentIds),
        listAttendancesByStudentIds(studentIds),
        listPaymentsByStudentIds(studentIds),
        listIdentitiesByStudentIds(studentIds),
      ]);
      const identitiesByStudentId = mapRowsByKey(categoryIdentities, 'student_id');
      const leaderboardSections = buildLeaderboardSections({
        students: studentsInCategory,
        identitiesByStudentId,
        testsByStudentId: groupRowsByStudentId(categoryTests),
        attendancesByStudentId: groupRowsByStudentId(categoryAttendances),
        paymentsByStudentId: groupRowsByStudentId(categoryPayments),
        today,
        syncedAt,
        currentStudentId: student.id,
        limit: 999,
      });
      const overallLeaderboard = leaderboardSections.find((section) => section.type === 'overall');
      const leaderboardRows = (overallLeaderboard?.rows || []).map((row) => ({
        ...row,
        updated_at: syncedAt,
      }));

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
    execute: async ({ category, ageBand, limit = 10, leaderboardType = 'overall' }) => {
      const studentsInCategory = await repository.listStudentsByCategory(category);
      const studentIds = studentsInCategory.map((student) => student.id);
      const [categoryTests, categoryAttendances, categoryPayments, categoryIdentities, titleCatalog] = await Promise.all([
        listPhysicalTestsByStudentIds(studentIds),
        listAttendancesByStudentIds(studentIds),
        listPaymentsByStudentIds(studentIds),
        listIdentitiesByStudentIds(studentIds),
        listTitleCatalog(),
      ]);
      const testsByStudentId = groupRowsByStudentId(categoryTests);
      const attendancesByStudentId = groupRowsByStudentId(categoryAttendances);
      const paymentsByStudentId = groupRowsByStudentId(categoryPayments);
      const identitiesByStudentId = mapRowsByKey(categoryIdentities, 'student_id');
      const leaderboardSections = buildLeaderboardSections({
        students: studentsInCategory,
        identitiesByStudentId,
        testsByStudentId,
        attendancesByStudentId,
        paymentsByStudentId,
        today: todayProvider(),
        syncedAt: isoProvider(),
        ageBandFilter: ageBand || null,
        currentStudentId: null,
        limit,
      });
      const entriesByStudentId = buildEntriesByStudentId(
        (studentsInCategory || []).map((student) =>
          buildLeaderboardStudentEntry({
            student,
            identity: identitiesByStudentId[student.id] || null,
            tests: testsByStudentId[student.id] || [],
            attendances: attendancesByStudentId[student.id] || [],
            payments: paymentsByStudentId[student.id] || [],
            today: todayProvider(),
            syncedAt: isoProvider(),
          })
        )
      );
      const section = leaderboardSections.find((entry) => entry.type === leaderboardType)
        || leaderboardSections.find((entry) => entry.type === 'overall')
        || leaderboardSections[0];
      return section
        ? formatLeaderboard({
            rows: section.rows,
            studentId: null,
            definition: section,
            entriesByStudentId,
            sections: leaderboardSections,
            titleCatalog,
          })
        : [];
    },
  };

  const listCategoryLeaderboardsUseCase = {
    execute: async ({ category, ageBand, limit = 10 }) => {
      const studentsInCategory = await repository.listStudentsByCategory(category);
      const studentIds = studentsInCategory.map((student) => student.id);
      const [categoryTests, categoryAttendances, categoryPayments, categoryIdentities, titleCatalog] = await Promise.all([
        listPhysicalTestsByStudentIds(studentIds),
        listAttendancesByStudentIds(studentIds),
        listPaymentsByStudentIds(studentIds),
        listIdentitiesByStudentIds(studentIds),
        listTitleCatalog(),
      ]);
      const testsByStudentId = groupRowsByStudentId(categoryTests);
      const attendancesByStudentId = groupRowsByStudentId(categoryAttendances);
      const paymentsByStudentId = groupRowsByStudentId(categoryPayments);
      const identitiesByStudentId = mapRowsByKey(categoryIdentities, 'student_id');
      const leaderboardSections = buildLeaderboardSections({
        students: studentsInCategory,
        identitiesByStudentId,
        testsByStudentId,
        attendancesByStudentId,
        paymentsByStudentId,
        today: todayProvider(),
        syncedAt: isoProvider(),
        ageBandFilter: ageBand || null,
        currentStudentId: null,
        limit,
      });
      const entriesByStudentId = buildEntriesByStudentId(
        (studentsInCategory || []).map((student) =>
          buildLeaderboardStudentEntry({
            student,
            identity: identitiesByStudentId[student.id] || null,
            tests: testsByStudentId[student.id] || [],
            attendances: attendancesByStudentId[student.id] || [],
            payments: paymentsByStudentId[student.id] || [],
            today: todayProvider(),
            syncedAt: isoProvider(),
          })
        )
      );

      return formatLeaderboardSections({
        sections: leaderboardSections,
        studentId: null,
        entriesByStudentId,
        titleCatalog,
      });
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

  const updateStudentIdentityUseCase = {
    execute: async ({ userId, nickname, selectedTitleSlug = null, avatarStyle = DEFAULT_AVATAR_STYLE }) => {
      const student = await repository.findStudentByUserId(userId);
      const currentProjection = await loadStudentGamificationByStudentIdUseCase.execute({
        studentId: student.id,
        studentData: student,
      });
      const normalizedNickname = normalizeNickname(nickname);

      if (!isValidNickname(normalizedNickname)) {
        throw new Error('El apodo debe tener entre 3 y 24 caracteres y solo usar letras, numeros, espacios, guiones o guion bajo.');
      }

      const unlockedTitleSlugs = new Set(
        (currentProjection.identity?.availableTitles || [])
          .filter((title) => title.isUnlocked)
          .map((title) => title.slug)
      );

      if (selectedTitleSlug && !unlockedTitleSlugs.has(selectedTitleSlug)) {
        throw new Error('Solo puedes equipar titulos que ya hayas desbloqueado.');
      }

      if (!isValidAvatarStyle(avatarStyle)) {
        throw new Error('El estilo de avatar seleccionado no es valido.');
      }

      const existingIdentity = await getIdentity(student.id);
      const syncedAt = isoProvider();
      const payload = {
        student_id: student.id,
        nickname: normalizedNickname,
        selected_title_slug: selectedTitleSlug || null,
        avatar_style: avatarStyle,
        updated_at: syncedAt,
        nickname_updated_at: normalizedNickname !== normalizeNickname(existingIdentity?.nickname)
          ? syncedAt
          : existingIdentity?.nickname_updated_at || null,
      };

      if (existingIdentity?.created_at) {
        payload.created_at = existingIdentity.created_at;
      }

      await repository.upsertIdentity(payload);

      return loadStudentGamificationByStudentIdUseCase.execute({
        studentId: student.id,
        studentData: student,
      });
    },
  };

  const purchaseCosmeticItemUseCase = {
    execute: async ({ userId, itemSlug }) => {
      const student = await repository.findStudentByUserId(userId);
      await repository.purchaseCosmeticItem(student.id, itemSlug);
      await refreshStudentProgressUseCase.execute({ studentId: student.id });
      return loadStudentGamificationByStudentIdUseCase.execute({
        studentId: student.id,
        studentData: student,
      });
    },
  };

  const equipCosmeticItemUseCase = {
    execute: async ({ userId, itemSlug }) => {
      const student = await repository.findStudentByUserId(userId);
      await repository.equipCosmeticItem(student.id, itemSlug);
      return loadStudentGamificationByStudentIdUseCase.execute({
        studentId: student.id,
        studentData: student,
      });
    },
  };

  return {
    ...foundationUseCases,
    loadStudentGamificationUseCase,
    loadStudentGamificationByStudentIdUseCase,
    refreshStudentProgressUseCase,
    processPhysicalTestRecordedUseCase,
    getCategoryLeaderboardUseCase,
    listCategoryLeaderboardsUseCase,
    listStudentAchievementsUseCase,
    listActiveChallengesUseCase,
    updateStudentIdentityUseCase,
    purchaseCosmeticItemUseCase,
    equipCosmeticItemUseCase,
  };
};
