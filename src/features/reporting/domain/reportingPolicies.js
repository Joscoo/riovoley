import { invalidArgumentError } from './reportingErrors';

export const DEFAULT_REPORT_CODE = 'attendance_daily';
export const REPORT_BUCKET = 'reports';

export const buildDefaultFileName = (periodStart, periodEnd) => {
  if (!periodStart) {
    throw invalidArgumentError('periodStart es obligatorio para construir el nombre del archivo');
  }
  if (!periodEnd || periodStart === periodEnd) {
    return `reporte-asistencia-${periodStart}.pdf`;
  }
  return `reporte-asistencia-${periodStart}_a_${periodEnd}.pdf`;
};
