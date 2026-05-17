const { createPaymentsUseCases } = require('./createPaymentsUseCases');

describe('createPaymentsUseCases', () => {
  const buildRepository = () => ({
    listAthletes: jest.fn(),
    listPayments: jest.fn(),
    createPayment: jest.fn(),
    getAthleteByStudentId: jest.fn(),
    updatePayment: jest.fn(),
    softDeletePayment: jest.fn(),
  });

  const buildDeps = () => ({
    communicationsService: {
      sendPaymentConfirmation: jest.fn(),
    },
    WhatsAppService: {
      validarTelefono: jest.fn(() => true),
      formatearTelefono: jest.fn(() => '593999999999'),
      crearMensajePago: jest.fn(() => 'mensaje pago'),
      sendMessage: jest.fn(),
    },
    createWhatsAppBusiness: jest.fn(() => ({
      validateConfiguration: jest.fn(() => ({ isValid: true })),
      sendPaymentConfirmation: jest.fn(async () => ({ success: true, messageId: 'msg-1' })),
    })),
    PagoStatusService: {
      actualizarTodosLosEstados: jest.fn(async () => ({ actualizados: 0 })),
      calcularEstado: jest.fn(() => 'activo'),
      getStatusInfo: jest.fn(() => ({ estado: 'activo' })),
    },
    getEcuadorDate: jest.fn(() => '2026-05-17'),
    getEcuadorISOString: jest.fn(() => '2026-05-17T10:00:00'),
    getLatestPaymentsList: jest.fn((payments) => payments),
  });

  it('listModuleDataUseCase refresca pagos cuando hubo actualizaciones de estado', async () => {
    const repository = buildRepository();
    repository.listAthletes.mockResolvedValue([{ id: 's1' }]);
    repository.listPayments
      .mockResolvedValueOnce([{ id: 'p-old' }])
      .mockResolvedValueOnce([{ id: 'p-new' }]);
    const deps = buildDeps();
    deps.PagoStatusService.actualizarTodosLosEstados.mockResolvedValue({ actualizados: 2 });
    const useCases = createPaymentsUseCases(repository, deps);

    const result = await useCases.listModuleDataUseCase.execute();

    expect(repository.listPayments).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      athletes: [{ id: 's1' }],
      payments: [{ id: 'p-new' }],
      statusUpdateSummary: { actualizados: 2 },
    });
  });

  it('createPaymentUseCase crea pago y dispara notificaciones', async () => {
    const repository = buildRepository();
    repository.createPayment.mockResolvedValue({ id: 'p1', estado: 'activo' });
    repository.getAthleteByStudentId.mockResolvedValue({
      users: { email: 'ana@demo.com', nombre: 'Ana', apellido: 'Perez', telefono: '099' },
    });
    const deps = buildDeps();
    deps.communicationsService.sendPaymentConfirmation.mockResolvedValue({ success: true });
    const useCases = createPaymentsUseCases(repository, deps);

    const result = await useCases.createPaymentUseCase.execute({
      formData: {
        student_id: 's1',
        monto: '20',
        fecha_inicio: '2026-05-01',
        fecha_fin: '2026-05-31',
        fecha_pago: '2026-05-17',
      },
    });

    expect(repository.createPayment).toHaveBeenCalledWith({
      student_id: 's1',
      monto: 20,
      fecha_inicio: '2026-05-01',
      fecha_fin: '2026-05-31',
      fecha_pago: '2026-05-17',
      estado: 'activo',
    });
    expect(deps.communicationsService.sendPaymentConfirmation).toHaveBeenCalled();
    expect(result).toMatchObject({
      emailSent: true,
      whatsappSent: true,
      messageId: 'msg-1',
    });
  });

  it('deletePaymentUseCase usa timestamp Ecuador para soft delete', async () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    await useCases.deletePaymentUseCase.execute({ paymentId: 'p1' });

    expect(repository.softDeletePayment).toHaveBeenCalledWith('p1', '2026-05-17T10:00:00');
  });

  it('filterAndSortLatestPaymentsUseCase filtra por estado y busqueda', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    deps.PagoStatusService.getStatusInfo.mockImplementation((payment) => ({ estado: payment.estado }));
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.filterAndSortLatestPaymentsUseCase.execute({
      allPayments: [
        {
          id: 'p1',
          estado: 'activo',
          student_id: 's1',
          monto: 25,
          fecha_inicio: '2026-05-01',
          student: { user: { nombre: 'Ana', apellido: 'Perez', email: 'ana@demo.com' } },
        },
        {
          id: 'p2',
          estado: 'vencido',
          student_id: 's2',
          monto: 20,
          fecha_inicio: '2026-05-02',
          student: { user: { nombre: 'Lia', apellido: 'Torres', email: 'lia@demo.com' } },
        },
      ],
      filters: {
        fecha_inicio: '',
        fecha_fin: '',
        estado: 'activo',
        atleta: '',
        search: 'ana',
        sortBy: 'apellido',
        sortOrder: 'asc',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('getTodayDateUseCase retorna fecha desde dependencia', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    deps.getEcuadorDate.mockReturnValue('2026-06-01');
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.getTodayDateUseCase.execute();

    expect(result).toBe('2026-06-01');
  });

  it('buildInitialPaymentFormUseCase arma formulario por defecto', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    deps.getEcuadorDate.mockReturnValue('2026-06-01');
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.buildInitialPaymentFormUseCase.execute();

    expect(result).toEqual({
      student_id: '',
      fecha_inicio: '2026-06-01',
      fecha_fin: '',
      monto: '',
      fecha_pago: '',
      observaciones: '',
    });
  });

  it('calculatePaymentsStatsUseCase calcula contadores y recaudado', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    deps.getLatestPaymentsList.mockReturnValue([
      { id: 'p1', monto: 10, estado: 'activo' },
      { id: 'p2', monto: 20, estado: 'vencido' },
      { id: 'p3', monto: 15, estado: 'proximo_a_vencer' },
    ]);
    deps.PagoStatusService.getStatusInfo.mockImplementation((payment) => ({ estado: payment.estado }));
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.calculatePaymentsStatsUseCase.execute({ allPayments: [{ id: 'dummy' }] });

    expect(result).toEqual({
      totalPagos: 3,
      activos: 1,
      proximosVencer: 1,
      vencidos: 1,
      totalRecaudado: 10,
    });
  });

  it('getPaymentStatusInfoUseCase delega al servicio de estados', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    deps.PagoStatusService.getStatusInfo.mockReturnValue({ estado: 'vencido' });
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.getPaymentStatusInfoUseCase.execute({ payment: { id: 'p1' } });

    expect(deps.PagoStatusService.getStatusInfo).toHaveBeenCalledWith({ id: 'p1' });
    expect(result).toEqual({ estado: 'vencido' });
  });

  it('syncPaymentStatusesUseCase delega actualizacion masiva', async () => {
    const repository = buildRepository();
    const deps = buildDeps();
    deps.PagoStatusService.actualizarTodosLosEstados.mockResolvedValue({ actualizados: 4 });
    const useCases = createPaymentsUseCases(repository, deps);

    const result = await useCases.syncPaymentStatusesUseCase.execute();

    expect(deps.PagoStatusService.actualizarTodosLosEstados).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ actualizados: 4 });
  });

  it('buildManualWhatsAppPaymentMessageUseCase construye payload cuando el telefono es valido', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.buildManualWhatsAppPaymentMessageUseCase.execute({
      createdPayment: { id: 'p1' },
      formData: { monto: '30', fecha_pago: '2026-05-17', observaciones: 'ok' },
      athlete: { users: { telefono: '0999', nombre: 'Ana', apellido: 'Perez' } },
    });

    expect(deps.WhatsAppService.validarTelefono).toHaveBeenCalledWith('0999');
    expect(deps.WhatsAppService.formatearTelefono).toHaveBeenCalledWith('0999');
    expect(deps.WhatsAppService.crearMensajePago).toHaveBeenCalled();
    expect(result).toEqual({
      canSend: true,
      formattedPhone: '593999999999',
      message: 'mensaje pago',
    });
  });

  it('sendManualWhatsAppPaymentMessageUseCase envia mensaje', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.sendManualWhatsAppPaymentMessageUseCase.execute({
      formattedPhone: '593999999999',
      message: 'hola',
    });

    expect(deps.WhatsAppService.sendMessage).toHaveBeenCalledWith('593999999999', 'hola');
    expect(result).toEqual({ sent: true });
  });

  it('validatePaymentFormUseCase valida campos y fechas', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    const invalid = useCases.validatePaymentFormUseCase.execute({
      formData: { student_id: '', fecha_inicio: '', monto: '0' },
      todayDateString: '2026-05-17',
    });
    const valid = useCases.validatePaymentFormUseCase.execute({
      formData: {
        student_id: 's1',
        fecha_inicio: '2026-05-01',
        fecha_fin: '2026-05-31',
        monto: '20',
        fecha_pago: '2026-05-17',
        observaciones: '',
      },
      todayDateString: '2026-05-17',
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.student_id).toBeDefined();
    expect(valid).toEqual({ isValid: true, errors: {} });
  });

  it('filterAthletesBySearchUseCase filtra por nombre completo', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.filterAthletesBySearchUseCase.execute({
      athletes: [
        { id: 's1', users: { nombre: 'Ana', apellido: 'Perez' } },
        { id: 's2', users: { nombre: 'Lia', apellido: 'Torres' } },
      ],
      searchTerm: 'lia',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s2');
  });

  it('paginatePaymentsUseCase devuelve pagina segura', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    const result = useCases.paginatePaymentsUseCase.execute({
      payments: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      page: 3,
      pageSize: 2,
    });

    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(2);
    expect(result.paginated).toEqual([{ id: 'p3' }]);
  });

  it('use cases de formato de pagos devuelven strings esperados', () => {
    const repository = buildRepository();
    const deps = buildDeps();
    const useCases = createPaymentsUseCases(repository, deps);

    const formattedDate = useCases.formatDateSafeUseCase.execute({ dateStr: '2026-05-17' });
    const period = useCases.formatPeriodoUseCase.execute({
      fechaInicio: '2026-05-01',
      fechaFin: '2026-05-31',
    });
    const amount = useCases.formatMontoUseCase.execute({ monto: 20 });

    expect(formattedDate).toBeDefined();
    expect(period).toContain('-');
    expect(amount).toContain('$');
  });
});
