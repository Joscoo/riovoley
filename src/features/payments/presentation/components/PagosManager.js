// src/features/payments/presentation/components/PagosManager.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { paymentsService } from '../../paymentsService';
import { SortableHeader, SectionHeader, Card, EmptyState, Button, Field, Modal } from '../../../../shared/ui';
import {
  SORT_DIRECTION,
  createTableQuery,
  withUpdatedFilter,
  withUpdatedPage,
  withUpdatedSort,
  resetTableQuery,
} from '../../../../shared/lib/tableQuery';
import { 
  FaChartBar, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaExclamationTriangle, 
  FaDollarSign, 
  FaEdit, 
  FaPlus, 
  FaMoneyBillWave, 
  FaSync, 
  FaTrash, 
  FaUsers,
  FaCreditCard
} from 'react-icons/fa';

const styles = {
  pagosManager: 'mx-auto w-full max-w-7xl space-y-4',
  header: 'flex flex-wrap items-start justify-between gap-3',
  headerLeft: '',
  headerButtons: 'flex flex-wrap items-center gap-2',
  updateButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-rv-gold/40 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-rv-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  addButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-4 py-2 text-sm font-black uppercase tracking-wide text-rv-dark shadow-rv-gold transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  statsGrid: 'grid gap-3 mobile:grid-cols-2 desktop:grid-cols-5',
  statCard: 'rounded-2xl border border-rv-gold/25 bg-black/35 p-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-rv-gold/50',
  statIcon: 'mb-2 inline-flex text-2xl text-rv-gold',
  statInfo: '',
  filtersSection: 'grid gap-3 rounded-2xl border border-white/15 bg-black/30 p-4 mobile:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-7',
  filterGroup: 'space-y-1',
  filterLabel: 'text-[11px] font-bold uppercase tracking-wide text-rv-gold/90',
  searchInput: 'w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 disabled:cursor-not-allowed disabled:opacity-50',
  filterInput: 'w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 disabled:cursor-not-allowed disabled:opacity-50',
  filterSelect: 'w-full rounded-lg border border-rv-gold/25 bg-slate-900/60 px-3 py-2 text-sm text-white transition-colors appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 disabled:cursor-not-allowed disabled:opacity-50',
  clearFiltersButton: 'min-h-[48px] w-full rounded-xl border border-rv-gold/40 bg-slate-900/50 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rv-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  filterSummary: 'text-sm text-slate-200',
  loading: 'flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-white',
  spinner: 'h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-rv-gold',
  pagosTable: 'rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md',
  pagination: 'flex flex-wrap items-center justify-center gap-2 p-3',
  pageButton: 'min-h-[48px] rounded-xl bg-rv-gold px-4 py-2 text-sm font-bold text-rv-dark transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45',
  pageInfo: 'rounded-full border border-rv-gold/30 bg-black/40 px-3 py-1 text-sm font-semibold text-white',
  tableContainer: 'overflow-x-auto',
  table: 'w-full min-w-[900px] border-collapse [&_thead_th]:border-b [&_thead_th]:border-white/20 [&_thead_th]:bg-white/10 [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:text-left [&_thead_th]:text-xs [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_th]:text-white [&_tbody_td]:border-b [&_tbody_td]:border-white/10 [&_tbody_td]:px-4 [&_tbody_td]:py-3 [&_tbody_td]:align-middle [&_tbody_td]:text-sm [&_tbody_td]:text-white',
  tableRow: 'transition hover:bg-white/5',
  atletaInfo: 'flex flex-col gap-0.5',
  monto: 'text-base font-black text-emerald-300',
  estadoBadge: 'inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white',
  actions: 'flex items-center gap-1',
  paidButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/35',
  editButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/20 text-amber-200 transition hover:bg-amber-500/35',
  deleteButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-red-400/30 bg-red-500/20 text-red-200 transition hover:bg-red-500/35',
  noPagos: 'rounded-2xl border border-white/15 bg-black/25 p-8 text-center text-slate-200',
  modalOverlay: 'fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm',
  modal: 'max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-rv-gold/25 bg-slate-950/95 p-4 text-white shadow-2xl mobile:p-6',
  modalHeader: 'mb-4 flex items-start justify-between gap-3 border-b border-white/15 pb-3',
  closeButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  form: 'space-y-4',
  formErrorSummary: 'rounded-xl border border-red-400/35 bg-red-500/15 px-3 py-2 text-sm text-red-100',
  statusPreview: 'flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2',
  statusPreviewLabel: 'text-sm font-semibold text-slate-200',
  statusPreviewBadge: 'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white',
  formSection: 'rounded-2xl border border-white/15 bg-black/25 p-4',
  sectionTitle: 'mb-3 text-base font-black text-white',
  formGrid: 'grid gap-3 tablet:grid-cols-2',
  inputGroup: 'space-y-1 [&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-slate-400 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-rv-gold/25 [&_input]:bg-slate-900/60 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-slate-500 [&_input]:transition-colors [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-rv-gold/80 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-rv-gold/25 [&_textarea]:bg-slate-900/60 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:text-white [&_textarea]:placeholder:text-slate-500 [&_textarea]:transition-colors [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-rv-gold/80 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-rv-gold/25 [&_select]:bg-slate-900/60 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-white [&_select]:transition-colors [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-rv-gold/80',
  inputGroupFullWidth: 'space-y-1 tablet:col-span-2 [&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-slate-400 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-rv-gold/25 [&_input]:bg-slate-900/60 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-slate-500 [&_input]:transition-colors [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-rv-gold/80 [&_textarea]:w-full [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-rv-gold/25 [&_textarea]:bg-slate-900/60 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:text-white [&_textarea]:placeholder:text-slate-500 [&_textarea]:transition-colors [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-rv-gold/80 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-rv-gold/25 [&_select]:bg-slate-900/60 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:text-white [&_select]:transition-colors [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-rv-gold/80',
  autosuggestContainer: 'relative',
  fieldError: 'text-xs font-semibold text-red-300',
  fieldHint: 'text-xs text-slate-400',
  sugerenciasList: 'absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/20 bg-slate-950/95 shadow-2xl',
  sugerenciaItem: 'w-full border-b border-white/10 px-3 py-2 text-left transition last:border-0 hover:bg-rv-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  sugerenciaNombre: 'block text-sm font-semibold text-white',
  sugerenciaCategoria: 'block text-[11px] uppercase tracking-wide text-slate-300',
  noResultados: 'rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-300',
  formActions: 'flex flex-wrap justify-end gap-2 pt-2',
  cancelButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  saveButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-4 py-2 text-sm font-black text-rv-dark shadow-rv-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60'
};

