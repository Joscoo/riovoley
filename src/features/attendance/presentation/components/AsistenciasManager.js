// src/features/attendance/presentation/components/AsistenciasManager.js
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { attendanceService } from '../../attendanceService';
import { reportingService } from '../../../reporting';
import { Button, Card, Field, SortableHeader, SectionHeader, EmptyState, Modal, KpiTile, LoadingSpinner, TabNav } from '../../../../shared/ui';
import {
  SORT_DIRECTION,
  createTableQuery,
  withUpdatedFilter,
  withUpdatedSort,
  resetTableQuery,
} from '../../../../shared/lib/tableQuery';
import { formatDateString } from '../../../../utils/dateUtils';
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
  FaDollarSign,
  FaCalendarCheck,
  FaCreditCard,
  FaFileExport,
  FaPrint,
  FaSearch
} from 'react-icons/fa';

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/30';

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

  attendanceToggle: 'inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border px-2 text-xs font-bold transition',
  present: 'border-emerald-400/45 bg-emerald-500/25 text-emerald-100',
  absent: 'border-white/20 bg-white/10 text-slate-200',
  reportsMode: 'space-y-4',
  filtersCard: 'mb-4',
  filtersSection: 'space-y-4',
  filtersTopGrid: 'grid gap-4 tablet:grid-cols-[2fr_1fr]',
  filtersBottomGrid: 'grid gap-4 mobile:grid-cols-2 desktop:grid-cols-4',
  filterSummary: 'flex h-full items-end',
  filterSummaryBox: 'w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-slate-200',
  filterHint: 'text-[11px] text-slate-300',
  filterInput: INPUT_BASE,
  filterSelect: INPUT_BASE,
  filterActions: 'grid gap-4 mobile:grid-cols-2',
  filterActionButton: 'w-full',
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
  subtotalCompact: '',
  atletaItemNew: 'flex flex-col tablet:flex-row items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-rv-gold/30 transition-all duration-300 gap-3',
  atletaNameSection: 'flex flex-wrap items-center gap-3 w-full tablet:w-auto',
  atletaIdentity: 'flex items-center gap-3 flex-1 min-w-[200px]',
  atletaInitials: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rv-gold/20 to-rv-gold/5 border border-rv-gold/30 text-sm font-black text-rv-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]',
  atletaName: 'text-sm font-black uppercase tracking-wide text-white drop-shadow-md truncate',
  currentPaymentBadge: 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rv-gold/20 border border-rv-gold/30 text-rv-gold shadow-[0_0_10px_rgba(255,215,0,0.2)] ml-2',
  paymentButtons: 'flex flex-wrap items-center gap-2 w-full tablet:w-auto justify-end',
  paymentMethodBtn: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rv-gold/30 bg-black/40 text-rv-gold transition-all duration-200 hover:scale-105 hover:bg-rv-gold/20 active:scale-95 disabled:opacity-50',
  paymentMethodActive: 'border-rv-gold bg-rv-gold text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]',
  presentBtn: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-black/40 text-emerald-400 transition-all duration-200 hover:scale-105 hover:bg-emerald-500/20 active:scale-95',
  presentActive: 'border-emerald-400 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]',
  removeAttendanceBtn: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 transition hover:bg-red-500/20 active:scale-95 ml-1'
};

const styles = new Proxy(styleMap, {
  get(target, prop) {
    if (typeof prop !== 'string') return '';
    return target[prop] || '';
  }
});

const EMPTY_NOTICE = { type: '', text: '' };
const DEFAULT_ATTENDANCE_QUERY = createTableQuery({
  filters: {
    fecha_inicio: '',
    fecha_fin: '',
    categoria: '',
    atleta: '',
    metodo_pago_id: '',
    search: '',
  },
  sort: {
    field: 'fecha',
    direction: SORT_DIRECTION.DESC,
  },
  pagination: {
    page: 1,
    pageSize: 20,
  },
});

