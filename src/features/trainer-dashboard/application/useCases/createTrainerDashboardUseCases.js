import { getEcuadorDate, getEcuadorDateMinusDays, getEcuadorFirstDayOfMonth } from '../../../../utils/dateUtils';
import { formatCategoryLabel } from '../../../../shared/lib/trainingCategoryFormatting';

export const createTrainerDashboardUseCases = (repository) => {
  const loadStatsUseCase = {
    execute: async () => {
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
    },
  };

  const loadCategoriesStatsUseCase = {
    execute: async () => {
      const [students, categoriesCatalog] = await Promise.all([
        typeof repository.listStudentCategories === 'function'
          ? repository.listStudentCategories()
          : Promise.resolve([]),
        typeof repository.listTrainingCategoriesForStudents === 'function'
          ? repository.listTrainingCategoriesForStudents()
          : Promise.resolve([]),
      ]);

      const countsByCode = new Map();
      (students || []).forEach((student) => {
        if (!student?.categoria) return;
        countsByCode.set(student.categoria, (countsByCode.get(student.categoria) || 0) + 1);
      });

      const labelsByCode = new Map(
        (categoriesCatalog || []).map((category) => [
          category.code,
          category.label || formatCategoryLabel(category.code),
        ])
      );

      const allCodes = new Set([
        ...labelsByCode.keys(),
        ...countsByCode.keys(),
      ]);

      return {
        items: Array.from(allCodes)
          .map((code) => ({
            code,
            label: labelsByCode.get(code) || formatCategoryLabel(code),
            total: countsByCode.get(code) || 0,
          }))
          .sort((left, right) => left.label.localeCompare(right.label, 'es')),
        loading: false,
      };
    },
  };

  const loadDashboardUseCase = {
    execute: async () => {
      const [stats, categoriesStats] = await Promise.all([
        loadStatsUseCase.execute(),
        loadCategoriesStatsUseCase.execute(),
      ]);

      return {
        stats,
        categoriesStats,
      };
    },
  };

  return {
    loadStatsUseCase,
    loadCategoriesStatsUseCase,
    loadDashboardUseCase,
  };
};