const getPaymentStatusClass = (status) => {
  if (status === 'activo') return 'bg-emerald-600 text-white';
  if (status === 'proximo_a_vencer') return 'bg-amber-400 text-slate-900';
  if (status === 'vencido') return 'bg-red-600 text-white';
  return 'bg-slate-500 text-white';
};

const EMPTY_NOTICE = { type: '', text: '' };
const PAGE_SIZE = 10;

const DEFAULT_PAYMENTS_QUERY = createTableQuery({
  filters: {
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
    atleta: '',
    membership_type: '',
    search: '',
  },
  sort: {
    field: null,
    direction: SORT_DIRECTION.NONE,
  },
  pagination: {
    page: 1,
    pageSize: PAGE_SIZE,
  },
});

const PagosManager = ({ user }) => {
  const buildDefaultFormData = () => paymentsService.buildInitialPaymentForm();
  const firstPaymentFieldRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const confirmActionRef = useRef(null);
  const [pagos, setPagos] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [queryState, setQueryState] = useState(DEFAULT_PAYMENTS_QUERY);

  // Estados para búsqueda de atleta en formulario
  const [atletaBusqueda, setAtletaBusqueda] = useState('');
  const [atletasFiltrados, setAtletasFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [paymentPeriodPreview, setPaymentPeriodPreview] = useState(null);
  const [notice, setNotice] = useState(EMPTY_NOTICE);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    tone: 'primary',
  });

  const [formData, setFormData] = useState(() => buildDefaultFormData());

  const clearNoticeTimer = () => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  };

  const showNotice = (type, text) => {
    clearNoticeTimer();
    setNotice({ type, text });
    noticeTimerRef.current = globalThis.setTimeout(() => {
      setNotice((current) => (current.text === text ? EMPTY_NOTICE : current));
      noticeTimerRef.current = null;
    }, 5000);
  };

  const openConfirmDialog = ({ title, message, confirmLabel = 'Confirmar', tone = 'primary', onConfirm }) => {
    confirmActionRef.current = onConfirm;
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      tone,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    confirmActionRef.current = null;
  };

  const runConfirmDialogAction = async () => {
    const action = confirmActionRef.current;
    closeConfirmDialog();
    if (action) {
      await action();
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryState]);

  useEffect(() => () => clearNoticeTimer(), []);

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    globalThis.setTimeout(() => {
      firstPaymentFieldRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  const getTodayDateString = () => paymentsService.getTodayDate();

  const selectedMembershipType = useMemo(
    () => membershipTypes.find((item) => String(item.id) === String(formData.membership_type_id)) || null,
    [membershipTypes, formData.membership_type_id]
  );

  const paymentStatusPreview = useMemo(() => {
    const pagoTemporal = {
      monto: Number.parseFloat(selectedMembershipType?.costo || '0'),
      fecha_inicio: paymentPeriodPreview?.fecha_inicio || null,
      fecha_fin: paymentPeriodPreview?.fecha_fin || null,
      fecha_pago: formData.fecha_pago || null
    };

    return paymentsService.getPaymentStatusInfo(pagoTemporal);
  }, [selectedMembershipType, paymentPeriodPreview, formData.fecha_pago]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { athletes, payments, membershipTypes: loadedMembershipTypes, statusUpdateSummary } = await paymentsService.listModuleData({
        query: queryState,
      });
      setAtletas(athletes || []);
      setPagos(payments || []);
      setMembershipTypes(loadedMembershipTypes || []);

      if (statusUpdateSummary?.actualizados > 0) {
        console.log(`${statusUpdateSummary.actualizados} pagos actualizados automaticamente`);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      showNotice('error', 'Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadPeriodPreview = async () => {
      if (!showModal || !formData.student_id || !formData.fecha_pago) {
        setPaymentPeriodPreview(null);
        return;
      }

      try {
        const preview = await paymentsService.getPaymentPeriodPreview({
          studentId: formData.student_id,
          fechaPago: formData.fecha_pago,
        });

        if (!cancelled) {
          setPaymentPeriodPreview(preview || null);
        }
      } catch (error) {
        if (!cancelled) {
          setPaymentPeriodPreview(null);
        }
      }
    };

    loadPeriodPreview();

    return () => {
      cancelled = true;
    };
  }, [showModal, formData.student_id, formData.fecha_pago]);
  const pagination = useMemo(
    () =>
      paymentsService.paginatePayments({
        payments: pagos,
        page: queryState.pagination.page,
        pageSize: queryState.pagination.pageSize,
      }),
    [pagos, queryState.pagination.page, queryState.pagination.pageSize]
  );
  const totalPages = pagination.totalPages;
  const visiblePage = pagination.currentPage;
  const paginatedPagos = pagination.paginated;

  const resetFilters = () => {
    setQueryState(resetTableQuery({ defaults: DEFAULT_PAYMENTS_QUERY }));
  };

  const updateFilter = (key, value) => {
    setQueryState((current) => withUpdatedFilter({ query: current, key, value }));
  };

  const toggleSort = (field) => {
    setQueryState((current) => withUpdatedSort({ query: current, field }));
  };

  const goToPage = (page) => {
    setQueryState((current) => withUpdatedPage({ query: current, page }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const validation = paymentsService.validatePaymentForm({
      formData,
      todayDateString: getTodayDateString(),
    });
    setFormErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }
    
    try {
      if (editingPago) {
        await updatePago();
        showNotice('success', 'Pago actualizado exitosamente');
      } else {
        const result = await createPago();
        
        let mensaje = 'Pago registrado exitosamente.';
        
        if (result?.emailSent) {
          mensaje += '\nEmail de confirmacion enviado.';
        } else if (result?.emailError) {
          mensaje += `\nEmail no enviado: ${result.emailError}`;
        }
        
        if (result?.whatsappSent && result?.messageId) {
          mensaje += '\nWhatsApp Business enviado automáticamente.';
        } else if (result?.whatsappError) {
          mensaje += `\nWhatsApp Business error: ${result.whatsappError}`;
        } else if (result?.whatsappSent) {
          mensaje += '\nWhatsApp enviado.';
        }
        
        showNotice('success', mensaje);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error guardando pago:', error);
      const resolvedMessage = error?.message || 'No se pudo guardar el pago.';
      setSubmitError(`Error al guardar: ${resolvedMessage}`);
      showNotice('error', 'Error: ' + resolvedMessage);
    }
  };

  const createPago = async () => {
    const result = await paymentsService.createPayment({ formData });

    if (!result.whatsappSent) {
      const selectedAthlete = atletas.find((athlete) => String(athlete.id) === String(formData.student_id));
      const manualWhatsAppPayload = paymentsService.buildManualWhatsAppPaymentMessage({
        createdPayment: result.createdPayment,
        formData,
        athlete: selectedAthlete,
      });

      if (manualWhatsAppPayload?.canSend) {
        return { ...result, manualWhatsAppPayload };
      }
    }

    return result;
  };

  const updatePago = async () => {
    await paymentsService.updatePayment({
      paymentId: editingPago.id,
      formData,
    });
  };

  const deletePago = async (pago) => {
    openConfirmDialog({
      title: 'Eliminar pago',
      message:
        `ATENCION: Eliminar pago de ${pago.student?.user?.nombre} ${pago.student?.user?.apellido}?\n\n` +
        `Monto: $${pago.monto}\n` +
        `Periodo: ${formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}\n\n` +
        'Esta accion se puede revertir durante 30 dias.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await paymentsService.deletePayment({ paymentId: pago.id });
          await loadData();
          showNotice('success', 'Pago marcado como eliminado. Se puede recuperar durante 30 dias.');
        } catch (error) {
          console.error('Error eliminando pago:', error);
          showNotice('error', 'Error: ' + error.message);
        }
      },
    });
  };

  const marcarComoPagado = async (pago) => {
    try {
      await paymentsService.markPaymentAsPaid({ payment: pago });

      await loadData();
      showNotice('success', 'Fecha de pago registrada');
    } catch (error) {
      console.error('Error actualizando pago:', error);
      showNotice('error', 'Error: ' + error.message);
    }
  };

  const openModal = (pago = null) => {
    setFormErrors({});
    setSubmitError('');
    if (pago) {
      setEditingPago(pago);
      setFormData({
        student_id: pago.student_id.toString(),
        membership_type_id: pago.membership_type_id?.toString() || '',
        fecha_pago: pago.fecha_pago || '',
        observaciones: ''
      });
      setPaymentPeriodPreview({
        fecha_inicio: pago.fecha_inicio || null,
        fecha_fin: pago.fecha_fin || null,
      });

      // Establecer el atleta en el campo de búsqueda
      const atleta = atletas.find(a => a.id === pago.student_id);
      if (atleta) {
        const nombreCompleto = `${atleta.users?.nombre || ''} ${atleta.users?.apellido || ''}`;
        setAtletaBusqueda(nombreCompleto);
      }
    } else {
      setEditingPago(null);
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormErrors({});
    setSubmitError('');
  };

  const resetForm = () => {
    setFormData(buildDefaultFormData());
    setPaymentPeriodPreview(null);
    setAtletaBusqueda('');
    setAtletasFiltrados([]);
    setMostrarSugerencias(false);
    setFormErrors({});
    setSubmitError('');
  };

  // Función para manejar la búsqueda de atletas
  const handleAtletaBusqueda = (valorBusqueda) => {
    setAtletaBusqueda(valorBusqueda);
    setFormErrors((previousErrors) => ({ ...previousErrors, student_id: undefined }));
    
    if (valorBusqueda.trim() === '') {
      setAtletasFiltrados([]);
      setMostrarSugerencias(false);
      setFormData((current) => ({ ...current, student_id: '' }));
      setPaymentPeriodPreview(null);
      return;
    }

    // Filtrar atletas por nombre o apellido
    const filtrados = paymentsService.filterAthletesBySearch({
      athletes: atletas,
      searchTerm: valorBusqueda,
    });

    setAtletasFiltrados(filtrados);
    setMostrarSugerencias(true);
  };

  // Función para seleccionar un atleta de las sugerencias
  const seleccionarAtleta = (atleta) => {
    const nombreCompleto = `${atleta.users?.nombre || ''} ${atleta.users?.apellido || ''}`;
    setAtletaBusqueda(nombreCompleto);
    setFormData((current) => ({ ...current, student_id: atleta.id.toString() }));
    setMostrarSugerencias(false);
    setAtletasFiltrados([]);
    setFormErrors((previousErrors) => ({ ...previousErrors, student_id: undefined }));
  };

  // Función helper para formatear fechas sin problemas de zona horaria
  const formatDateSafe = (dateStr) => paymentsService.formatDateSafe({ dateStr });
  const formatPeriodo = (fechaInicio, fechaFin) =>
    paymentsService.formatPeriodo({ fechaInicio, fechaFin });
  const formatMonto = (monto) => paymentsService.formatMonto({ monto });

  const stats = useMemo(
    () => paymentsService.calculatePaymentsStats({ allPayments: pagos }),
    [pagos]
  );

  const actualizarEstadosManualmente = async () => {
    try {
      console.log('?? Actualizando estados manualmente...');
      const resultados = await paymentsService.syncPaymentStatuses();
      
      if (resultados.actualizados > 0) {
        showNotice('success', `${resultados.actualizados} pagos actualizados.\nEstados sincronizados correctamente.`);
        await loadData(); // Recargar datos
      } else {
        showNotice('success', 'Todos los estados ya estan actualizados.');
      }
    } catch (error) {
      console.error('Error actualizando estados:', error);
      showNotice('error', 'Error al actualizar estados: ' + error.message);
    }
  };

  return (
    <div className={styles.pagosManager}>
      <SectionHeader
        title="Gestión de Pagos"
        subtitle="Administrar mensualidades y pagos del club"
        icon={<FaMoneyBillWave />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="secondary"
              onClick={actualizarEstadosManualmente}
              title="Actualizar estados automáticamente"
              className="w-full mobile:w-auto"
            >
              <FaSync className="mr-2" /> Actualizar Estados
            </Button>
            <Button 
              onClick={() => openModal()}
              className="w-full mobile:w-auto"
            >
              <FaPlus className="mr-2" /> Registrar Pago
            </Button>
          </div>
        }
      />

      {notice.text ? (
        <div
          className={
            notice.type === 'success'
              ? 'rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200'
              : 'rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200'
          }
        >
          <p className="whitespace-pre-line">{notice.text}</p>
        </div>
      ) : null}

      {/* Estadísticas */}
      <div className="grid gap-4 mobile:grid-cols-2 desktop:grid-cols-5">
        <Card className="border-l-4 border-l-[#355FB3]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Total Pagos</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.totalPagos}</p>
            </div>
            <div className="text-3xl text-sky-300"><FaChartBar /></div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Activos</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.activos}</p>
            </div>
            <div className="text-3xl text-emerald-400"><FaCheckCircle /></div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">{'Pr\u00f3ximos a Vencer'}</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.proximosVencer}</p>
            </div>
            <div className="text-3xl text-amber-400"><FaHourglassHalf /></div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Vencidos</h3>
              <p className="mt-1 text-3xl font-black text-white">{stats.vencidos}</p>
            </div>
            <div className="text-3xl text-red-400"><FaExclamationTriangle /></div>
          </div>
        </Card>
        <Card className="border-l-4 border-l-rv-gold">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-[0.8px] text-slate-300">Total Recaudado</h3>
              <p className="mt-1 text-3xl font-black text-white">{formatMonto(stats.totalRecaudado)}</p>
            </div>
            <div className="text-3xl text-rv-gold"><FaDollarSign /></div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <div className="grid gap-4 mobile:grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-7">
          <Field label="Búsqueda">
            <input
              id="payments-search"
              type="text"
              placeholder="Buscar por atleta, email o mensualidad..."
              value={queryState.filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className={styles.searchInput}
              aria-label="Buscar pagos por atleta"
            />
          </Field>
          
          <Field label="Desde">
            <input
              id="payments-start-date"
              type="date"
              placeholder="Fecha inicio"
              value={queryState.filters.fecha_inicio}
              onChange={(e) => updateFilter('fecha_inicio', e.target.value)}
              className={`${styles.filterInput} rv-dark-date-input`}
            />
          </Field>
          
          <Field label="Hasta">
            <input
              id="payments-end-date"
              type="date"
              placeholder="Fecha fin"
              value={queryState.filters.fecha_fin}
              onChange={(e) => updateFilter('fecha_fin', e.target.value)}
              className={`${styles.filterInput} rv-dark-date-input`}
            />
          </Field>

          <Field label="Estado">
            <select
              id="payments-status-filter"
              value={queryState.filters.estado}
              onChange={(e) => updateFilter('estado', e.target.value)}
              className={styles.filterSelect}
              aria-label="Filtrar por estado de pago"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="proximo_a_vencer">Próximo a Vencer</option>
              <option value="vencido">Vencido</option>
            </select>
          </Field>

          <Field label="Atleta">
            <select
              id="payments-athlete-filter"
              value={queryState.filters.atleta}
              onChange={(e) => updateFilter('atleta', e.target.value)}
              className={styles.filterSelect}
              aria-label="Filtrar por atleta"
            >
              <option value="">Todos los atletas</option>
              {atletas.map(atleta => (
                <option key={atleta.id} value={atleta.id}>
                  {atleta.users?.nombre} {atleta.users?.apellido}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Mensualidad">
            <select
              id="payments-membership-filter"
              value={queryState.filters.membership_type}
              onChange={(e) => updateFilter('membership_type', e.target.value)}
              className={styles.filterSelect}
              aria-label="Filtrar por tipo de mensualidad"
            >
              <option value="">Todas</option>
              {membershipTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex flex-col justify-end">
            <Button variant="secondary" onClick={resetFilters} className="w-full h-[40px]">
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      <p className={styles.filterSummary}>Mostrando {paginatedPagos.length} de {pagos.length} pagos.</p>

      {/* Lista de Pagos */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando pagos...</p>
        </div>
      ) : (
        <div className={styles.pagosTable}>
          {pagos.length > 0 ? (
            <>
              <div className={styles.pagination}>
                <button
                  onClick={() => goToPage(Math.max(1, visiblePage - 1))}
                  disabled={visiblePage === 1}
                  className={styles.pageButton}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>{'P\u00e1gina'} {visiblePage} de {totalPages}</span>

                <button
                  onClick={() => goToPage(Math.min(totalPages, visiblePage + 1))}
                  disabled={visiblePage === totalPages}
                  className={styles.pageButton}
                >
                  Siguiente
                </button>
              </div>

              <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <SortableHeader field="atleta" label="Atleta" sort={queryState.sort} onToggleSort={toggleSort} />
                    <SortableHeader field="membership_type" label="Mensualidad" sort={queryState.sort} onToggleSort={toggleSort} />
                    <SortableHeader field="periodo" label={'Per\u00edodo'} sort={queryState.sort} onToggleSort={toggleSort} />
                    <SortableHeader field="monto" label="Monto" sort={queryState.sort} onToggleSort={toggleSort} />
                    <SortableHeader field="estado" label="Estado" sort={queryState.sort} onToggleSort={toggleSort} />
                    <SortableHeader field="fecha_pago" label="Fecha Pago" sort={queryState.sort} onToggleSort={toggleSort} />
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPagos.map((pago) => {
                    const statusInfo = paymentsService.getPaymentStatusInfo(pago);
                    return (
                    <tr key={pago.id} className={styles.tableRow}>
                      <td data-label="Atleta">
                        <div className={styles.atletaInfo}>
                          <strong>{pago.student?.user?.nombre} {pago.student?.user?.apellido}</strong>
                          <small>{pago.student?.categoria?.replaceAll('_', ' ').toUpperCase()}</small>
                        </div>
                      </td>
                      <td data-label="Mensualidad">{pago.membership_type?.nombre || '--'}</td>
                      <td data-label="Período">{formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}</td>
                      <td className={styles.monto} data-label="Monto">{formatMonto(pago.monto)}</td>
                      <td data-label="Estado">
                        <span
                          className={`${styles.estadoBadge} ${getPaymentStatusClass(statusInfo.estado)}`}
                        >
                          {statusInfo.mensaje}
                        </span>
                      </td>
                      <td data-label="Fecha Pago">
                        {pago.fecha_pago ? 
                          formatDateSafe(pago.fecha_pago) : 
                          '--'
                        }
                      </td>
                      <td data-label="Acciones">
                        <div className={styles.actions}>
                          {!pago.fecha_pago && (
                            <button
                              onClick={() => marcarComoPagado(pago)}
                              className={styles.paidButton}
                              title="Registrar fecha de pago"
                            >
                              <FaDollarSign />
                            </button>
                          )}
                          <button
                            onClick={() => openModal(pago)}
                            className={styles.editButton}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deletePago(pago)}
                            className={styles.deleteButton}
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              <div className={styles.pagination}>
                <button
                  onClick={() => goToPage(Math.max(1, visiblePage - 1))}
                  disabled={visiblePage === 1}
                  className={styles.pageButton}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>{'P\u00e1gina'} {visiblePage} de {totalPages}</span>

                <button
                  onClick={() => goToPage(Math.min(totalPages, visiblePage + 1))}
                  disabled={visiblePage === totalPages}
                  className={styles.pageButton}
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={FaCreditCard}
              title="No hay pagos registrados"
              description="Registra el primer pago del club"
              action={
                <Button onClick={() => openModal()}>
                  Registrar Pago
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Modal para Agregar/Editar */}
      {showModal && (
        <Modal
          title={editingPago ? "Editar Pago" : "Registrar Nuevo Pago"}
          icon={editingPago ? <FaEdit /> : <FaPlus />}
          onClose={closeModal}
        >
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {Object.values(formErrors).filter(Boolean).length > 0 && (
                <div className={styles.formErrorSummary} role="alert">
                  {Object.values(formErrors).filter(Boolean)[0]}
                </div>
              )}
              {submitError ? (
                <div className={styles.formErrorSummary} role="alert">
                  {submitError}
                </div>
              ) : null}

              <div className={styles.statusPreview}>
                <span className={styles.statusPreviewLabel}>Estado estimado:</span>
                <span
                  className={`${styles.statusPreviewBadge} ${getPaymentStatusClass(paymentStatusPreview.estado)}`}
                >
                  {paymentStatusPreview.mensaje}
                </span>
              </div>

<div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaUsers className="mr-2 inline align-middle" />Atleta y Periodo</h4>
                <div className={styles.formGrid}>
<div className={styles.inputGroup}>
                    <label htmlFor="student_id" className="block text-sm font-semibold text-white">Atleta *</label>
                    <div className={styles.autosuggestContainer}>
                      <input
                        ref={firstPaymentFieldRef}
                        id="student_id"
                        type="text"
                        value={atletaBusqueda}
                        onChange={(e) => handleAtletaBusqueda(e.target.value)}
                        onFocus={() => {
                          if (atletaBusqueda && atletasFiltrados.length > 0) {
                            setMostrarSugerencias(true);
                          }
                        }}
                        placeholder="Escribe el nombre del atleta..."
                        required
                        autoComplete="off"
                        className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                        aria-invalid={Boolean(formErrors.student_id)}
                        aria-describedby={formErrors.student_id ? 'payment-student-error' : undefined}
                      />
                      {formErrors.student_id && (
                        <p id="payment-student-error" className={styles.fieldError}>{formErrors.student_id}</p>
                      )}
                      {mostrarSugerencias && atletasFiltrados.length > 0 && (
                        <ul className={styles.sugerenciasList}>
                          {atletasFiltrados.map(atleta => (
                            <li
                              key={atleta.id}
                              onClick={() => seleccionarAtleta(atleta)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  seleccionarAtleta(atleta);
                                }
                              }}
                              className={styles.sugerenciaItem}
                              role="button"
                              tabIndex={0}
                            >
                              <span className={styles.sugerenciaNombre}>
                                {atleta.users?.nombre} {atleta.users?.apellido}
                              </span>
                              <span className={styles.sugerenciaCategoria}>
                                {atleta.categoria?.replaceAll('_', ' ').toUpperCase()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {mostrarSugerencias && atletaBusqueda && atletasFiltrados.length === 0 && (
                        <div className={styles.noResultados}>
                          No se encontraron atletas
                        </div>
                      )}
                    </div>
                  </div>

<div className={styles.inputGroup}>
                    <label htmlFor="fecha_pago" className="block text-sm font-semibold text-white">Fecha de Pago *</label>
                    <input
                      id="fecha_pago"
                      type="date"
                      value={formData.fecha_pago}
                      onChange={(e) => {
                        setFormData((current) => ({ ...current, fecha_pago: e.target.value }));
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_pago: undefined }));
                      }}
                      required
                      max={getTodayDateString()}
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70 rv-dark-date-input"
                      aria-invalid={Boolean(formErrors.fecha_pago)}
                      aria-describedby={formErrors.fecha_pago ? 'payment-date-error' : 'payment-date-hint'}
                    />
                    <p id="payment-date-hint" className={styles.fieldHint}>Obligatoria. Solo fechas hasta hoy.</p>
                    {formErrors.fecha_pago && <p id="payment-date-error" className={styles.fieldError}>{formErrors.fecha_pago}</p>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label className="block text-sm font-semibold text-white">Periodo sugerido</label>
                    <div className="min-h-[48px] rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white">
                      {paymentPeriodPreview?.fecha_inicio && paymentPeriodPreview?.fecha_fin
                        ? formatPeriodo(paymentPeriodPreview.fecha_inicio, paymentPeriodPreview.fecha_fin)
                        : '--'}
                    </div>
                    <p className={styles.fieldHint}>Se calcula automaticamente segun el historial del atleta.</p>
                  </div>
                </div>
              </div>

<div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaDollarSign className="mr-2 inline align-middle" />Datos del Pago</h4>
                <div className={styles.formGrid}>
<div className={styles.inputGroup}>
                    <label htmlFor="membership_type_id" className="block text-sm font-semibold text-white">Tipo de Mensualidad *</label>
                    <select
                      id="membership_type_id"
                      value={formData.membership_type_id}
                      onChange={(e) => {
                        setFormData((current) => ({ ...current, membership_type_id: e.target.value }));
                        setFormErrors((previousErrors) => ({ ...previousErrors, membership_type_id: undefined }));
                      }}
                      required
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      aria-invalid={Boolean(formErrors.membership_type_id)}
                      aria-describedby={formErrors.membership_type_id ? 'payment-membership-type-error' : 'payment-membership-type-hint'}
                    >
                      <option value="">Selecciona una mensualidad</option>
                      {membershipTypes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                    <p id="payment-membership-type-hint" className={styles.fieldHint}>Normal ($35.00) o en grupo ($32.50).</p>
                    {formErrors.membership_type_id && <p id="payment-membership-type-error" className={styles.fieldError}>{formErrors.membership_type_id}</p>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="monto" className="block text-sm font-semibold text-white">Monto (automatico)</label>
                    <input
                      id="monto"
                      type="text"
                      value={selectedMembershipType ? formatMonto(selectedMembershipType.costo) : '--'}
                      disabled
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white/90"
                    />
                    <p className={styles.fieldHint}>El monto se define por el tipo de mensualidad seleccionado.</p>
                  </div>

                  <div className={styles.inputGroupFullWidth}>
                    <label htmlFor="observaciones" className="block text-sm font-semibold text-white">Observaciones</label>
                    <textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => {
                        setFormData((current) => ({ ...current, observaciones: e.target.value }));
                        setFormErrors((previousErrors) => ({ ...previousErrors, observaciones: undefined }));
                      }}
                      maxLength={300}
                      placeholder="Notas internas del pago (opcional)"
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      aria-invalid={Boolean(formErrors.observaciones)}
                      aria-describedby={formErrors.observaciones ? 'payment-notes-error' : 'payment-notes-hint'}
                    />
                    <p id="payment-notes-hint" className={styles.fieldHint}>{formData.observaciones.length}/300 caracteres</p>
                    {formErrors.observaciones && <p id="payment-notes-error" className={styles.fieldError}>{formErrors.observaciones}</p>}
                  </div>
                </div>
              </div>
              

              
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button 
                  variant="secondary"
                  type="button"
                  onClick={closeModal}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                >
                  {editingPago ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
        </Modal>
      )}

      {confirmDialog.open && (
        <Modal
          title={confirmDialog.title}
          onClose={closeConfirmDialog}
          className="max-w-md"
        >
          <p className="whitespace-pre-line text-sm text-slate-200">{confirmDialog.message}</p>
          <div className="mt-6 flex flex-col-reverse gap-3 mobile:flex-row mobile:justify-end">
            <Button variant="secondary" onClick={closeConfirmDialog}>
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.tone === 'danger' ? 'danger' : 'primary'}
              onClick={runConfirmDialogAction}
            >
              {confirmDialog.confirmLabel}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

PagosManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string
  })
};

export default PagosManager;




















