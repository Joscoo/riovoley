process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createAttendanceUseCases', () => ({
  __esModule: true,
  createAttendanceUseCases: jest.fn(),
}));

const { createAttendanceUseCases } = require('../application/useCases/createAttendanceUseCases');
const { createAttendanceService } = require('./createAttendanceService');

describe('createAttendanceService', () => {
  const mockLoadExecute = jest.fn();
  const mockLoadDataExecute = jest.fn();
  const mockLoadTodayExecute = jest.fn();
  const mockListPaymentTypesExecute = jest.fn();
  const mockRegisterExecute = jest.fn();
  const mockRemoveExecute = jest.fn();
  const mockToggleExecute = jest.fn();
  const mockClearExecute = jest.fn();
  const mockDefaultsExecute = jest.fn();
  const mockStatsExecute = jest.fn();
  const mockMarkAllExecute = jest.fn();
  const mockFilterTodayExecute = jest.fn();
  const mockFilterByCategoryExecute = jest.fn();
  const mockCategoryStatsExecute = jest.fn();
  const mockExportSummaryExecute = jest.fn();
  const mockPaymentTypeDisplayExecute = jest.fn();
  const mockAthleteNamePartsExecute = jest.fn();
  const mockHomonymKeyExecute = jest.fn();
  const mockCompactDisplayNameExecute = jest.fn();
  const mockSearchNameBlobExecute = jest.fn();
  const mockAthleteInitialsExecute = jest.fn();
  const mockHomonymsByCompactNameExecute = jest.fn();
  const mockDayBreakdownExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createAttendanceUseCases.mockReturnValue({
      loadAthletesUseCase: { execute: mockLoadExecute },
      loadAttendanceDataUseCase: { execute: mockLoadDataExecute },
      loadTodayAttendanceUseCase: { execute: mockLoadTodayExecute },
      listPaymentTypesUseCase: { execute: mockListPaymentTypesExecute },
      registerAttendanceWithPaymentUseCase: { execute: mockRegisterExecute },
      removeAttendanceUseCase: { execute: mockRemoveExecute },
      toggleAttendanceUseCase: { execute: mockToggleExecute },
      clearAttendanceForDateUseCase: { execute: mockClearExecute },
      getDefaultDatesUseCase: { execute: mockDefaultsExecute },
      calculateStatsUseCase: { execute: mockStatsExecute },
      markAllPresentWithMensualidadUseCase: { execute: mockMarkAllExecute },
      filterTodayAttendanceUseCase: { execute: mockFilterTodayExecute },
      filterTodayAttendanceByCategoryUseCase: { execute: mockFilterByCategoryExecute },
      getCategoryStatsUseCase: { execute: mockCategoryStatsExecute },
      buildExportSummaryUseCase: { execute: mockExportSummaryExecute },
      getPaymentTypeDisplayUseCase: { execute: mockPaymentTypeDisplayExecute },
      getAthleteNamePartsUseCase: { execute: mockAthleteNamePartsExecute },
      getHomonymKeyUseCase: { execute: mockHomonymKeyExecute },
      getCompactDisplayNameUseCase: { execute: mockCompactDisplayNameExecute },
      getSearchNameBlobUseCase: { execute: mockSearchNameBlobExecute },
      getAthleteInitialsUseCase: { execute: mockAthleteInitialsExecute },
      buildHomonymsByCompactNameUseCase: { execute: mockHomonymsByCompactNameExecute },
      buildDayAttendanceBreakdownUseCase: { execute: mockDayBreakdownExecute },
    });
  });

  it('loadAttendanceData delega en use case', async () => {
    mockLoadDataExecute.mockResolvedValueOnce({ athletes: [] });
    const service = createAttendanceService({});

    const result = await service.loadAttendanceData({ filters: {}, athletes: [] });

    expect(mockLoadDataExecute).toHaveBeenCalledWith({ filters: {}, athletes: [] });
    expect(result).toEqual({ athletes: [] });
  });

  it('registerAttendanceWithPayment delega payload', async () => {
    const service = createAttendanceService({});

    await service.registerAttendanceWithPayment({
      athleteId: 's1',
      selectedDate: '2026-05-17',
      paymentTypeId: 1,
    });

    expect(mockRegisterExecute).toHaveBeenCalledWith({
      athleteId: 's1',
      selectedDate: '2026-05-17',
      paymentTypeId: 1,
    });
  });

  it('getDefaultDates delega al use case', () => {
    mockDefaultsExecute.mockReturnValueOnce({ selectedDate: '2026-05-17' });
    const service = createAttendanceService({});

    const result = service.getDefaultDates();

    expect(mockDefaultsExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ selectedDate: '2026-05-17' });
  });

  it('markAllPresentWithMensualidad delega payload', async () => {
    mockMarkAllExecute.mockResolvedValueOnce({ updatedCount: 3 });
    const service = createAttendanceService({});

    const result = await service.markAllPresentWithMensualidad({
      selectedDate: '2026-05-17',
      paymentTypes: [{ id: 1, nombre: 'mensualidad' }],
      todayAttendance: [],
    });

    expect(mockMarkAllExecute).toHaveBeenCalledWith({
      selectedDate: '2026-05-17',
      paymentTypes: [{ id: 1, nombre: 'mensualidad' }],
      todayAttendance: [],
    });
    expect(result).toEqual({ updatedCount: 3 });
  });

  it('filterTodayAttendance delega payload', () => {
    mockFilterTodayExecute.mockReturnValueOnce([{ id: 's1' }]);
    const service = createAttendanceService({});

    const result = service.filterTodayAttendance({
      todayAttendance: [{ id: 's1' }],
      selectedCategory: 'all',
      searchTerm: '',
      searchPredicate: jest.fn(),
    });

    expect(mockFilterTodayExecute).toHaveBeenCalled();
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('buildExportSummary delega payload', () => {
    mockExportSummaryExecute.mockReturnValueOnce({ totalAttendances: 1 });
    const service = createAttendanceService({});

    const result = service.buildExportSummary({
      asistenciasByDate: {},
      dateToExport: null,
      selectedDate: '2026-05-17',
      todayAttendance: [],
    });

    expect(mockExportSummaryExecute).toHaveBeenCalledWith({
      asistenciasByDate: {},
      dateToExport: null,
      selectedDate: '2026-05-17',
      todayAttendance: [],
    });
    expect(result).toEqual({ totalAttendances: 1 });
  });

  it('getPaymentTypeDisplay delega payload', () => {
    mockPaymentTypeDisplayExecute.mockReturnValueOnce({ key: 'mensualidad', label: 'Mensualidad' });
    const service = createAttendanceService({});

    const result = service.getPaymentTypeDisplay({
      paymentTypes: [{ id: 1, nombre: 'mensualidad' }],
      metodoPagoId: 1,
    });

    expect(mockPaymentTypeDisplayExecute).toHaveBeenCalledWith({
      paymentTypes: [{ id: 1, nombre: 'mensualidad' }],
      metodoPagoId: 1,
    });
    expect(result).toEqual({ key: 'mensualidad', label: 'Mensualidad' });
  });

  it('getCompactDisplayName delega payload', () => {
    mockCompactDisplayNameExecute.mockReturnValueOnce('Ana Lopez');
    const service = createAttendanceService({});

    const result = service.getCompactDisplayName({
      athleteUser: { nombre: 'Ana', apellido: 'Lopez' },
      isHomonym: false,
    });

    expect(mockCompactDisplayNameExecute).toHaveBeenCalledWith({
      athleteUser: { nombre: 'Ana', apellido: 'Lopez' },
      isHomonym: false,
    });
    expect(result).toBe('Ana Lopez');
  });

  it('buildHomonymsByCompactName delega payload', () => {
    mockHomonymsByCompactNameExecute.mockReturnValueOnce({ 'ana|lopez': 2 });
    const service = createAttendanceService({});

    const result = service.buildHomonymsByCompactName({
      athletes: [{ users: { nombre: 'Ana', apellido: 'Lopez' } }],
    });

    expect(mockHomonymsByCompactNameExecute).toHaveBeenCalledWith({
      athletes: [{ users: { nombre: 'Ana', apellido: 'Lopez' } }],
    });
    expect(result).toEqual({ 'ana|lopez': 2 });
  });
});
