import { communicationsService } from '../../communications';
import WhatsAppService from '../../../services/whatsappService';
import WhatsAppBusinessService from '../../../services/whatsappBusinessService';
import PagoStatusService from '../../../services/pagoStatusService';
import { getEcuadorDate, getEcuadorISOString } from '../../../utils/dateUtils';
import { getLatestPaymentsList } from '../../../utils/paymentUtils';
import { createPaymentsUseCases } from '../application/useCases/createPaymentsUseCases';
import { SupabasePaymentsRepository } from '../infrastructure/repositories/supabasePaymentsRepository';

export const createPaymentsService = (repository = new SupabasePaymentsRepository()) => {
  const useCases = createPaymentsUseCases(repository, {
    communicationsService,
    WhatsAppService,
    createWhatsAppBusiness: () => new WhatsAppBusinessService(),
    PagoStatusService,
    getEcuadorDate,
    getEcuadorISOString,
    getLatestPaymentsList,
  });
  const listModuleData = async () => useCases.listModuleDataUseCase.execute();
  const createPayment = async ({ formData }) => useCases.createPaymentUseCase.execute({ formData });
  const updatePayment = async ({ paymentId, formData }) => useCases.updatePaymentUseCase.execute({ paymentId, formData });
  const deletePayment = async ({ paymentId }) => useCases.deletePaymentUseCase.execute({ paymentId });
  const markPaymentAsPaid = async ({ payment }) => useCases.markPaymentAsPaidUseCase.execute({ payment });
  const filterAndSortLatestPayments = ({ allPayments, filters }) =>
    useCases.filterAndSortLatestPaymentsUseCase.execute({ allPayments, filters });
  const getTodayDate = () => useCases.getTodayDateUseCase.execute();
  const validatePaymentForm = ({ formData, todayDateString }) =>
    useCases.validatePaymentFormUseCase.execute({ formData, todayDateString });
  const filterAthletesBySearch = ({ athletes, searchTerm }) =>
    useCases.filterAthletesBySearchUseCase.execute({ athletes, searchTerm });
  const paginatePayments = ({ payments, page, pageSize }) =>
    useCases.paginatePaymentsUseCase.execute({ payments, page, pageSize });
  const formatDateSafe = ({ dateStr }) =>
    useCases.formatDateSafeUseCase.execute({ dateStr });
  const formatPeriodo = ({ fechaInicio, fechaFin }) =>
    useCases.formatPeriodoUseCase.execute({ fechaInicio, fechaFin });
  const formatMonto = ({ monto }) =>
    useCases.formatMontoUseCase.execute({ monto });
  const buildInitialPaymentForm = () => useCases.buildInitialPaymentFormUseCase.execute();
  const calculatePaymentsStats = ({ allPayments }) => useCases.calculatePaymentsStatsUseCase.execute({ allPayments });
  const getPaymentStatusInfo = (payment) => useCases.getPaymentStatusInfoUseCase.execute({ payment });
  const syncPaymentStatuses = async () => useCases.syncPaymentStatusesUseCase.execute();
  const buildManualWhatsAppPaymentMessage = ({ createdPayment, formData, athlete }) =>
    useCases.buildManualWhatsAppPaymentMessageUseCase.execute({ createdPayment, formData, athlete });
  const sendManualWhatsAppPaymentMessage = ({ formattedPhone, message }) =>
    useCases.sendManualWhatsAppPaymentMessageUseCase.execute({ formattedPhone, message });

  return {
    listModuleData,
    createPayment,
    updatePayment,
    deletePayment,
    markPaymentAsPaid,
    filterAndSortLatestPayments,
    getTodayDate,
    validatePaymentForm,
    filterAthletesBySearch,
    paginatePayments,
    formatDateSafe,
    formatPeriodo,
    formatMonto,
    buildInitialPaymentForm,
    calculatePaymentsStats,
    getPaymentStatusInfo,
    syncPaymentStatuses,
    buildManualWhatsAppPaymentMessage,
    sendManualWhatsAppPaymentMessage,
  };
};
