import { createAttendanceUseCases } from '../application/useCases/createAttendanceUseCases';
import { SupabaseAttendanceRepository } from '../infrastructure/repositories/supabaseAttendanceRepository';

export const createAttendanceService = (repository = new SupabaseAttendanceRepository(), deps = {}) => {
  const useCases = createAttendanceUseCases(repository, deps);
  const loadAthletes = async () => useCases.loadAthletesUseCase.execute();
  const loadAttendanceData = async ({ query, filters, athletes: currentAthletes }) =>
    useCases.loadAttendanceDataUseCase.execute({ query, filters, athletes: currentAthletes });
  const loadTodayAttendance = async ({ selectedDate, athletes }) =>
    useCases.loadTodayAttendanceUseCase.execute({ selectedDate, athletes });
  const loadActiveMensualidades = async ({ selectedDate }) =>
    useCases.loadActiveMensualidadesUseCase.execute({ selectedDate });
  const listPaymentTypes = async () => useCases.listPaymentTypesUseCase.execute();
  const registerAttendanceWithPayment = async ({ athleteId, selectedDate, paymentTypeId }) =>
    useCases.registerAttendanceWithPaymentUseCase.execute({ athleteId, selectedDate, paymentTypeId });
  const removeAttendance = async ({ athleteId, selectedDate }) =>
    useCases.removeAttendanceUseCase.execute({ athleteId, selectedDate });
  const toggleAttendance = async ({ athleteId, selectedDate, isCurrentlyPresent }) =>
    useCases.toggleAttendanceUseCase.execute({ athleteId, selectedDate, isCurrentlyPresent });
  const clearAttendanceForDate = async ({ selectedDate }) =>
    useCases.clearAttendanceForDateUseCase.execute({ selectedDate });
  const getDefaultDates = () => useCases.getDefaultDatesUseCase.execute();
  const calculateStats = ({ attendances, athletes, todayAttendance, bulkMode, categories }) =>
    useCases.calculateStatsUseCase.execute({ attendances, athletes, todayAttendance, bulkMode, categories });
  const markAllPresentWithMensualidad = async ({ selectedDate, paymentTypes, todayAttendance }) =>
    useCases.markAllPresentWithMensualidadUseCase.execute({ selectedDate, paymentTypes, todayAttendance });
  const filterTodayAttendance = ({ todayAttendance, selectedCategory, searchTerm, searchPredicate }) =>
    useCases.filterTodayAttendanceUseCase.execute({ todayAttendance, selectedCategory, searchTerm, searchPredicate });
  const filterTodayAttendanceByCategory = ({ todayAttendance, category, searchTerm, searchPredicate }) =>
    useCases.filterTodayAttendanceByCategoryUseCase.execute({ todayAttendance, category, searchTerm, searchPredicate });
  const getCategoryStats = ({ filteredAthletes }) =>
    useCases.getCategoryStatsUseCase.execute({ filteredAthletes });
  const buildExportSummary = ({ asistenciasByDate, dateToExport, selectedDate, todayAttendance }) =>
    useCases.buildExportSummaryUseCase.execute({ asistenciasByDate, dateToExport, selectedDate, todayAttendance });
  const getPaymentTypeDisplay = ({ paymentTypes, metodoPagoId }) =>
    useCases.getPaymentTypeDisplayUseCase.execute({ paymentTypes, metodoPagoId });
  const getAthleteNameParts = ({ athleteUser }) =>
    useCases.getAthleteNamePartsUseCase.execute({ athleteUser });
  const getHomonymKey = ({ athleteUser }) =>
    useCases.getHomonymKeyUseCase.execute({ athleteUser });
  const getCompactDisplayName = ({ athleteUser, isHomonym = false }) =>
    useCases.getCompactDisplayNameUseCase.execute({ athleteUser, isHomonym });
  const getSearchNameBlob = ({ athleteUser }) =>
    useCases.getSearchNameBlobUseCase.execute({ athleteUser });
  const getAthleteInitials = ({ athleteUser }) =>
    useCases.getAthleteInitialsUseCase.execute({ athleteUser });
  const buildHomonymsByCompactName = ({ athletes }) =>
    useCases.buildHomonymsByCompactNameUseCase.execute({ athletes });
  const buildDayAttendanceBreakdown = ({ dayAttendances }) =>
    useCases.buildDayAttendanceBreakdownUseCase.execute({ dayAttendances });

  return {
    loadAthletes,
    loadAttendanceData,
    loadTodayAttendance,
    loadActiveMensualidades,
    listPaymentTypes,
    registerAttendanceWithPayment,
    removeAttendance,
    toggleAttendance,
    clearAttendanceForDate,
    getDefaultDates,
    calculateStats,
    markAllPresentWithMensualidad,
    filterTodayAttendance,
    filterTodayAttendanceByCategory,
    getCategoryStats,
    buildExportSummary,
    getPaymentTypeDisplay,
    getAthleteNameParts,
    getHomonymKey,
    getCompactDisplayName,
    getSearchNameBlob,
    getAthleteInitials,
    buildHomonymsByCompactName,
    buildDayAttendanceBreakdown,
  };
};
