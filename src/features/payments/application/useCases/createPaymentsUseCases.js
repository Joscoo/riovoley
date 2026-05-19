import { SORT_DIRECTION, createTableQuery } from '../../../../shared/lib/tableQuery';

export const createPaymentsUseCases = (
  repository,
  {
    communicationsService,
    WhatsAppService,
    createWhatsAppBusiness,
    PagoStatusService,
    getEcuadorDate,
    getEcuadorISOString,
    getLatestPaymentsList,
  }
) => {
  const DEFAULT_TABLE_QUERY = createTableQuery({
    filters: {
      fecha_inicio: '',
      fecha_fin: '',
      estado: '',
      atleta: '',
      search: '',
    },
    sort: {
      field: null,
      direction: SORT_DIRECTION.NONE,
    },
    pagination: {
      page: 1,
      pageSize: 10,
    },
  });

  const normalizeText = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const parseDateOnly = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const listModuleDataUseCase = {
    execute: async ({ query } = {}) => {
      const resolvedQuery = createTableQuery({
        ...DEFAULT_TABLE_QUERY,
        ...query,
        filters: {
          ...DEFAULT_TABLE_QUERY.filters,
          ...(query?.filters || {}),
        },
        sort: {
          ...DEFAULT_TABLE_QUERY.sort,
          ...(query?.sort || {}),
        },
        pagination: {
          ...DEFAULT_TABLE_QUERY.pagination,
          ...(query?.pagination || {}),
        },
      });

      const [athletes, payments] = await Promise.all([
        repository.listAthletes(),
        repository.listPayments({ query: resolvedQuery }),
      ]);

      const updatedStatuses = await PagoStatusService.actualizarTodosLosEstados();
      if (updatedStatuses?.actualizados > 0) {
        const refreshedPayments = await repository.listPayments({ query: resolvedQuery });
        return {
          athletes,
          payments: filterAndSortLatestPaymentsUseCase.execute({
            allPayments: refreshedPayments,
            query: resolvedQuery,
          }),
          statusUpdateSummary: updatedStatuses,
        };
      }

      return {
        athletes,
        payments: filterAndSortLatestPaymentsUseCase.execute({
          allPayments: payments,
          query: resolvedQuery,
        }),
        statusUpdateSummary: updatedStatuses,
      };
    },
  };

  const createPaymentUseCase = {
    execute: async ({ formData }) => {
      const paymentDraft = {
        student_id: formData.student_id,
        monto: Number.parseFloat(formData.monto),
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        fecha_pago: formData.fecha_pago || null,
      };

      const status = PagoStatusService.calcularEstado(paymentDraft);
      const createdPayment = await repository.createPayment({
        ...paymentDraft,
        estado: status,
      });

      let emailSent = false;
      let emailError = null;
      let whatsappSent = false;
      let whatsappError = null;
      let messageId = null;

      try {
        const athleteData = await repository.getAthleteByStudentId(formData.student_id);

        if (athleteData?.users?.email) {
          const emailResult = await communicationsService.sendPaymentConfirmation({
            email: athleteData.users.email,
            nombre: athleteData.users.nombre,
            apellido: athleteData.users.apellido,
            monto: Number.parseFloat(formData.monto),
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            fecha_pago: formData.fecha_pago,
            estado: createdPayment.estado,
          });

          emailSent = Boolean(emailResult?.success);
          emailError = emailResult?.success ? null : emailResult?.error || null;
        }

        if (athleteData?.users?.telefono && WhatsAppService.validarTelefono(athleteData.users.telefono)) {
          const whatsappBusiness = createWhatsAppBusiness();
          const businessConfig = whatsappBusiness.validateConfiguration();

          if (businessConfig.isValid) {
            const businessResult = await whatsappBusiness.sendPaymentConfirmation(
              {
                id: createdPayment.id,
                estudiante_nombre: `${athleteData.users.nombre} ${athleteData.users.apellido}`.trim(),
                monto: Number.parseFloat(formData.monto),
                fecha_pago: formData.fecha_pago,
                concepto: 'Mensualidad Club de Voley',
              },
              athleteData.users.telefono
            );

            whatsappSent = Boolean(businessResult?.success);
            whatsappError = businessResult?.success ? null : businessResult?.error || null;
            messageId = businessResult?.messageId || null;
          }
        }
      } catch (notificationError) {
        emailError = emailError || notificationError?.message || 'Error enviando notificaciones';
      }

      return {
        createdPayment,
        emailSent,
        emailError,
        whatsappSent,
        whatsappError,
        messageId,
      };
    },
  };

  const updatePaymentUseCase = {
    execute: async ({ paymentId, formData }) => {
      const paymentDraft = {
        student_id: formData.student_id,
        monto: Number.parseFloat(formData.monto),
        fecha_inicio: formData.fecha_inicio || null,
        fecha_fin: formData.fecha_fin || null,
        fecha_pago: formData.fecha_pago || null,
      };
      const status = PagoStatusService.calcularEstado(paymentDraft);
      await repository.updatePayment(paymentId, {
        ...paymentDraft,
        estado: status,
      });
    },
  };

  const deletePaymentUseCase = {
    execute: async ({ paymentId }) => {
      await repository.softDeletePayment(paymentId, getEcuadorISOString());
    },
  };

  const markPaymentAsPaidUseCase = {
    execute: async ({ payment }) => {
      const paidDate = getEcuadorDate();
      const status = PagoStatusService.calcularEstado({
        ...payment,
        fecha_pago: paidDate,
      });
      await repository.updatePayment(payment.id, {
        fecha_pago: paidDate,
        estado: status,
      });
    },
  };

  const filterAndSortLatestPaymentsUseCase = {
    execute: ({ allPayments, query, filters }) => {
      const legacyFilters = filters
        ? {
            ...DEFAULT_TABLE_QUERY.filters,
            ...filters,
          }
        : null;

      const resolvedQuery = query
        ? createTableQuery({
            ...DEFAULT_TABLE_QUERY,
            ...query,
            filters: {
              ...DEFAULT_TABLE_QUERY.filters,
              ...(query?.filters || {}),
            },
            sort: {
              ...DEFAULT_TABLE_QUERY.sort,
              ...(query?.sort || {}),
            },
            pagination: {
              ...DEFAULT_TABLE_QUERY.pagination,
              ...(query?.pagination || {}),
            },
          })
        : createTableQuery({
            ...DEFAULT_TABLE_QUERY,
            filters: legacyFilters || DEFAULT_TABLE_QUERY.filters,
            sort: legacyFilters
              ? {
                  field: legacyFilters.sortBy || 'apellido',
                  direction: legacyFilters.sortOrder || SORT_DIRECTION.ASC,
                }
              : DEFAULT_TABLE_QUERY.sort,
          });

      const activeFilters = resolvedQuery.filters;
      const activeSort = resolvedQuery.sort;

      const getSortableValue = (payment) => {
        switch (activeSort.field) {
          case 'atleta':
            return normalizeText(`${payment.student?.user?.apellido || ''} ${payment.student?.user?.nombre || ''}`.trim());
          case 'periodo': {
            const startTs = new Date(payment.fecha_inicio || '1900-01-01').getTime();
            const endTs = new Date(payment.fecha_fin || payment.fecha_inicio || '1900-01-01').getTime();
            return startTs + endTs;
          }
          case 'estado':
            return normalizeText(PagoStatusService.getStatusInfo(payment).estado || '');
          case 'monto':
            return Number(payment.monto || 0);
          case 'fecha_pago':
            return new Date(payment.fecha_pago || '1900-01-01').getTime();
          case 'fecha_inicio':
            return new Date(payment.fecha_inicio || '1900-01-01').getTime();
          case 'nombre':
            return normalizeText(payment.student?.user?.nombre || '');
          case 'apellido':
          default:
            return normalizeText(payment.student?.user?.apellido || '');
        }
      };

      let filteredData = getLatestPaymentsList(allPayments);

      if (activeFilters.fecha_inicio) {
        filteredData = filteredData.filter(
          (payment) => payment.fecha_inicio && payment.fecha_inicio >= activeFilters.fecha_inicio
        );
      }

      if (activeFilters.fecha_fin) {
        filteredData = filteredData.filter(
          (payment) => !payment.fecha_fin || payment.fecha_fin <= activeFilters.fecha_fin
        );
      }

      if (activeFilters.estado) {
        filteredData = filteredData.filter(
          (payment) => PagoStatusService.getStatusInfo(payment).estado === activeFilters.estado
        );
      }

      if (activeFilters.atleta) {
        filteredData = filteredData.filter((payment) => payment.student_id?.toString() === activeFilters.atleta);
      }

      if (activeFilters.search) {
        const searchLower = normalizeText(activeFilters.search);
        filteredData = filteredData.filter((payment) =>
          normalizeText(payment.student?.user?.nombre).includes(searchLower) ||
          normalizeText(payment.student?.user?.apellido).includes(searchLower) ||
          normalizeText(payment.student?.user?.email).includes(searchLower));
      }

      if (activeSort.field && activeSort.direction !== SORT_DIRECTION.NONE) {
        filteredData.sort((a, b) => {
          const valueA = getSortableValue(a);
          const valueB = getSortableValue(b);

          if (typeof valueA === 'number' && typeof valueB === 'number') {
            return activeSort.direction === SORT_DIRECTION.ASC ? valueA - valueB : valueB - valueA;
          }
          if (valueA < valueB) return activeSort.direction === SORT_DIRECTION.ASC ? -1 : 1;
          if (valueA > valueB) return activeSort.direction === SORT_DIRECTION.ASC ? 1 : -1;
          return 0;
        });
      }

      return filteredData;
    },
  };

  const getTodayDateUseCase = {
    execute: () => getEcuadorDate(),
  };

  const validatePaymentFormUseCase = {
    execute: ({ formData, todayDateString = getEcuadorDate() }) => {
      const errors = {};
      const monto = Number.parseFloat(formData?.monto);
      const startDate = parseDateOnly(formData?.fecha_inicio);
      const endDate = parseDateOnly(formData?.fecha_fin);
      const paidDate = parseDateOnly(formData?.fecha_pago);
      const todayDate = parseDateOnly(todayDateString);

      if (!formData?.student_id) {
        errors.student_id = 'Selecciona un atleta de la lista para continuar.';
      }

      if (!formData?.fecha_inicio || !startDate) {
        errors.fecha_inicio = 'La fecha de inicio es obligatoria.';
      }

      if (formData?.fecha_fin && !endDate) {
        errors.fecha_fin = 'La fecha fin no es válida.';
      }

      if (startDate && endDate && endDate < startDate) {
        errors.fecha_fin = 'La fecha fin no puede ser anterior a la fecha de inicio.';
      }

      if (!Number.isFinite(monto) || monto <= 0) {
        errors.monto = 'Ingresa un monto mayor a 0.';
      }

      if (formData?.fecha_pago && !paidDate) {
        errors.fecha_pago = 'La fecha de pago no es válida.';
      }

      if (paidDate && todayDate && paidDate > todayDate) {
        errors.fecha_pago = 'La fecha de pago no puede estar en el futuro.';
      }

      if (formData?.observaciones && formData.observaciones.length > 300) {
        errors.observaciones = 'Las observaciones no deben superar 300 caracteres.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
  };

  const filterAthletesBySearchUseCase = {
    execute: ({ athletes, searchTerm }) => {
      const term = normalizeText(searchTerm || '');
      if (!term) return [];

      return (athletes || []).filter((athlete) => {
        const fullName = `${athlete?.users?.nombre || ''} ${athlete?.users?.apellido || ''}`;
        return normalizeText(fullName).includes(term);
      });
    },
  };

  const paginatePaymentsUseCase = {
    execute: ({ payments, page, pageSize }) => {
      const safePageSize = pageSize > 0 ? pageSize : 1;
      const totalPages = Math.max(1, Math.ceil((payments || []).length / safePageSize));
      const currentPage = Math.min(Math.max(page || 1, 1), totalPages);
      const paginated = (payments || []).slice(
        (currentPage - 1) * safePageSize,
        (currentPage - 1) * safePageSize + safePageSize
      );

      return { totalPages, currentPage, paginated };
    },
  };

  const formatDateSafeUseCase = {
    execute: ({ dateStr }) => {
      if (!dateStr) return null;
      try {
        const [year, month, day] = dateStr.split('T')[0].split('-');
        const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        });
      } catch (_error) {
        return dateStr;
      }
    },
  };

  const formatPeriodoUseCase = {
    execute: ({ fechaInicio, fechaFin }) => {
      if (!fechaInicio) return '--';
      const inicio = formatDateSafeUseCase.execute({ dateStr: fechaInicio });
      if (!fechaFin) return `Desde: ${inicio}`;
      const fin = formatDateSafeUseCase.execute({ dateStr: fechaFin });
      return `${inicio} - ${fin}`;
    },
  };

  const formatMontoUseCase = {
    execute: ({ monto }) => {
      if (!monto) return '$0';
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(monto);
    },
  };

  const buildInitialPaymentFormUseCase = {
    execute: () => ({
      student_id: '',
      fecha_inicio: getEcuadorDate(),
      fecha_fin: '',
      monto: '',
      fecha_pago: '',
      observaciones: ''
    }),
  };

  const calculatePaymentsStatsUseCase = {
    execute: ({ allPayments }) => {
      const latestPayments = getLatestPaymentsList(allPayments);
      const paymentsWithStatus = latestPayments.map((payment) => ({
        ...payment,
        status: PagoStatusService.getStatusInfo(payment).estado,
      }));

      const totalPagos = paymentsWithStatus.length;
      const activos = paymentsWithStatus.filter((payment) => payment.status === 'activo').length;
      const proximosVencer = paymentsWithStatus.filter((payment) => payment.status === 'proximo_a_vencer').length;
      const vencidos = paymentsWithStatus.filter((payment) => payment.status === 'vencido').length;
      const totalRecaudado = paymentsWithStatus
        .filter((payment) => payment.status === 'activo')
        .reduce((sum, payment) => sum + (payment.monto || 0), 0);

      return { totalPagos, activos, proximosVencer, vencidos, totalRecaudado };
    },
  };

  const getPaymentStatusInfoUseCase = {
    execute: ({ payment }) => PagoStatusService.getStatusInfo(payment),
  };

  const syncPaymentStatusesUseCase = {
    execute: async () => PagoStatusService.actualizarTodosLosEstados(),
  };

  const buildManualWhatsAppPaymentMessageUseCase = {
    execute: ({ createdPayment, formData, athlete }) => {
      const phone = athlete?.users?.telefono;
      if (!phone || !WhatsAppService.validarTelefono(phone)) {
        return { canSend: false, formattedPhone: null, message: null };
      }

      const formattedPhone = WhatsAppService.formatearTelefono(phone);
      const message = WhatsAppService.crearMensajePago({
        id: createdPayment?.id,
        estudiante_nombre: `${athlete?.users?.nombre || ''} ${athlete?.users?.apellido || ''}`.trim(),
        monto: Number.parseFloat(formData?.monto),
        fecha_pago: formData?.fecha_pago,
        concepto: 'Mensualidad Club de Voley',
        observaciones: formData?.observaciones,
      });

      return { canSend: true, formattedPhone, message };
    },
  };

  const sendManualWhatsAppPaymentMessageUseCase = {
    execute: ({ formattedPhone, message }) => {
      if (!formattedPhone || !message) {
        return { sent: false };
      }
      WhatsAppService.sendMessage(formattedPhone, message);
      return { sent: true };
    },
  };

  return {
    listModuleDataUseCase,
    createPaymentUseCase,
    updatePaymentUseCase,
    deletePaymentUseCase,
    markPaymentAsPaidUseCase,
    filterAndSortLatestPaymentsUseCase,
    getTodayDateUseCase,
    buildInitialPaymentFormUseCase,
    calculatePaymentsStatsUseCase,
    getPaymentStatusInfoUseCase,
    syncPaymentStatusesUseCase,
    validatePaymentFormUseCase,
    filterAthletesBySearchUseCase,
    paginatePaymentsUseCase,
    formatDateSafeUseCase,
    formatPeriodoUseCase,
    formatMontoUseCase,
    buildManualWhatsAppPaymentMessageUseCase,
    sendManualWhatsAppPaymentMessageUseCase,
  };
};
