import { getEcuadorDate, getEcuadorDateMinusDays, getEcuadorFirstDayOfMonth } from '../../../utils/dateUtils';
import { SupabaseTrainerDashboardRepository } from '../infrastructure/repositories/supabaseTrainerDashboardRepository';

export const createTrainerDashboardService = (repository = new SupabaseTrainerDashboardRepository()) => {
  const loadStats = async () => {
    const today = getEcuadorDate();
    const thirtyDaysAgo = getEcuadorDateMinusDays(30);
    const firstDayOfMonth = getEcuadorFirstDayOfMonth();

    const [totalAtletas, asistenciasHoy, testsPendientes, pagosDelMes] = await Promise.all([
      repository.countStudents(),
      repository.countAttendancesByDate(today),
      repository.countPhysicalTestsFromDate(thirtyDaysAgo),
      repository.countPaymentsFromDate(firstDayOfMonth),
    ]);

    return {
      totalAtletas: totalAtletas || 0,
      asistenciasHoy: asistenciasHoy || 0,
      testsPendientes: testsPendientes || 0,
      pagosDelMes: pagosDelMes || 0,
    };
  };

  return { loadStats };
};
