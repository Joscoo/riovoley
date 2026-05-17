// src/components/admin/PagosManager.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { paymentsService } from '../../features/payments';
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
  FaTimes, 
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
  searchInput: 'min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  filterInput: 'min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  filterSelect: 'min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
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
  inputGroup: 'space-y-1',
  inputGroupFullWidth: 'space-y-1 tablet:col-span-2',
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

const PagosManager = ({ user }) => {
  const buildDefaultFormData = () => paymentsService.buildInitialPaymentForm();
  const modalTitleId = 'payment-modal-title';
  const firstPaymentFieldRef = useRef(null);
  const [pagos, setPagos] = useState([]);
  const [allPagos, setAllPagos] = useState([]); // Almacenar todos los pagos sin filtrar
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPago, setEditingPago] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    estado: '',
    atleta: '',
    search: '',
    sortBy: 'apellido',
    sortOrder: 'asc'
  });

  // Estados para bÃƒÂºsqueda de atleta en formulario
  const [atletaBusqueda, setAtletaBusqueda] = useState('');
  const [atletasFiltrados, setAtletasFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState(() => buildDefaultFormData());

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplicar filtros localmente cuando cambien los filters
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, allPagos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, allPagos]);

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

  const paymentStatusPreview = useMemo(() => {
    const pagoTemporal = {
      monto: Number.parseFloat(formData.monto || '0'),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      fecha_pago: formData.fecha_pago || null
    };

    return paymentsService.getPaymentStatusInfo(pagoTemporal);
  }, [formData.monto, formData.fecha_inicio, formData.fecha_fin, formData.fecha_pago]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { athletes, payments, statusUpdateSummary } = await paymentsService.listModuleData();
      setAtletas(athletes || []);
      setAllPagos(payments || []);
      setPagos(payments || []);

      if (statusUpdateSummary?.actualizados > 0) {
        console.log(`✅ ${statusUpdateSummary.actualizados} pagos actualizados automáticamente`);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FunciÃƒÂ³n para aplicar filtros localmente
  const applyFilters = () => {
    const filteredData = paymentsService.filterAndSortLatestPayments({
      allPayments: allPagos,
      filters,
    });
    setPagos(filteredData);
  };

  const pagination = useMemo(
    () =>
      paymentsService.paginatePayments({
        payments: pagos,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
    [pagos, currentPage]
  );
  const totalPages = pagination.totalPages;
  const visiblePage = pagination.currentPage;
  const paginatedPagos = pagination.paginated;

  const resetFilters = () => {
    setFilters({
      fecha_inicio: '',
      fecha_fin: '',
      estado: '',
      atleta: '',
      search: '',
      sortBy: 'apellido',
      sortOrder: 'asc'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        alert('Pago actualizado exitosamente');
      } else {
        const result = await createPago();
        
        let mensaje = 'Pago registrado exitosamente.';
        
        if (result?.emailSent) {
          mensaje += '\nEmail de confirmación enviado.';
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
        
        alert(mensaje);
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error guardando pago:', error);
      alert('Error: ' + error.message);
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

      if (manualWhatsAppPayload?.canSend && globalThis.confirm('¿Desea enviar confirmación por WhatsApp al atleta?')) {
        const sendResult = paymentsService.sendManualWhatsAppPaymentMessage({
          formattedPhone: manualWhatsAppPayload.formattedPhone,
          message: manualWhatsAppPayload.message,
        });
        if (sendResult?.sent) {
          return { ...result, whatsappSent: true };
        }
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
    if (!globalThis.confirm(
      `⚠️ ATENCIÓN: ¿Eliminar pago de ${pago.student?.user?.nombre} ${pago.student?.user?.apellido}?\n\n` +
      `Monto: $${pago.monto}\n` +
      `Período: ${formatPeriodo(pago.fecha_inicio, pago.fecha_fin)}\n\n` +
      `Esta acción se puede revertir durante 30 días.`
    )) {
      return;
    }

    try {
      await paymentsService.deletePayment({ paymentId: pago.id });

      loadData();
      alert('✅ Pago marcado como eliminado.\nSe puede recuperar desde la base de datos durante 30 días.');
    } catch (error) {
      console.error('Error eliminando pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const marcarComoPagado = async (pago) => {
    try {
      await paymentsService.markPaymentAsPaid({ payment: pago });

      loadData();
      alert('Fecha de pago registrada');
    } catch (error) {
      console.error('Error actualizando pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const openModal = (pago = null) => {
    setFormErrors({});
    if (pago) {
      setEditingPago(pago);
      setFormData({
        student_id: pago.student_id.toString(),
        fecha_inicio: pago.fecha_inicio || '',
        fecha_fin: pago.fecha_fin || '',
        monto: pago.monto?.toString() || '',
        fecha_pago: pago.fecha_pago || '',
        observaciones: ''
      });
      
      // Establecer el atleta en el campo de bÃƒÂºsqueda
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
  };

  const resetForm = () => {
    setFormData(buildDefaultFormData());
    setAtletaBusqueda('');
    setAtletasFiltrados([]);
    setMostrarSugerencias(false);
    setFormErrors({});
  };

  // FunciÃƒÂ³n para manejar la bÃƒÂºsqueda de atletas
  const handleAtletaBusqueda = (valorBusqueda) => {
    setAtletaBusqueda(valorBusqueda);
    setFormErrors((previousErrors) => ({ ...previousErrors, student_id: undefined }));
    
    if (valorBusqueda.trim() === '') {
      setAtletasFiltrados([]);
      setMostrarSugerencias(false);
      setFormData({...formData, student_id: ''});
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

  // FunciÃƒÂ³n para seleccionar un atleta de las sugerencias
  const seleccionarAtleta = (atleta) => {
    const nombreCompleto = `${atleta.users?.nombre || ''} ${atleta.users?.apellido || ''}`;
    setAtletaBusqueda(nombreCompleto);
    setFormData({...formData, student_id: atleta.id.toString()});
    setMostrarSugerencias(false);
    setAtletasFiltrados([]);
    setFormErrors((previousErrors) => ({ ...previousErrors, student_id: undefined }));
  };

  // FunciÃƒÂ³n helper para formatear fechas sin problemas de zona horaria
  const formatDateSafe = (dateStr) => paymentsService.formatDateSafe({ dateStr });
  const formatPeriodo = (fechaInicio, fechaFin) =>
    paymentsService.formatPeriodo({ fechaInicio, fechaFin });
  const formatMonto = (monto) => paymentsService.formatMonto({ monto });

  const stats = useMemo(
    () => paymentsService.calculatePaymentsStats({ allPayments: allPagos }),
    [allPagos]
  );

  const actualizarEstadosManualmente = async () => {
    try {
      console.log('?? Actualizando estados manualmente...');
      const resultados = await paymentsService.syncPaymentStatuses();
      
      if (resultados.actualizados > 0) {
        alert(`${resultados.actualizados} pagos actualizados.\nEstados sincronizados correctamente.`);
        loadData(); // Recargar datos
      } else {
        alert('Todos los estados ya están actualizados.');
      }
    } catch (error) {
      console.error('Error actualizando estados:', error);
      alert('Error al actualizar estados: ' + error.message);
    }
  };

  return (
    <div className={styles.pagosManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaMoneyBillWave className="mr-2 inline align-middle" /> Gestión de Pagos</h2>
          <p>Administrar mensualidades y pagos del club</p>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.updateButton}
            onClick={actualizarEstadosManualmente}
            title="Actualizar estados automáticamente"
          >
            <FaSync className="mr-2 inline align-middle" /> Actualizar Estados
          </button>
          <button 
            className={styles.addButton}
            onClick={() => openModal()}
          >
            <FaPlus className="mr-2 inline align-middle" /> Registrar Pago
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartBar /></div>
          <div className={styles.statInfo}>
            <h3>{stats.totalPagos}</h3>
            <p>Total Pagos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCheckCircle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.activos}</h3>
            <p>Activos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaHourglassHalf /></div>
          <div className={styles.statInfo}>
            <h3>{stats.proximosVencer}</h3>
            <p>Próximos a Vencer</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaExclamationTriangle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.vencidos}</h3>
            <p>Vencidos</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaDollarSign /></div>
          <div className={styles.statInfo}>
            <h3>{formatMonto(stats.totalRecaudado)}</h3>
            <p>Total Recaudado</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="payments-search" className={styles.filterLabel}>Busqueda</label>
          <input
            id="payments-search"
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
            aria-label="Buscar pagos por atleta"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="payments-start-date" className={styles.filterLabel}>Desde</label>
          <input
            id="payments-start-date"
            type="date"
            placeholder="Fecha inicio"
            value={filters.fecha_inicio}
            onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
            className={styles.filterInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="payments-end-date" className={styles.filterLabel}>Hasta</label>
          <input
            id="payments-end-date"
            type="date"
            placeholder="Fecha fin"
            value={filters.fecha_fin}
            onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-status-filter" className={styles.filterLabel}>Estado</label>
          <select
            id="payments-status-filter"
            value={filters.estado}
            onChange={(e) => setFilters({...filters, estado: e.target.value})}
            className={styles.filterSelect}
            aria-label="Filtrar por estado de pago"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="proximo_a_vencer">Proximo a Vencer</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-athlete-filter" className={styles.filterLabel}>Atleta</label>
          <select
            id="payments-athlete-filter"
            value={filters.atleta}
            onChange={(e) => setFilters({...filters, atleta: e.target.value})}
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
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-sort-by" className={styles.filterLabel}>Ordenar por</label>
          <select
            id="payments-sort-by"
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className={styles.filterSelect}
            aria-label="Ordenar pagos por"
          >
            <option value="apellido">Apellido</option>
            <option value="nombre">Nombre</option>
            <option value="estado">Estado</option>
            <option value="monto">Monto</option>
            <option value="fecha_inicio">Fecha de inicio</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="payments-sort-order" className={styles.filterLabel}>Direccion</label>
          <select
            id="payments-sort-order"
            value={filters.sortOrder}
            onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
            className={styles.filterSelect}
            aria-label="Direccion de orden"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="payments-clear-filters">Acciones</label>
          <button id="payments-clear-filters" type="button" className={styles.clearFiltersButton} onClick={resetFilters}>
            Limpiar filtros
          </button>
        </div>
      </div>

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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={visiblePage === 1}
                  className={styles.pageButton}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>Página {visiblePage} de {totalPages}</span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
                    <th>Atleta</th>
                    <th>Período</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha Pago</th>
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={visiblePage === 1}
                  className={styles.pageButton}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>Página {visiblePage} de {totalPages}</span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={visiblePage === totalPages}
                  className={styles.pageButton}
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noPagos}>
              <h3><FaCreditCard className="mr-2 inline align-middle" /> No hay pagos registrados</h3>
              <p>Registra el primer pago del club</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Agregar/Editar */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onClick={(event) => event.stopPropagation()}
          >
<div className={styles.modalHeader}>
              <h3 id={modalTitleId} className="text-xl font-bold text-white">
                {editingPago ? (
                  <><FaEdit className="mr-2 inline align-middle" /> Editar Pago</>
                ) : (
                  <><FaPlus className="mr-2 inline align-middle" /> Registrar Nuevo Pago</>
                )}
              </h3>
              <button 
                onClick={closeModal}
                className={styles.closeButton}
                aria-label="Cerrar modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              {Object.values(formErrors).filter(Boolean).length > 0 && (
                <div className={styles.formErrorSummary} role="alert">
                  {Object.values(formErrors).filter(Boolean)[0]}
                </div>
              )}

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
                    <label htmlFor="fecha_inicio" className="block text-sm font-semibold text-white">Fecha Inicio *</label>
                    <input
                      id="fecha_inicio"
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => {
                        setFormData({...formData, fecha_inicio: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_inicio: undefined, fecha_fin: undefined }));
                      }}
                      required
                      max={getTodayDateString()}
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      aria-invalid={Boolean(formErrors.fecha_inicio)}
                      aria-describedby={formErrors.fecha_inicio ? 'payment-start-error' : 'payment-start-hint'}
                    />
                    <p id="payment-start-hint" className={styles.fieldHint}>Inicio del periodo a cubrir.</p>
                    {formErrors.fecha_inicio && <p id="payment-start-error" className={styles.fieldError}>{formErrors.fecha_inicio}</p>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_fin" className="block text-sm font-semibold text-white">Fecha Fin</label>
                    <input
                      id="fecha_fin"
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => {
                        setFormData({...formData, fecha_fin: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_fin: undefined }));
                      }}
                      min={formData.fecha_inicio || undefined}
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      aria-invalid={Boolean(formErrors.fecha_fin)}
                      aria-describedby={formErrors.fecha_fin ? 'payment-end-error' : 'payment-end-hint'}
                    />
                    <p id="payment-end-hint" className={styles.fieldHint}>Opcional. Debe ser igual o posterior al inicio.</p>
                    {formErrors.fecha_fin && <p id="payment-end-error" className={styles.fieldError}>{formErrors.fecha_fin}</p>}
                  </div>
                </div>
              </div>

<div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaDollarSign className="mr-2 inline align-middle" />Datos del Pago</h4>
                <div className={styles.formGrid}>
<div className={styles.inputGroup}>
                    <label htmlFor="monto" className="block text-sm font-semibold text-white">Monto *</label>
                    <input
                      id="monto"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.monto}
                      onChange={(e) => {
                        setFormData({...formData, monto: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, monto: undefined }));
                      }}
                      required
                      placeholder="0.00"
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      aria-invalid={Boolean(formErrors.monto)}
                      aria-describedby={formErrors.monto ? 'payment-amount-error' : 'payment-amount-hint'}
                    />
                    <p id="payment-amount-hint" className={styles.fieldHint}>Monto total del periodo.</p>
                    {formErrors.monto && <p id="payment-amount-error" className={styles.fieldError}>{formErrors.monto}</p>}
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_pago" className="block text-sm font-semibold text-white">Fecha de Pago</label>
                    <input
                      id="fecha_pago"
                      type="date"
                      value={formData.fecha_pago}
                      onChange={(e) => {
                        setFormData({...formData, fecha_pago: e.target.value});
                        setFormErrors((previousErrors) => ({ ...previousErrors, fecha_pago: undefined }));
                      }}
                      max={getTodayDateString()}
                      className="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
                      aria-invalid={Boolean(formErrors.fecha_pago)}
                      aria-describedby={formErrors.fecha_pago ? 'payment-date-error' : 'payment-date-hint'}
                    />
                    <p id="payment-date-hint" className={styles.fieldHint}>Opcional. Solo fechas hasta hoy.</p>
                    {formErrors.fecha_pago && <p id="payment-date-error" className={styles.fieldError}>{formErrors.fecha_pago}</p>}
                  </div>

                  <div className={styles.inputGroupFullWidth}>
                    <label htmlFor="observaciones" className="block text-sm font-semibold text-white">Observaciones</label>
                    <textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => {
                        setFormData({...formData, observaciones: e.target.value});
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
              

              
              <div className={styles.formActions}>
                <button 
                  type="button"
                  onClick={closeModal}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={styles.saveButton}
                >
                  {editingPago ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
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










