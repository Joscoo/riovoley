process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createPaymentsUseCases', () => ({
  __esModule: true,
  createPaymentsUseCases: jest.fn(),
}));

const { createPaymentsUseCases } = require('../application/useCases/createPaymentsUseCases');
const { createPaymentsService } = require('./createPaymentsService');

describe('createPaymentsService', () => {
  const mockListExecute = jest.fn();
  const mockCreateExecute = jest.fn();
  const mockUpdateExecute = jest.fn();
  const mockDeleteExecute = jest.fn();
  const mockMarkPaidExecute = jest.fn();
  const mockFilterExecute = jest.fn();
  const mockGetTodayExecute = jest.fn();
  const mockValidateFormExecute = jest.fn();
  const mockFilterAthletesExecute = jest.fn();
  const mockPaginateExecute = jest.fn();
  const mockFormatDateSafeExecute = jest.fn();
  const mockFormatPeriodoExecute = jest.fn();
  const mockFormatMontoExecute = jest.fn();
  const mockInitialFormExecute = jest.fn();
  const mockStatsExecute = jest.fn();
  const mockStatusInfoExecute = jest.fn();
  const mockSyncStatusesExecute = jest.fn();
  const mockBuildManualWhatsAppExecute = jest.fn();
  const mockSendManualWhatsAppExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createPaymentsUseCases.mockReturnValue({
      listModuleDataUseCase: { execute: mockListExecute },
      createPaymentUseCase: { execute: mockCreateExecute },
      updatePaymentUseCase: { execute: mockUpdateExecute },
      deletePaymentUseCase: { execute: mockDeleteExecute },
      markPaymentAsPaidUseCase: { execute: mockMarkPaidExecute },
      filterAndSortLatestPaymentsUseCase: { execute: mockFilterExecute },
      getTodayDateUseCase: { execute: mockGetTodayExecute },
      validatePaymentFormUseCase: { execute: mockValidateFormExecute },
      filterAthletesBySearchUseCase: { execute: mockFilterAthletesExecute },
      paginatePaymentsUseCase: { execute: mockPaginateExecute },
      formatDateSafeUseCase: { execute: mockFormatDateSafeExecute },
      formatPeriodoUseCase: { execute: mockFormatPeriodoExecute },
      formatMontoUseCase: { execute: mockFormatMontoExecute },
      buildInitialPaymentFormUseCase: { execute: mockInitialFormExecute },
      calculatePaymentsStatsUseCase: { execute: mockStatsExecute },
      getPaymentStatusInfoUseCase: { execute: mockStatusInfoExecute },
      syncPaymentStatusesUseCase: { execute: mockSyncStatusesExecute },
      buildManualWhatsAppPaymentMessageUseCase: { execute: mockBuildManualWhatsAppExecute },
      sendManualWhatsAppPaymentMessageUseCase: { execute: mockSendManualWhatsAppExecute },
    });
  });

  it('listModuleData delega al use case', async () => {
    mockListExecute.mockResolvedValueOnce({ athletes: [], payments: [] });
    const service = createPaymentsService({});

    const result = await service.listModuleData();

    expect(mockListExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ athletes: [], payments: [] });
  });

  it('createPayment delega formData al use case', async () => {
    mockCreateExecute.mockResolvedValueOnce({ createdPayment: { id: 'p1' } });
    const service = createPaymentsService({});
    const payload = { formData: { student_id: 's1', monto: '20' } };

    const result = await service.createPayment(payload);

    expect(mockCreateExecute).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ createdPayment: { id: 'p1' } });
  });

  it('filterAndSortLatestPayments delega allPayments y filters', () => {
    mockFilterExecute.mockReturnValueOnce([{ id: 'p1' }]);
    const service = createPaymentsService({});
    const args = { allPayments: [{ id: 'p1' }], filters: { estado: 'activo' } };

    const result = service.filterAndSortLatestPayments(args);

    expect(mockFilterExecute).toHaveBeenCalledWith(args);
    expect(result).toEqual([{ id: 'p1' }]);
  });

  it('getTodayDate delega al use case de fecha actual', () => {
    mockGetTodayExecute.mockReturnValueOnce('2026-05-17');
    const service = createPaymentsService({});

    const result = service.getTodayDate();

    expect(mockGetTodayExecute).toHaveBeenCalledTimes(1);
    expect(result).toBe('2026-05-17');
  });

  it('buildInitialPaymentForm delega al use case de formulario inicial', () => {
    mockInitialFormExecute.mockReturnValueOnce({ fecha_inicio: '2026-05-17' });
    const service = createPaymentsService({});

    const result = service.buildInitialPaymentForm();

    expect(mockInitialFormExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ fecha_inicio: '2026-05-17' });
  });

  it('validatePaymentForm delega al use case', () => {
    mockValidateFormExecute.mockReturnValueOnce({ isValid: true, errors: {} });
    const service = createPaymentsService({});

    const result = service.validatePaymentForm({
      formData: { student_id: 's1' },
      todayDateString: '2026-05-17',
    });

    expect(mockValidateFormExecute).toHaveBeenCalledWith({
      formData: { student_id: 's1' },
      todayDateString: '2026-05-17',
    });
    expect(result).toEqual({ isValid: true, errors: {} });
  });

  it('paginatePayments delega al use case', () => {
    mockPaginateExecute.mockReturnValueOnce({ totalPages: 1, currentPage: 1, paginated: [] });
    const service = createPaymentsService({});

    const result = service.paginatePayments({ payments: [], page: 1, pageSize: 10 });

    expect(mockPaginateExecute).toHaveBeenCalledWith({ payments: [], page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(1);
  });

  it('calculatePaymentsStats delega allPayments al use case de estadisticas', () => {
    mockStatsExecute.mockReturnValueOnce({ totalPagos: 2 });
    const service = createPaymentsService({});

    const result = service.calculatePaymentsStats({ allPayments: [{ id: 'p1' }] });

    expect(mockStatsExecute).toHaveBeenCalledWith({ allPayments: [{ id: 'p1' }] });
    expect(result).toEqual({ totalPagos: 2 });
  });

  it('getPaymentStatusInfo delega al use case de estado', () => {
    mockStatusInfoExecute.mockReturnValueOnce({ estado: 'activo' });
    const service = createPaymentsService({});

    const result = service.getPaymentStatusInfo({ id: 'p1' });

    expect(mockStatusInfoExecute).toHaveBeenCalledWith({ payment: { id: 'p1' } });
    expect(result).toEqual({ estado: 'activo' });
  });

  it('syncPaymentStatuses delega al use case de sincronizacion', async () => {
    mockSyncStatusesExecute.mockResolvedValueOnce({ actualizados: 1 });
    const service = createPaymentsService({});

    const result = await service.syncPaymentStatuses();

    expect(mockSyncStatusesExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ actualizados: 1 });
  });

  it('buildManualWhatsAppPaymentMessage delega al use case', () => {
    mockBuildManualWhatsAppExecute.mockReturnValueOnce({ canSend: true });
    const service = createPaymentsService({});

    const result = service.buildManualWhatsAppPaymentMessage({
      createdPayment: { id: 'p1' },
      formData: { monto: '20' },
      athlete: { id: 's1' },
    });

    expect(mockBuildManualWhatsAppExecute).toHaveBeenCalledWith({
      createdPayment: { id: 'p1' },
      formData: { monto: '20' },
      athlete: { id: 's1' },
    });
    expect(result).toEqual({ canSend: true });
  });

  it('sendManualWhatsAppPaymentMessage delega al use case', () => {
    mockSendManualWhatsAppExecute.mockReturnValueOnce({ sent: true });
    const service = createPaymentsService({});

    const result = service.sendManualWhatsAppPaymentMessage({
      formattedPhone: '593999999999',
      message: 'hola',
    });

    expect(mockSendManualWhatsAppExecute).toHaveBeenCalledWith({
      formattedPhone: '593999999999',
      message: 'hola',
    });
    expect(result).toEqual({ sent: true });
  });
});