const AsistenciasManager = ({ user }) => {
  const defaultDates = attendanceService.getDefaultDates();
  const [asistencias, setAsistencias] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(defaultDates.selectedDate);
  const [queryState, setQueryState] = useState(
    createTableQuery({
      ...DEFAULT_ATTENDANCE_QUERY,
      filters: {
        ...DEFAULT_ATTENDANCE_QUERY.filters,
        fecha_inicio: defaultDates.dateFrom,
        fecha_fin: defaultDates.dateTo,
      },
    })
  );

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [activeMensualidades, setActiveMensualidades] = useState(new Set());
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
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState(EMPTY_NOTICE);
  const noticeTimerRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    tone: 'primary',
    isConfirming: false,
  });
  const [confirmAction, setConfirmAction] = useState(null);

  const categorias = [
    'iniciacion_hombres',
    'iniciacion_mujeres', 
    'perfeccionamiento_mujeres',
    'perfeccionamiento_hombres',
    'master_mujeres'
  ];

  // Categorías agrupadas para los tabs
  const categoriasAgrupadas = [
    { id: 'all', nombre: 'Todas', icono: FaUsers },
    { id: 'iniciacion', nombre: 'Iniciación', icono: FaVolleyballBall },
    { id: 'perfeccionamiento', nombre: 'Perfeccionamiento', icono: FaTrophy },
    { id: 'master', nombre: 'Master', icono: FaMedal }
  ];

  const showNotice = (type, text) => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }

    setNotice({ type, text });
    noticeTimerRef.current = globalThis.setTimeout(() => {
      setNotice((current) => (current.text === text ? EMPTY_NOTICE : current));
      noticeTimerRef.current = null;
    }, 5000);
  };

  const clearNoticeTimer = () => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  };

  const openConfirmDialog = ({ title, message, confirmLabel = 'Confirmar', tone = 'primary', onConfirm }) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      confirmLabel,
      tone,
    });
    setConfirmAction(() => onConfirm);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    setConfirmAction(null);
  };

  const runConfirmDialogAction = async () => {
    const action = confirmAction;
    if (action) {
      setConfirmDialog((prev) => ({ ...prev, isConfirming: true }));
      try {
        await action();
      } finally {
        closeConfirmDialog();
      }
    } else {
      closeConfirmDialog();
    }
  };

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
  }, [queryState]);

  useEffect(() => {
    // Solo cargar asistencias del día si ya tenemos atletas cargados
    if (atletas.length > 0) {
      loadTodayAttendance();
      loadActiveMensualidades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, atletas]);

  useEffect(() => {
    if (!bulkMode) {
      loadReportRuns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkMode, queryState.filters.fecha_inicio, queryState.filters.fecha_fin]);

  useEffect(() => () => clearNoticeTimer(), []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await attendanceService.loadAttendanceData({
        query: queryState,
        athletes: atletas,
      });

      setAtletas(result.athletes || []);
      setAsistencias(result.attendances || []);
      setAsistenciasByDate(result.groupedByDate || {});

    } catch (error) {
      console.error('Error cargando datos:', error);
      showNotice('error', 'Error al cargar los datos: ' + error.message);
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

  const loadActiveMensualidades = async () => {
    try {
      const activeIds = await attendanceService.loadActiveMensualidades({ selectedDate });
      setActiveMensualidades(new Set(activeIds));
    } catch (err) {
      console.error('Error cargando mensualidades activas:', err);
    }
  };

  const loadPaymentTypes = async () => {
    try {
      const data = await attendanceService.listPaymentTypes();
      setPaymentTypes(data || []);
      console.log('Metodos de pago cargados:', data);
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
        dateFrom: queryState.filters.fecha_inicio || null,
        dateTo: queryState.filters.fecha_fin || null,
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

  const updateQueryFilter = (key, value) => {
    setQueryState((current) => {
      let nextQuery = withUpdatedFilter({ query: current, key, value });

      if (key === 'fecha_inicio' && value && nextQuery.filters.fecha_fin && value > nextQuery.filters.fecha_fin) {
        nextQuery = withUpdatedFilter({ query: nextQuery, key: 'fecha_fin', value });
      }

      if (key === 'fecha_fin' && value && nextQuery.filters.fecha_inicio && value < nextQuery.filters.fecha_inicio) {
        nextQuery = withUpdatedFilter({ query: nextQuery, key: 'fecha_inicio', value });
      }

      if (key === 'categoria' && nextQuery.filters.atleta) {
        const selectedAthlete = atletas.find((athlete) => athlete.id === nextQuery.filters.atleta);
        if (selectedAthlete && selectedAthlete.categoria !== value) {
          nextQuery = withUpdatedFilter({ query: nextQuery, key: 'atleta', value: '' });
        }
      }

      return nextQuery;
    });
  };

  const toggleHistorySort = (field) => {
    setQueryState((current) => withUpdatedSort({ query: current, field }));
  };

  const resetHistoryFilters = () => {
    setQueryState(
      resetTableQuery({
        defaults: createTableQuery({
          ...DEFAULT_ATTENDANCE_QUERY,
          filters: {
            ...DEFAULT_ATTENDANCE_QUERY.filters,
            fecha_inicio: defaultDates.dateFrom,
            fecha_fin: defaultDates.dateTo,
          },
        }),
      })
    );
  };

  const normalizedHistorySearch = (queryState.filters.search || '').trim().toLowerCase();
  const filteredAthleteOptions = atletas.filter((athlete) => {
    const categoryMatches =
      !queryState.filters.categoria || athlete.categoria === queryState.filters.categoria;

    if (!categoryMatches) return false;
    if (!normalizedHistorySearch) return true;

    const searchBlob = attendanceService.getSearchNameBlob({ athleteUser: athlete.users });
    const categoryText = (athlete.categoria || '').replaceAll('_', ' ').toLowerCase();
    return `${searchBlob} ${categoryText}`.includes(normalizedHistorySearch);
  });

  const historyActiveFiltersCount = [
    queryState.filters.search,
    queryState.filters.categoria,
    queryState.filters.atleta,
    queryState.filters.metodo_pago_id,
    queryState.filters.fecha_inicio !== defaultDates.dateFrom,
    queryState.filters.fecha_fin !== defaultDates.dateTo,
  ].filter(Boolean).length;

  const registerAttendanceWithPayment = async (atletaId, paymentTypeId) => {
    // Actualización Optimista de la UI
    setTodayAttendance((prev) =>
      prev.map((atleta) => {
        if (atleta.id === atletaId) {
          return {
            ...atleta,
            attendance: {
              id: `temp-${Date.now()}`,
              atleta_id: atletaId,
              fecha: selectedDate,
              metodo_pago_id: paymentTypeId,
            },
          };
        }
        return atleta;
      })
    );

    try {
      await attendanceService.registerAttendanceWithPayment({
        athleteId: atletaId,
        selectedDate,
        paymentTypeId,
      });

      // Refrescar la lista general de historial en segundo plano
      loadData();
      window.dispatchEvent(new Event('riovoley:dashboard-refresh'));
    } catch (error) {
      console.error('Error registrando asistencia:', error);
      showNotice('error', 'Error: ' + error.message);
      // Revertir si hubo error
      loadTodayAttendance();
    }
  };

  const removeAttendance = async (atletaId) => {
    // Actualización Optimista de la UI
    setTodayAttendance((prev) =>
      prev.map((atleta) => {
        if (atleta.id === atletaId) {
          return {
            ...atleta,
            attendance: null,
          };
        }
        return atleta;
      })
    );

    try {
      await attendanceService.removeAttendance({
        athleteId: atletaId,
        selectedDate,
      });

      // Refrescar en segundo plano
      loadData();
      window.dispatchEvent(new Event('riovoley:dashboard-refresh'));
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
      showNotice('error', 'Error: ' + error.message);
      // Revertir si hubo error
      loadTodayAttendance();
    }
  };

  const markAllPresent = async () => {
    openConfirmDialog({
      title: 'Marcar asistencias masivas',
      message: '¿Marcar todos los atletas como presentes con MENSUALIDAD?',
      confirmLabel: 'Marcar todos',
      onConfirm: async () => {
        try {
          await attendanceService.markAllPresentWithMensualidad({
            selectedDate,
            paymentTypes,
            todayAttendance,
          });
          showNotice('success', 'Todos los atletas marcados como presentes con MENSUALIDAD');
          await Promise.all([loadTodayAttendance(), loadData()]);
          window.dispatchEvent(new Event('riovoley:dashboard-refresh'));
        } catch (error) {
          console.error('Error marcando asistencias masivas:', error);
          showNotice('error', 'Error: ' + error.message);
        }
      },
    });
  };

  const clearAllAttendance = async () => {
    openConfirmDialog({
      title: 'Limpiar asistencias del dia',
      message: '¿Limpiar todas las asistencias del día?',
      confirmLabel: 'Limpiar dia',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await attendanceService.clearAttendanceForDate({
            selectedDate,
          });

          await Promise.all([
            loadTodayAttendance(),
            loadData(),
            loadReportRuns(),
          ]);

          window.dispatchEvent(new Event('riovoley:dashboard-refresh'));
          showNotice('success', 'Asistencias del día limpiadas correctamente');
        } catch (error) {
          console.error('Error limpiando asistencias:', error);
          showNotice('error', 'Error: ' + error.message);
        }
      },
    });
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
    const hasActiveMensualidad = activeMensualidades.has(atleta.id);
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
          {hasActiveMensualidad && (
            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300 border border-emerald-400/30">
              <FaCalendarCheck className="mr-1" /> Activa
            </span>
          )}
          {isPresent && currentPaymentMethod && !hasActiveMensualidad && (
            <span className={styles.currentPaymentBadge}>
              {iconos[getPaymentMethodInfo(currentPaymentMethod).key] || <FaDollarSign />}
            </span>
          )}
        </div>
        
        <div className={styles.paymentButtons}>
          {hasActiveMensualidad ? (
            <>
              <button
                onClick={() => {
                  if (!isPresent) {
                    const mensualidadType = paymentTypes.find(pt => pt.nombre === 'mensualidad');
                    if (mensualidadType) {
                      registerAttendanceWithPayment(atleta.id, mensualidadType.id);
                    } else {
                      console.error('No mensualidadType found in paymentTypes:', paymentTypes);
                      showNotice('error', 'Error: No se encontró el tipo de pago mensualidad en el sistema');
                    }
                  }
                }}
                className={`${styles.presentBtn} ${
                  isPresent ? styles.presentActive : ''
                }`}
                aria-label="Marcar como presente"
                title="Presente"
              >
                <FaCheckCircle />
              </button>
              <button
                onClick={() => {
                  if (isPresent) {
                    removeAttendance(atleta.id);
                  }
                }}
                className={`${styles.paymentMethodBtn} ${
                  !isPresent ? 'border-red-400/40 bg-red-500/20 text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.3)]' : ''
                }`}
                aria-label="Marcar como ausente"
                title="Ausente"
              >
                <FaTimesCircle />
              </button>
            </>
          ) : (
            <>
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
            </>
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
        showNotice('error', 'El reporte existe, pero no se pudo obtener la URL de descarga.');
        return;
      }

      await reportingService.downloadFromSignedUrl(
        signedUrl,
        `reporte-asistencia-${run.period_start || selectedDate}.pdf`
      );
    } catch (error) {
      console.error('Error descargando reporte persistido:', error);
      showNotice('error', `No se pudo descargar el reporte: ${error.message}`);
    } finally {
      setDownloadingRunId(null);
    }
  };

  const deletePersistedRun = async (run) => {
    if (!run?.id) return;

    openConfirmDialog({
      title: 'Eliminar reporte persistido',
      message: `¿Eliminar el reporte persistido del ${formatDateString(run.period_start)}?`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        try {
          setDeletingRunId(run.id);
          await reportingService.deleteRun(run.id);
          await loadReportRuns();
          showNotice('success', 'Reporte persistido eliminado correctamente.');
        } catch (error) {
          console.error('Error eliminando reporte persistido:', error);
          showNotice('error', `No se pudo eliminar el reporte: ${error.message}`);
        } finally {
          setDeletingRunId(null);
        }
      },
    });
  };

  const generateExportDocument = async () => {
    try {
      setIsExporting(true);
      const { exportFecha } = getExportSummary();

      if (!exportFecha) {
        showNotice('error', 'Selecciona una fecha valida para exportar.');
        setIsExporting(false);
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
      showNotice('success', 'Reporte PDF generado y almacenado correctamente.');
    } catch (error) {
      console.error('Error generando reporte persistido de asistencias:', error);
      showNotice('error', `No se pudo generar el PDF: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = calculateStats();
  const exportSummary = getExportSummary();
  const historyDates = Object.keys(asistenciasByDate || {});
  const sortedHistoryDates = [...historyDates].sort((a, b) => {
    const direction = queryState.sort.field === 'fecha' && queryState.sort.direction === SORT_DIRECTION.ASC
      ? 1
      : -1;
    return (new Date(a).getTime() - new Date(b).getTime()) * direction;
  });

  return (
    <div className={styles.asistenciasManager}>
      <SectionHeader
        title="Control de Asistencias"
        subtitle="Registro y seguimiento de entrenamientos"
        icon={<FaCalendarAlt />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {bulkMode && (
              <Button 
                variant="secondary"
                onClick={() => exportAttendance()}
                title="Exportar asistencias del día"
                className="w-full mobile:w-auto"
              >
                <FaFileExport className="mr-1.5" /> Exportar
              </Button>
            )}
            <Button 
              data-guide-id="attendance-bulk-button"
              onClick={() => setBulkMode(!bulkMode)}
              className="w-full mobile:w-auto"
            >
              {bulkMode ? (
                <><FaChartBar className="mr-1.5" /> Ver Reportes</>
              ) : (
                <><FaCheckCircle className="mr-1.5" /> Registro Rápido</>
              )}
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

      {/* Estadisticas por Categoria */}
      <div className="grid gap-4 mobile:grid-cols-2 desktop:grid-cols-4">
        <KpiTile label="Total Registros" value={stats.total} icon={<FaChartBar />} accent="sky" className="h-full" />
        <KpiTile label="Presentes" value={stats.presentes} icon={<FaCheckCircle />} accent="emerald" className="h-full" />
        <KpiTile label="Ausentes" value={stats.ausentes} icon={<FaTimesCircle />} accent="rose" className="h-full" />
        <KpiTile label="Asistencia Promedio" value={`${stats.porcentajeAsistencia}%`} icon={<FaChartLine />} accent="gold" className="h-full" />
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
                className={`${styles.dateInput} rv-dark-date-input`}
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
                  aria-label="Limpiar búsqueda"
                >
                  <FaTimes />
                </button>
              )}
            </div>
            
            <div className={styles.bulkActions}>
              <Button onClick={markAllPresent} className="border-emerald-400/35 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/30">
                <FaCheckCircle className="mr-1.5" /> Todos Presentes
              </Button>
              <Button onClick={clearAllAttendance} className="border-red-400/35 bg-red-500/15 text-red-100 hover:bg-red-500/30">
                <FaTrash className="mr-1.5" /> Limpiar Día
              </Button>
            </div>
          </div>

          {/* Registro por Categorías */}
          <div className={styles.categorySections}>
            <TabNav
              items={categoriasAgrupadas.map(cat => {
                const isActive = selectedCategory === cat.id;
                let label = cat.nombre;
                if (isActive) {
                  const categoryStats = getCategoryStats();
                  label = `${cat.nombre} (${categoryStats.presentes}/${categoryStats.total})`;
                }
                return {
                  id: cat.id,
                  label,
                  icon: cat.icono
                };
              })}
              activeId={selectedCategory}
              onChange={setSelectedCategory}
            />
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
                            .map(atleta => renderAtletaWithPaymentMethods(atleta)
                            )}
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
          <Card className={styles.filtersCard}>
            <div className={styles.filtersSection} role="search" aria-label="Filtros de asistencias">
              <div className={styles.filtersTopGrid}>
                <Field label="Buscar en historial">
                  <input
                    id="attendance-search-filter"
                    type="search"
                    value={queryState.filters.search}
                    onChange={(e) => updateQueryFilter('search', e.target.value)}
                    className={styles.filterInput}
                    placeholder="Nombre, apellido, email o categoria..."
                    aria-label="Buscar asistencias por atleta o categoria"
                  />
                </Field>

                <div className={styles.filterSummary}>
                  <div className={styles.filterSummaryBox}>
                    <p className="font-semibold text-white">Registros mostrados: {asistencias.length}</p>
                    <p className={styles.filterHint}>Filtros activos: {historyActiveFiltersCount}</p>
                  </div>
                </div>
              </div>

              <div className={styles.filtersBottomGrid}>
                <Field label="Desde">
                  <input
                    id="fecha-inicio"
                    type="date"
                    value={queryState.filters.fecha_inicio}
                    onChange={(e) => updateQueryFilter('fecha_inicio', e.target.value)}
                    className={`${styles.filterInput} rv-dark-date-input`}
                  />
                </Field>

                <Field label="Hasta">
                  <input
                    id="fecha-fin"
                    type="date"
                    value={queryState.filters.fecha_fin}
                    onChange={(e) => updateQueryFilter('fecha_fin', e.target.value)}
                    className={`${styles.filterInput} rv-dark-date-input`}
                  />
                </Field>

                <Field label="Categoria">
                  <select
                    id="categoria-filter"
                    value={queryState.filters.categoria}
                    onChange={(e) => updateQueryFilter('categoria', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">Todas las categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {formatCategoria(categoria)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Atleta">
                  <select
                    id="atleta-filter"
                    value={queryState.filters.atleta}
                    onChange={(e) => updateQueryFilter('atleta', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">Todos los atletas</option>
                    {filteredAthleteOptions.map((atleta) => (
                      <option key={atleta.id} value={atleta.id}>
                        {atleta.users?.nombre} {atleta.users?.apellido}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Metodo de pago">
                  <select
                    id="metodo-pago-filter"
                    value={queryState.filters.metodo_pago_id}
                    onChange={(e) => updateQueryFilter('metodo_pago_id', e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="">Todos</option>
                    {paymentTypes.map((paymentType) => (
                      <option key={paymentType.id} value={paymentType.id}>
                        {(paymentType.nombre || '').replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className={styles.filterActions}>
                <Button
                  id="attendance-clear-filters"
                  variant="secondary"
                  className={styles.filterActionButton}
                  onClick={resetHistoryFilters}
                >
                  Limpiar {historyActiveFiltersCount > 0 ? `(${historyActiveFiltersCount})` : ''}
                </Button>

                <Button
                  id="attendance-sort-fecha"
                  variant="outline"
                  className={styles.filterActionButton}
                  onClick={() => toggleHistorySort('fecha')}
                >
                  {queryState.sort.field === 'fecha'
                    ? `Fecha (${queryState.sort.direction})`
                    : 'Ordenar por fecha'}
                </Button>
              </div>
            </div>
          </Card>
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
            <div className="flex min-h-[40dvh] items-center justify-center">
              <LoadingSpinner message="Cargando asistencias..." />
            </div>
          ) : (
            <div className={styles.attendanceTable} data-testid="attendance-history-table">
              <h3><FaCalendarAlt className="mr-2 inline align-middle" /> Historial de Asistencias por Día</h3>
              
              {sortedHistoryDates.length > 0 ? (
                <div className={styles.daysContainer}>
                  {sortedHistoryDates.map(fecha => {
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
                            data-testid="attendance-day-header"
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
                                {isExpanded ? '?' : '?'}
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
                                              <SortableHeader field="atleta" label="Atleta" sort={queryState.sort} onToggleSort={toggleHistorySort} />
                                              <SortableHeader field="metodo_pago" label="Metodo de Pago" sort={queryState.sort} onToggleSort={toggleHistorySort} />
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
                                              <SortableHeader field="atleta" label="Atleta" sort={queryState.sort} onToggleSort={toggleHistorySort} />
                                              <SortableHeader field="metodo_pago" label="Metodo de Pago" sort={queryState.sort} onToggleSort={toggleHistorySort} />
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
                                        <SortableHeader field="atleta" label="Atleta" sort={queryState.sort} onToggleSort={toggleHistorySort} />
                                        <SortableHeader field="metodo_pago" label="Metodo de Pago" sort={queryState.sort} onToggleSort={toggleHistorySort} />
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
                                        <SortableHeader field="atleta" label="Atleta" sort={queryState.sort} onToggleSort={toggleHistorySort} />
                                        <SortableHeader field="categoria" label="Categoria" sort={queryState.sort} onToggleSort={toggleHistorySort} />
                                        <SortableHeader field="metodo_pago" label="Metodo de Pago" sort={queryState.sort} onToggleSort={toggleHistorySort} />
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
                <EmptyState
                  icon={<FaCalendarAlt />}
                  title="No hay registros de asistencia"
                  description="Selecciona un rango de fechas o ajusta los filtros"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        <Modal
          title="Exportar Asistencias"
          icon={<FaPrint />}
          onClose={() => setShowExportModal(false)}
        >
          <div className="space-y-4">
            <div className={styles.exportInfo}>
              <p><strong>Fecha:</strong> {exportSummary.formattedDate}</p>
              <p><strong>Total asistencias:</strong> {exportSummary.totalAttendances}</p>
            </div>

            <Field label="Observaciones (opcional)">
              <textarea
                id="observations"
                className={styles.observationsTextarea}
                placeholder="Escribe aquí cualquier observación que desees incluir en el documento exportado..."
                rows={5}
                value={exportObservations}
                onChange={(e) => setExportObservations(e.target.value)}
              />
            </Field>

            <div className={styles.exportPreview}>
              <h4 className="font-bold text-rv-gold">El documento incluirá:</h4>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Tabla 1: Iniciación (Hombres y Mujeres)</li>
                <li>Tabla 2: Perfeccionamiento Hombres</li>
                <li>Tabla 3: Perfeccionamiento Mujeres</li>
                <li>Resumen general de asistencias</li>
                {exportObservations && <li>Observaciones</li>}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  setShowExportModal(false);
                  setExportObservations('');
                  setDateToExport(null);
                }}
                disabled={isExporting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={generateExportDocument}
                isLoading={isExporting}
                loadingText="Generando PDF..."
              >
                <FaFileExport className="mr-1.5" /> Exportar PDF
              </Button>
            </div>
          </div>
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
            <Button variant="secondary" onClick={closeConfirmDialog} disabled={confirmDialog.isConfirming}>
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.tone === 'danger' ? 'danger' : 'primary'}
              onClick={runConfirmDialogAction}
              isLoading={confirmDialog.isConfirming}
              loadingText="Procesando..."
            >
              {confirmDialog.confirmLabel}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

AsistenciasManager.propTypes = {
  user: PropTypes.object
};

export default AsistenciasManager;









