const DISPLAY_LABEL_OVERRIDES = Object.freeze({
  all: 'Todo',
  activo: 'Activo',
  administracion: 'Administracion',
  administrador: 'Administrador',
  anuncios: 'Anuncios',
  attendance_month: 'Asistencia mensual',
  attendance_total: 'Asistencia total',
  badge: 'Insignia',
  background: 'Fondo',
  daily_login: 'Ingreso diario',
  effect: 'Efecto',
  entrenador: 'Entrenador',
  estudiante: 'Estudiante',
  frame: 'Marco',
  general: 'General',
  iniciacion: 'Iniciacion',
  iniciacion_hombres: 'Iniciacion hombres',
  iniciacion_mujeres: 'Iniciacion mujeres',
  master: 'Master',
  master_mujeres: 'Master mujeres',
  mensualidad: 'Mensualidad',
  pago_diario: 'Pago diario',
  payments_total: 'Pagos totales',
  pendiente: 'Pendiente',
  perfeccionamiento: 'Perfeccionamiento',
  perfeccionamiento_hombres: 'Perfeccionamiento hombres',
  perfeccionamiento_mujeres: 'Perfeccionamiento mujeres',
  proximo_a_vencer: 'Proximo a vencer',
  sin_categoria: 'Sin categoria',
  vencido: 'Vencido',
  vigente: 'Vigente',
});

export const formatDisplayLabel = (value, fallback = 'Sin dato') => {
  if (value === null || value === undefined || value === '') return fallback;

  const normalized = String(value).trim();
  const key = normalized.toLowerCase();

  if (DISPLAY_LABEL_OVERRIDES[key]) {
    return DISPLAY_LABEL_OVERRIDES[key];
  }

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
};

export const formatCategoryLabel = (categoryCode) =>
  formatDisplayLabel(categoryCode, 'Sin categoria');

export const formatStatusLabel = (statusCode) =>
  formatDisplayLabel(statusCode, 'Sin estado');
