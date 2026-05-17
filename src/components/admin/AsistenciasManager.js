// src/components/admin/AsistenciasManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { attendanceService } from '../../features/attendance';
import { reportingService } from '../../features/reporting';
import { formatDateString } from '../../utils/dateUtils';
import { 
  FaChartBar, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaChartLine, 
  FaCalendarAlt, 
  FaUsers, 
  FaVolleyballBall, 
  FaMars, 
  FaVenus, 
  FaTrophy, 
  FaMedal, 
  FaTrash, 
  FaTimes, 
  FaCheck,
  FaDollarSign,
  FaCalendarCheck,
  FaCreditCard,
  FaFileExport,
  FaPrint,
  FaSearch
} from 'react-icons/fa';

const styleMap = {
  asistenciasManager: 'mx-auto w-full max-w-7xl space-y-4',
  header: 'flex flex-wrap items-start justify-between gap-3',
  headerLeft: '[&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white mobile:[&_h2]:text-2xl [&_p]:mt-1 [&_p]:text-sm [&_p]:text-slate-200',
  headerActions: 'flex flex-wrap items-center gap-2',
  exportButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/30',
  bulkButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-4 py-2 text-sm font-black text-rv-dark shadow-rv-gold transition hover:brightness-105',
  statsGrid: 'grid gap-3 mobile:grid-cols-2 desktop:grid-cols-4',
  statCard: 'rounded-2xl border border-rv-gold/25 bg-black/35 p-4 backdrop-blur-md',
  statIcon: 'mb-2 inline-flex text-2xl text-rv-gold',
  statInfo: '[&_h3]:text-3xl [&_h3]:font-black [&_h3]:text-white [&_p]:mt-1 [&_p]:text-xs [&_p]:font-semibold [&_p]:uppercase [&_p]:tracking-wide [&_p]:text-slate-300',
  categoryAttendance: 'rounded-2xl border border-white/15 bg-black/30 p-4',
  bulkHeader: 'flex flex-wrap items-end justify-between gap-3',
  dateSelector: 'space-y-1 [&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-rv-gold/90',
  dateInput: 'min-h-[48px] rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  searchBox: 'relative min-w-[260px]',
  searchIcon: 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300',
  searchInput: 'min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 pl-10 pr-10 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  clearSearch: 'absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20',
  bulkActions: 'flex flex-wrap items-center gap-2',
  allPresentButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30',
  clearButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-red-400/35 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30',
  categoryTabs: 'mt-3 flex flex-wrap gap-2',
  tabButton: 'inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10',
  tabActive: 'border-rv-gold/70 bg-rv-gold/20 text-white',
  tabIcon: 'inline-flex',
  tabName: '',
  tabCount: 'rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-bold',
  categoryStatsBar: 'mt-3 rounded-xl border border-white/10 bg-black/20 p-2',
  miniStat: 'inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-xs text-slate-200',
  miniIcon: 'text-rv-gold',
  categoryContent: 'mt-3 space-y-3',
  allCategoriesView: 'space-y-3',
  filteredCategoryView: 'space-y-3',
  categorySection: 'rounded-xl border border-white/10 bg-black/20 p-3',
  categoryTitle: 'mb-2 text-sm font-black uppercase tracking-wide text-rv-gold',
  categorySubGrid: 'grid gap-3 mobile:grid-cols-2',
  subCategory: 'rounded-xl border border-white/10 bg-black/25 p-2',
  atletasList: 'space-y-2',
  atletaItem: 'flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-2',
  atletaItemNew: 'flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 p-2',
  atletaNameSection: 'min-w-0',
  atletaIdentity: 'flex items-center gap-2',
  atletaInitials: 'inline-flex h-8 w-8 items-center justify-center rounded-full border border-rv-gold/40 bg-rv-gold/20 text-[11px] font-black text-rv-gold',
  atletaName: 'truncate text-sm font-semibold text-white',
  currentPaymentBadge: 'mt-1 inline-flex rounded-full border border-rv-gold/30 bg-rv-gold/15 px-2 py-0.5 text-[11px] font-bold text-rv-gold',
  paymentButtons: 'flex flex-wrap items-center justify-end gap-1',
  paymentMethodBtn: 'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 text-xs font-bold text-slate-100 transition hover:bg-white/20',
  paymentMethodActive: 'border-emerald-400/60 bg-emerald-500/25 text-emerald-100',
  removeAttendanceBtn: 'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-400/35 bg-red-500/15 text-red-100 transition hover:bg-red-500/30',
  attendanceToggle: 'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border px-2 text-xs font-bold transition',
  present: 'border-emerald-400/45 bg-emerald-500/25 text-emerald-100',
  absent: 'border-white/20 bg-white/10 text-slate-200',
  reportsMode: 'space-y-4',
  filtersSection: 'grid gap-3 rounded-2xl border border-white/15 bg-black/30 p-4 mobile:grid-cols-2 tablet:grid-cols-4',
  filterGroup: 'space-y-1 [&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-rv-gold/90',
  filterInput: 'min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  filterSelect: 'min-h-[48px] w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  attendanceTable: 'rounded-2xl border border-white/15 bg-black/30 p-3',
  daysContainer: 'space-y-2',
  dayCard: 'rounded-xl border border-white/10 bg-black/20 p-3',
  dayHeader: 'flex flex-wrap items-center justify-between gap-2',
  dayInfo: 'space-y-0.5',
  dayCount: 'inline-flex rounded-full border border-rv-gold/35 bg-rv-gold/15 px-2 py-0.5 text-[11px] font-bold text-rv-gold',
  dayActions: 'flex flex-wrap items-center gap-1',
  exportDayButton: 'inline-flex min-h-[40px] items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30',
  deletePersistedButton: 'inline-flex min-h-[40px] items-center justify-center rounded-lg border border-red-400/35 bg-red-500/15 px-3 text-xs font-semibold text-red-100 transition hover:bg-red-500/30',
  expandIcon: 'text-slate-200',
  dayContent: 'mt-3 space-y-3',
  categorySectionTitle: 'mb-2 text-sm font-black uppercase tracking-wide text-rv-gold/90',
  categoryTables: 'grid gap-3 tablet:grid-cols-2',
  subCategoryTable: 'rounded-xl border border-white/10 bg-black/25 p-2',
  compactTable: 'w-full border-collapse [&_th]:border-b [&_th]:border-white/15 [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-300 [&_td]:border-b [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-2 [&_td]:text-xs [&_td]:text-white',
  paymentCell: 'text-center text-xs font-semibold text-rv-gold',
  subtotal: 'mt-2 text-right text-xs font-bold text-slate-200',
  categoryTotal: 'mt-2 text-right text-sm font-black text-white',
  dayResumen: 'rounded-xl border border-white/10 bg-black/20 p-2 text-sm text-slate-200',
  categoryStats: 'rounded-2xl border border-white/15 bg-black/30 p-4',
  categoryGrid: 'grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3',
  categoryCard: 'rounded-xl border border-white/10 bg-black/20 p-3',
  categoryNumbers: 'mt-2 flex items-center justify-between',
  percentage: 'text-lg font-black text-rv-gold',
  loading: 'flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-white',
  spinner: 'h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-rv-gold',
  noData: 'rounded-2xl border border-white/15 bg-black/25 p-8 text-center text-slate-200',
  modalOverlay: 'fixed inset-0 z-[1300] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm',
  modalContent: 'max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-rv-gold/25 bg-slate-950/95 p-4 text-white shadow-2xl',
  modalHeader: 'mb-3 flex items-center justify-between gap-2 border-b border-white/15 pb-2',
  modalClose: 'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20',
  modalBody: 'space-y-3',
  exportInfo: 'rounded-xl border border-white/10 bg-black/20 p-2 text-sm text-slate-200',
  formGroup: 'space-y-1 [&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-rv-gold/90',
  observationsTextarea: 'w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/70',
  exportPreview: 'rounded-xl border border-white/10 bg-black/20 p-2 text-sm text-slate-200',
  modalFooter: 'mt-2 flex flex-wrap justify-end gap-2',
  cancelButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20',
  confirmButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-4 py-2 text-sm font-black text-rv-dark shadow-rv-gold transition hover:brightness-105',
  subCategoryTableCompact: '',
  tabButtonCompact: '',
  subtotalCompact: ''
};

