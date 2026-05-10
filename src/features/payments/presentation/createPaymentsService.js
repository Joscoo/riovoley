import { communicationsService } from '../../communications';
import WhatsAppService from '../../../services/whatsappService';
import WhatsAppBusinessService from '../../../services/whatsappBusinessService';
import PagoStatusService from '../../../services/pagoStatusService';
import { getEcuadorDate, getEcuadorISOString } from '../../../utils/dateUtils';
import { getLatestPaymentsList } from '../../../utils/paymentUtils';
import { SupabasePaymentsRepository } from '../infrastructure/repositories/supabasePaymentsRepository';

export const createPaymentsService = (repository = new SupabasePaymentsRepository()) => {
  const listModuleData = async () => {
    const [athletes, payments] = await Promise.all([
      repository.listAthletes(),
      repository.listPayments(),
    ]);

    const updatedStatuses = await PagoStatusService.actualizarTodosLosEstados();
    if (updatedStatuses?.actualizados > 0) {
      const refreshedPayments = await repository.listPayments();
      return { athletes, payments: refreshedPayments, statusUpdateSummary: updatedStatuses };
    }

    return { athletes, payments, statusUpdateSummary: updatedStatuses };
  };

  const createPayment = async ({ formData }) => {
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
        const whatsappBusiness = new WhatsAppBusinessService();
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
            athleteData.users.telefono,
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
  };

  const updatePayment = async ({ paymentId, formData }) => {
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
  };

  const deletePayment = async ({ paymentId }) => {
    await repository.softDeletePayment(paymentId, getEcuadorISOString());
  };

  const markPaymentAsPaid = async ({ payment }) => {
    const paidDate = getEcuadorDate();
    const status = PagoStatusService.calcularEstado({
      ...payment,
      fecha_pago: paidDate,
    });
    await repository.updatePayment(payment.id, {
      fecha_pago: paidDate,
      estado: status,
    });
  };

  const filterAndSortLatestPayments = ({ allPayments, filters }) => {
    const normalizeText = (value = '') => value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const getSortableValue = (payment) => {
      switch (filters.sortBy) {
        case 'nombre':
          return normalizeText(payment.student?.user?.nombre || '');
        case 'estado':
          return normalizeText(PagoStatusService.getStatusInfo(payment).estado || '');
        case 'monto':
          return Number(payment.monto || 0);
        case 'fecha_inicio':
          return new Date(payment.fecha_inicio || '1900-01-01').getTime();
        case 'apellido':
        default:
          return normalizeText(payment.student?.user?.apellido || '');
      }
    };

    let filteredData = getLatestPaymentsList(allPayments);

    if (filters.fecha_inicio) {
      filteredData = filteredData.filter((payment) => payment.fecha_inicio && payment.fecha_inicio >= filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      filteredData = filteredData.filter((payment) => !payment.fecha_fin || payment.fecha_fin <= filters.fecha_fin);
    }

    if (filters.estado) {
      filteredData = filteredData.filter((payment) => PagoStatusService.getStatusInfo(payment).estado === filters.estado);
    }

    if (filters.atleta) {
      filteredData = filteredData.filter((payment) => payment.student_id?.toString() === filters.atleta);
    }

    if (filters.search) {
      const searchLower = normalizeText(filters.search);
      filteredData = filteredData.filter((payment) =>
        normalizeText(payment.student?.user?.nombre).includes(searchLower) ||
        normalizeText(payment.student?.user?.apellido).includes(searchLower) ||
        normalizeText(payment.student?.user?.email).includes(searchLower));
    }

    filteredData.sort((a, b) => {
      const valueA = getSortableValue(a);
      const valueB = getSortableValue(b);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return filters.sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
      if (valueA < valueB) return filters.sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredData;
  };

  return {
    listModuleData,
    createPayment,
    updatePayment,
    deletePayment,
    markPaymentAsPaid,
    filterAndSortLatestPayments,
  };
};