const styles = new Proxy(styleMap, {
  get(target, prop) {
    if (typeof prop !== 'string') return '';
    return target[prop] || '';
  }
});

const AsistenciasManager = ({ user }) => {
  const defaultDates = attendanceService.getDefaultDates();
  const [asistencias, setAsistencias] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(defaultDates.selectedDate);
  const [filters, setFilters] = useState({
    fecha_inicio: defaultDates.dateFrom,
    fecha_fin: defaultDates.dateTo,
    categoria: '',
    atleta: ''
  });

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // Nueva: categoría seleccionada en tabs
  const [paymentTypes, setPaymentTypes] = useState([]); // Métodos de pago disponibles
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportObservations, setExportObservations] = useState('');
  const [expandedDays, setExpandedDays] = useState([]); // Días expandidos en el historial
  const [asistenciasByDate, setAsistenciasByDate] = useState({}); // Asistencias agrupadas por fecha
  const [dateToExport, setDateToExport] = useState(null); // Fecha a exportar
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda de atletas
  const [reportRuns, setReportRuns] = useState([]);
  const [loadingReportRuns, setLoadingReportRuns] = useState(false);
  const [reportRunsError, setReportRunsError] = useState('');
  const [downloadingRunId, setDownloadingRunId] = useState(null);
  const [deletingRunId, setDeletingRunId] = useState(null);

  const categorias = [
    'iniciacion_hombres',
    'iniciacion_mujeres', 
    'perfeccionamiento_mujeres',
    'perfeccionamiento_hombres',
    'master_mujeres'
  ];

  // Categorías agrupadas para los tabs
  const categoriasAgrupadas = [
    { id: 'all', nombre: 'Todas', icono: <FaUsers /> },
    { id: 'iniciacion', nombre: 'Iniciación', icono: <FaVolleyballBall /> },
    { id: 'perfeccionamiento', nombre: 'Perfeccionamiento', icono: <FaTrophy /> },
    { id: 'master', nombre: 'Master', icono: <FaMedal /> }
  ];

  useEffect(() => {
    // Cargar datos iniciales al montar el componente
    loadData();
    loadPaymentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Recargar cuando cambien los filtros (excluyendo la carga inicial)
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    // Solo cargar asistencias del día si ya tenemos atletas cargados
    if (atletas.length > 0) {
      loadTodayAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, atletas]);

  useEffect(() => {
    if (!bulkMode) {
      loadReportRuns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkMode, filters.fecha_inicio, filters.fecha_fin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await attendanceService.loadAttendanceData({
        filters,
        athletes: atletas,
      });

      setAtletas(result.athletes || []);
      setAsistencias(result.attendances || []);
      setAsistenciasByDate(result.groupedByDate || {});

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const todayData = await attendanceService.loadTodayAttendance({
        selectedDate,
        athletes: atletas,
      });
      setTodayAttendance(todayData || []);
    } catch (error) {
      console.error('Error cargando asistencias del día:', error);
    }
  };

  const loadPaymentTypes = async () => {
    try {
      const data = await attendanceService.listPaymentTypes();
      setPaymentTypes(data || []);
      console.log('📋 Métodos de pago cargados:', data);
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const loadReportRuns = async () => {
    try {
      setLoadingReportRuns(true);
      setReportRunsError('');

      const runs = await reportingService.listRuns({
        reportCode: 'attendance_daily',
        dateFrom: filters.fecha_inicio || null,
        dateTo: filters.fecha_fin || null,
        limit: 80,
      });

      setReportRuns(runs);
    } catch (error) {
      console.error('Error cargando reportes persistidos:', error);
      setReportRunsError(error.message || 'No se pudieron cargar los reportes persistidos');
    } finally {
      setLoadingReportRuns(false);
    }
  };

  const registerAttendanceWithPayment = async (atletaId, paymentTypeId) => {
    try {
      await attendanceService.registerAttendanceWithPayment({
        athleteId: atletaId,
        selectedDate,
        paymentTypeId,
      });

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const removeAttendance = async (atletaId) => {
    try {
      await attendanceService.removeAttendance({
        athleteId: atletaId,
        selectedDate,
      });

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const toggleAttendance = async (atletaId, isCurrentlyPresent) => {
    try {
      await attendanceService.toggleAttendance({
        athleteId: atletaId,
        selectedDate,
        isCurrentlyPresent,
      });

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const markAllPresent = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Marcar todos los atletas como presentes con MENSUALIDAD?')) {
      return;
    }

    try {
      await attendanceService.markAllPresentWithMensualidad({
        selectedDate,
        paymentTypes,
        todayAttendance,
      });
      alert('Todos los atletas marcados como presentes con MENSUALIDAD');
    } catch (error) {
      console.error('Error marcando asistencias masivas:', error);
      alert('Error: ' + error.message);
    }
  };

  const clearAllAttendance = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Limpiar todas las asistencias del día?')) {
      return;
    }

    try {
      await attendanceService.clearAttendanceForDate({
        selectedDate,
      });

      // Recargar todo para que estadísticas y reportes se reflejen al instante
      await Promise.all([
        loadTodayAttendance(),
        loadData(),
        loadReportRuns(),
      ]);

      // Notificar para refrescar el dashboard cuando esté visible
      window.dispatchEvent(new Event('riovoley:dashboard-refresh'));
      alert('Asistencias del día limpiadas correctamente');
    } catch (error) {
      console.error('Error limpiando asistencias:', error);
      alert('Error: ' + error.message);
    }
  };

  const calculateStats = () => {
    return attendanceService.calculateStats({
      attendances: asistencias,
      athletes: atletas,
      todayAttendance,
      bulkMode,
      categories: categorias,
    });
  };

  const formatCategoria = (categoria) => {
    if (!categoria) return '--';
    return categoria.replaceAll('_', ' ').toUpperCase();
  };

  // Filtrar atletas según categoría seleccionada en tabs y término de búsqueda
  const filteredAtletas = attendanceService.filterTodayAttendance({
    todayAttendance,
    selectedCategory,
    searchTerm,
    searchPredicate: (atleta, searchLower) =>
      attendanceService.getSearchNameBlob({ athleteUser: atleta.users }).includes(searchLower),
  });

  // Filtrar atletas por categoría específica y término de búsqueda
  const filterAtletasBySearchAndCategory = (categoria) =>
    attendanceService.filterTodayAttendanceByCategory({
      todayAttendance,
      category: categoria,
      searchTerm,
      searchPredicate: (atleta, searchLower) =>
        attendanceService.getSearchNameBlob({ athleteUser: atleta.users }).includes(searchLower),
    });

  // Obtener estadísticas de la categoría seleccionada
  const getCategoryStats = () => attendanceService.getCategoryStats({ filteredAthletes: filteredAtletas });

  const homonymsByCompactName = attendanceService.buildHomonymsByCompactName({
    athletes: filteredAtletas,
  });

  // Renderizar atleta con botones de métodos de pago
  const renderAtletaWithPaymentMethods = (atleta) => {
    const isPresent = atleta.attendance !== null;
    const currentPaymentMethod = atleta.attendance?.metodo_pago_id;
    const homonymKey = attendanceService.getHomonymKey({ athleteUser: atleta.users });
    const homonymCount = homonymsByCompactName[homonymKey] || 0;
    const displayName = attendanceService.getCompactDisplayName({
      athleteUser: atleta.users,
      isHomonym: homonymCount > 1,
    });
    const fullName = attendanceService.getAthleteNameParts({ athleteUser: atleta.users }).nombreCompleto || displayName;
    
    // Obtener nombres de métodos de pago
    const iconos = {
      pago_diario: <FaDollarSign />,
      mensualidad: <FaCalendarCheck />,
      tarjeta: <FaCreditCard />,
      unknown: null,
    };
    const getPaymentMethodInfo = (ptId) => attendanceService.getPaymentTypeDisplay({
      paymentTypes,
      metodoPagoId: ptId,
    });

    return (
      <div key={atleta.id} className={styles.atletaItemNew}>
        <div className={styles.atletaNameSection}>
          <div className={styles.atletaIdentity}>
            <span className={styles.atletaInitials} aria-hidden="true">
              {attendanceService.getAthleteInitials({ athleteUser: atleta.users })}
            </span>
            <span className={styles.atletaName} title={fullName}>
              {displayName}
            </span>
          </div>
          {isPresent && currentPaymentMethod && (
            <span className={styles.currentPaymentBadge}>
              {iconos[getPaymentMethodInfo(currentPaymentMethod).key] || <FaDollarSign />}
            </span>
          )}
        </div>
        
        <div className={styles.paymentButtons}>
          {paymentTypes.map(pt => {
            const isSelected = currentPaymentMethod === pt.id;
            const info = getPaymentMethodInfo(pt.id);
            
            return (
              <button
                key={pt.id}
                onClick={() => registerAttendanceWithPayment(atleta.id, pt.id)}
                className={`${styles.paymentMethodBtn} ${
                  isSelected ? styles.paymentMethodActive : ''
                }`}
                aria-label={`Marcar asistencia con ${pt.nombre.replaceAll('_', ' ')}`}
                title={pt.descripcion}
              >
                {iconos[info.key] || <FaDollarSign />}
              </button>
            );
          })}
          
          {isPresent && (
            <button
              onClick={() => removeAttendance(atleta.id)}
              className={styles.removeAttendanceBtn}
              aria-label="Eliminar asistencia"
              title="Eliminar asistencia"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
    );
  };

  const exportAttendance = (fecha = null) => {
    const isValidDateString = typeof fecha === 'string' && fecha.includes('-');
    setDateToExport(isValidDateString ? fecha : selectedDate);
    setShowExportModal(true);
  };

  const toggleDayExpansion = (fecha) => {
    setExpandedDays(prev => 
      prev.includes(fecha) 
        ? prev.filter(d => d !== fecha)
        : [...prev, fecha]
    );
  };

  const getExportSummary = () =>
    attendanceService.buildExportSummary({
      asistenciasByDate,
      dateToExport,
      selectedDate,
      todayAttendance,
    });


  const downloadPersistedRun = async (run) => {
    if (!run?.id) return;

    try {
      setDownloadingRunId(run.id);
      const signedUrl = await reportingService.getDownloadUrlByRunId(run.id);
      if (!signedUrl) {
        alert('El reporte existe, pero no se pudo obtener la URL de descarga.');
        return;
      }

      await reportingService.downloadFromSignedUrl(
        signedUrl,
        `reporte-asistencia-${run.period_start || selectedDate}.pdf`
      );
    } catch (error) {
      console.error('Error descargando reporte persistido:', error);
      alert(`No se pudo descargar el reporte: ${error.message}`);
    } finally {
      setDownloadingRunId(null);
    }
  };

  const deletePersistedRun = async (run) => {
    if (!run?.id) return;

    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`¿Eliminar el reporte persistido del ${formatDateString(run.period_start)}?`)) {
      return;
    }

    try {
      setDeletingRunId(run.id);
      await reportingService.deleteRun(run.id);
      await loadReportRuns();
      alert('Reporte persistido eliminado correctamente.');
    } catch (error) {
      console.error('Error eliminando reporte persistido:', error);
      alert(`No se pudo eliminar el reporte: ${error.message}`);
    } finally {
      setDeletingRunId(null);
    }
  };

  const generateExportDocument = async () => {
    try {
      const { exportFecha } = getExportSummary();

      if (!exportFecha) {
        alert('Selecciona una fecha valida para exportar.');
        return;
      }

      const report = await reportingService.ensureDailyAttendanceReport({
        date: exportFecha,
        observations: exportObservations,
      });

      if (!report.signedUrl) {
        throw new Error('No se pudo obtener URL firmada para descargar el reporte');
      }

      await reportingService.downloadFromSignedUrl(report.signedUrl, report.fileName);

      setShowExportModal(false);
      setExportObservations('');
      setDateToExport(null);
      await loadReportRuns();
      alert('Reporte PDF generado y almacenado correctamente.');
    } catch (error) {
      console.error('Error generando reporte persistido de asistencias:', error);
      alert(`No se pudo generar el PDF: ${error.message}`);
    }
  };

  const stats = calculateStats();
  const exportSummary = getExportSummary();

  return (
    <div className={styles.asistenciasManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaCalendarAlt className="mr-2 inline align-middle" /> Control de Asistencias</h2>
          <p>Registro y seguimiento de entrenamientos</p>
        </div>
        <div className={styles.headerActions}>
          {bulkMode && (
            <button 
              className={styles.exportButton}
              onClick={() => exportAttendance()}
              title="Exportar asistencias del día"
            >
              <FaFileExport className="mr-1.5 inline align-middle" /> Exportar
            </button>
          )}
          <button 
            className={styles.bulkButton}
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? (
              <><FaChartBar className="mr-1.5 inline align-middle" /> Ver Reportes</>
            ) : (
              <><FaCheckCircle className="mr-1.5 inline align-middle" /> Registro Rápido</>
            )}
          </button>
        </div>
      </div>
          {/* Estadisticas por Categoria */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartBar /></div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Registros</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCheckCircle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.presentes}</h3>
            <p>Presentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaTimesCircle /></div>
          <div className={styles.statInfo}>
            <h3>{stats.ausentes}</h3>
            <p>Ausentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaChartLine /></div>
          <div className={styles.statInfo}>
            <h3>{stats.porcentajeAsistencia}%</h3>
            <p>Asistencia Promedio</p>
          </div>
        </div>
      </div>

      {bulkMode ? (
        /* Modo de Registro por Categorías */
        <div className={styles.categoryAttendance}>
          <div className={styles.bulkHeader}>
            <div className={styles.dateSelector}>
              <label htmlFor="attendance-date">Fecha de Entrenamiento:</label>
              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            
            <div className={styles.searchBox}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar atleta por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={styles.clearSearch}
                  title="Limpiar búsqueda"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            
            <div className={styles.bulkActions}>
              <button onClick={markAllPresent} className={styles.allPresentButton}>
                <FaCheckCircle className="mr-1.5 inline align-middle" /> Todos Presentes
              </button>
              <button onClick={clearAllAttendance} className={styles.clearButton}>
                <FaTrash className="mr-1.5 inline align-middle" /> Limpiar Día
              </button>
            </div>
          </div>

          {/* Registro por Categorías */}
          <div className={styles.categorySections}>
            {/* Tabs de Categorías */}
            <div className={styles.categoryTabs}>
              {categoriasAgrupadas.map(cat => {
                const categoryStats = getCategoryStats();
                const isActive = selectedCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`${styles.tabButton} ${isActive ? styles.tabActive : ''}`}
                  >
                    <span className={styles.tabIcon}>{cat.icono}</span>
                    <span className={styles.tabName}>{cat.nombre}</span>
                    {isActive && (
                      <span className={styles.tabCount}>
                        {categoryStats.presentes}/{categoryStats.total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          {/* Estadisticas por Categoria */}
            <div className={styles.categoryStatsBar}>
              {(() => {
                const catStats = getCategoryStats();
                return (
                  <>
                    <div className={styles.miniStat}>
                      <FaUsers className={styles.miniIcon} />
                      <span>Total: {catStats.total}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaCheckCircle className={`${styles.miniIcon} text-emerald-500`} />
                      <span>Presentes: {catStats.presentes}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaTimesCircle className={`${styles.miniIcon} text-red-500`} />
                      <span>Ausentes: {catStats.ausentes}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaChartLine className={styles.miniIcon} />
                      <span>Asistencia: {catStats.porcentaje}%</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Contenido de la categoría seleccionada */}
            <div className={styles.categoryContent}>
              {selectedCategory === 'all' ? (
                /* Vista de todas las categorías */
                <div className={styles.allCategoriesView}>
                  {/* Iniciación */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaVolleyballBall className="mr-2" /> Iniciación
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars className="mr-1.5" /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus className="mr-1.5" /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Perfeccionamiento */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaTrophy className="mr-2" /> Perfeccionamiento
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars className="mr-1.5" /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus className="mr-1.5" /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Master */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaMedal className="mr-2" /> Master
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaVenus className="mr-1.5" /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('master_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span
                                    className={styles.atletaName}
                                    title={attendanceService.getAthleteNameParts({ athleteUser: atleta.users }).nombreCompleto}
                                  >
                                    {attendanceService.getCompactDisplayName({
                                      athleteUser: atleta.users,
                                      isHomonym:
                                        (homonymsByCompactName[
                                          attendanceService.getHomonymKey({ athleteUser: atleta.users })
                                        ] || 0) > 1,
                                    })}
                                  </span>
                                  <button
                                    onClick={() => toggleAttendance(atleta.id, isPresent)}
                                    className={`${styles.attendanceToggle} ${
                                      isPresent ? styles.present : styles.absent
                                    }`}
                                  >
                                    {isPresent ? <FaCheck /> : <FaTimes />}
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Vista filtrada por categoría específica */
                <div className={styles.filteredCategoryView}>
                  {selectedCategory === 'iniciacion' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars className="mr-1.5" /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus className="mr-1.5" /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('iniciacion_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'perfeccionamiento' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars className="mr-1.5" /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_hombres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus className="mr-1.5" /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('perfeccionamiento_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'master' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaVenus className="mr-1.5" /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {filterAtletasBySearchAndCategory('master_mujeres')
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Modo de Reportes */
        <div className={styles.reportsMode}>
          {/* Filtros */}
          <div className={styles.filtersSection}>
            <div className={styles.filterGroup}>
              <label htmlFor="fecha-inicio">Desde:</label>
              <input
                id="fecha-inicio"
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
                className={styles.filterInput}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <label htmlFor="fecha-fin">Hasta:</label>
              <input
                id="fecha-fin"
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="categoria-filter">Categoría:</label>
              <select
                id="categoria-filter"
                value={filters.categoria}
                onChange={(e) => setFilters({...filters, categoria: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>
                    {formatCategoria(categoria)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="atleta-filter">Atleta:</label>
              <select
                id="atleta-filter"
                value={filters.atleta}
                onChange={(e) => setFilters({...filters, atleta: e.target.value})}
                className={styles.filterSelect}
              >
                <option value="">Todos los atletas</option>
                {atletas.map(atleta => (
                  <option key={atleta.id} value={atleta.id}>
                    {atleta.users?.nombre} {atleta.users?.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.attendanceTable}>
            <h3><FaFileExport className="mr-2 inline align-middle" /> Reportes Persistidos</h3>

            {loadingReportRuns ? (
              <p>Cargando reportes persistidos...</p>
            ) : reportRunsError ? (
              <p>{reportRunsError}</p>
            ) : reportRuns.length === 0 ? (
              <p>No hay reportes persistidos para el rango seleccionado.</p>
            ) : (
              <div className={styles.daysContainer}>
                {reportRuns.map((run) => (
                  <div key={run.id} className={styles.dayCard}>
                    <div className={styles.dayHeader}>
                      <div className={styles.dayInfo}>
                        <h4>
                          <FaCalendarAlt className="mr-2" />
                          {formatDateString(run.period_start)}
                        </h4>
                        <span className={styles.dayCount}>
                          Estado: {run.status}
                        </span>
                      </div>
                      <div className={styles.dayActions}>
                        <button
                          className={styles.exportDayButton}
                          onClick={() => downloadPersistedRun(run)}
                          disabled={downloadingRunId === run.id || deletingRunId === run.id || run.status !== 'ready'}
                          title={run.status === 'ready' ? 'Descargar reporte' : 'El reporte aun no esta listo'}
                        >
                          <FaFileExport className="mr-1.5" />
                          {downloadingRunId === run.id ? 'Descargando...' : 'Descargar'}
                        </button>
                        <button
                          className={styles.deletePersistedButton}
                          onClick={() => deletePersistedRun(run)}
                          disabled={deletingRunId === run.id || downloadingRunId === run.id}
                          title="Eliminar reporte persistido"
                        >
                          <FaTrash className="mr-1.5" />
                          {deletingRunId === run.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Estadisticas por Categoria */}
          <div className={styles.categoryStats}>
            <h3><FaChartBar className="mr-2 inline align-middle" /> Estadísticas por Categoría</h3>
            <div className={styles.categoryGrid}>
              {categorias.map(categoria => {
                const catStats = stats.categoriaStats[categoria];
                return (
                  <div key={categoria} className={styles.categoryCard}>
                    <h4>{formatCategoria(categoria)}</h4>
                    <div className={styles.categoryNumbers}>
                      <span>Presentes: {catStats.presentes}</span>
                      <span>Total: {catStats.total}</span>
                      <span className={styles.percentage}>{catStats.porcentaje}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista de Asistencias Agrupadas por Día */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando asistencias...</p>
            </div>
          ) : (
            <div className={styles.attendanceTable}>
              <h3>📋 Historial de Asistencias por Día</h3>
              
              {Object.keys(asistenciasByDate).length > 0 ? (
                <div className={styles.daysContainer}>
                  {Object.keys(asistenciasByDate)
                    .sort((a, b) => new Date(b) - new Date(a)) // Ordenar por fecha descendente
                    .map(fecha => {
                      const dayAttendances = asistenciasByDate[fecha];
                      const isExpanded = expandedDays.includes(fecha);
                      const fechaFormateada = formatDateString(fecha);

                      const breakdown = attendanceService.buildDayAttendanceBreakdown({ dayAttendances });
                      const {
                        iniciacion,
                        iniciacionHombres,
                        iniciacionMujeres,
                        perfHombres,
                        perfMujeres,
                      } = breakdown;

                      const getPaymentMethodName = (metodoPagoId) => {
                        const display = attendanceService.getPaymentTypeDisplay({
                          paymentTypes,
                          metodoPagoId,
                        });
                        if (display.label === 'N/A') return 'N/A';

                        const icons = {
                          pago_diario: <FaDollarSign />,
                          mensualidad: <FaCalendarCheck />,
                          tarjeta: <FaCreditCard />,
                        };

                        return <>{icons[display.key] || <FaDollarSign />} {display.label}</>;
                      };

                      return (
                        <div key={fecha} className={styles.dayCard}>
                          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                          <div 
                            className={styles.dayHeader}
                            onClick={() => toggleDayExpansion(fecha)}
                          >
                            <div className={styles.dayInfo}>
                              <h4>
                                <FaCalendarAlt className="mr-2" />
                                {fechaFormateada}
                              </h4>
                              <span className={styles.dayCount}>
                                {dayAttendances.length} asistencias
                              </span>
                            </div>
                            <div className={styles.dayActions}>
                              <button
                                className={styles.exportDayButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportAttendance(fecha);
                                }}
                                title="Exportar este día"
                              >
                                <FaFileExport className="mr-1.5" />
                                Exportar
                              </button>
                              <span className={styles.expandIcon}>
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className={styles.dayContent}>
                              {/* Tabla 1: Iniciación */}
                              {iniciacion.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h5 className={styles.categorySectionTitle}>
                                    <FaVolleyballBall className="mr-2" />
                                    Iniciación
                                  </h5>
                                  <div className={styles.categoryTables}>
                                    {/* Hombres */}
                                    {iniciacionHombres.length > 0 && (
                                      <div className={styles.subCategoryTable}>
                                        <h6><FaMars className="mr-1.5" /> Hombres</h6>
                                        <table className={styles.compactTable}>
                                          <thead>
                                            <tr>
                                              <th>#</th>
                                              <th>Atleta</th>
                                              <th>Método de Pago</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {iniciacionHombres
                                              .map((asistencia, index) => (
                                                <tr key={asistencia.id}>
                                                  <td data-label="#">{index + 1}</td>
                                                  <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                                  <td className={styles.paymentCell} data-label="Método de Pago">
                                                    {getPaymentMethodName(asistencia.metodo_pago_id)}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                        <div className={styles.subtotal}>
                                          Total: {iniciacionHombres.length}
                                        </div>
                                      </div>
                                    )}

                                    {/* Mujeres */}
                                    {iniciacionMujeres.length > 0 && (
                                      <div className={styles.subCategoryTable}>
                                        <h6><FaVenus className="mr-1.5" /> Mujeres</h6>
                                        <table className={styles.compactTable}>
                                          <thead>
                                            <tr>
                                              <th>#</th>
                                              <th>Atleta</th>
                                              <th>Método de Pago</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {iniciacionMujeres
                                              .map((asistencia, index) => (
                                                <tr key={asistencia.id}>
                                                  <td data-label="#">{index + 1}</td>
                                                  <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                                  <td className={styles.paymentCell} data-label="Método de Pago">
                                                    {getPaymentMethodName(asistencia.metodo_pago_id)}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                        <div className={styles.subtotal}>
                                          Total: {iniciacionMujeres.length}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className={styles.categoryTotal}>
                                    Total Iniciación: {iniciacion.length}
                                  </div>
                                </div>
                              )}

                              {/* Tabla 2: Perfeccionamiento Hombres */}
                              {perfHombres.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h5 className={styles.categorySectionTitle}>
                                    <FaTrophy className="mr-2" />
                                    Perfeccionamiento - Hombres
                                  </h5>
                                  <table className={styles.compactTable}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Atleta</th>
                                        <th>Método de Pago</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {perfHombres.map((asistencia, index) => (
                                        <tr key={asistencia.id}>
                                          <td data-label="#">{index + 1}</td>
                                          <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                          <td className={styles.paymentCell} data-label="Método de Pago">
                                            {getPaymentMethodName(asistencia.metodo_pago_id)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className={styles.categoryTotal}>
                                    Total: {perfHombres.length}
                                  </div>
                                </div>
                              )}

                              {/* Tabla 3: Perfeccionamiento Mujeres */}
                              {perfMujeres.length > 0 && (
                                <div className={styles.categorySection}>
                                  <h5 className={styles.categorySectionTitle}>
                                    <FaMedal className="mr-2" />
                                    Perfeccionamiento - Mujeres
                                  </h5>
                                  <table className={styles.compactTable}>
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Atleta</th>
                                        <th>Categoría</th>
                                        <th>Método de Pago</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {perfMujeres.map((asistencia, index) => (
                                        <tr key={asistencia.id}>
                                          <td data-label="#">{index + 1}</td>
                                          <td data-label="Atleta">{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</td>
                                          <td data-label="Categoría">{asistencia.students?.categoria === 'master_mujeres' ? 'Master' : 'Perfeccionamiento'}</td>
                                          <td className={styles.paymentCell} data-label="Método de Pago">
                                            {getPaymentMethodName(asistencia.metodo_pago_id)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div className={styles.categoryTotal}>
                                    Total: {perfMujeres.length}
                                  </div>
                                </div>
                              )}

                              {/* Resumen del día */}
                              <div className={styles.dayResumen}>
                                <strong>Total del día: {dayAttendances.length} asistencias</strong>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className={styles.noData}>
                  <h3><FaCalendarAlt className="mr-2 inline align-middle" /> No hay registros de asistencia</h3>
                  <p>Selecciona un rango de fechas o ajusta los filtros</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowExportModal(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3><FaPrint className="mr-2 inline align-middle" /> Exportar Asistencias</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowExportModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.exportInfo}>
                <p><strong>Fecha:</strong> {exportSummary.formattedDate}</p>
                <p><strong>Total asistencias:</strong> {exportSummary.totalAttendances}</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="observations">
                  📝 Observaciones (opcional)
                </label>
                <textarea
                  id="observations"
                  className={styles.observationsTextarea}
                  placeholder="Escribe aquí cualquier observación que desees incluir en el documento exportado..."
                  rows={5}
                  value={exportObservations}
                  onChange={(e) => setExportObservations(e.target.value)}
                />
              </div>

              <div className={styles.exportPreview}>
                <h4>📋 El documento incluirá:</h4>
                <ul>
                  <li>✅ Tabla 1: Iniciación (Hombres y Mujeres)</li>
                  <li>✅ Tabla 2: Perfeccionamiento Hombres</li>
                  <li>✅ Tabla 3: Perfeccionamiento Mujeres</li>
                  <li>✅ Resumen general de asistencias</li>
                  {exportObservations && <li>✅ Observaciones</li>}
                </ul>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowExportModal(false);
                  setExportObservations('');
                  setDateToExport(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmButton}
                onClick={generateExportDocument}
              >
                <FaFileExport className="mr-1.5 inline align-middle" /> 
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AsistenciasManager.propTypes = {
  user: PropTypes.object
};

export default AsistenciasManager;






