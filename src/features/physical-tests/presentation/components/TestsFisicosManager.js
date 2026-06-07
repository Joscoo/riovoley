// src/features/physical-tests/presentation/components/TestsFisicosManager.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { physicalTestsService } from '../../physicalTestsService';
import { getPhysicalTestFieldMeta } from '../../domain/physicalTestFieldMetadata';
import { Button, Card, Field } from '../../../../shared/ui';
import { 
  FaEdit, FaPlus, FaClock, FaSave, FaDumbbell, FaTrash, 
  FaUsers, FaCheckCircle, FaExclamationTriangle, FaChartLine,
  FaArrowUp, FaArrowDown, FaEye, FaEyeSlash,
  FaCalendarAlt, FaFilter, FaRulerVertical, FaWeight,
  FaHandPaper, FaRunning, FaFire, FaArrowsAltH,
  FaStickyNote, FaSearch
} from 'react-icons/fa';

const INPUT_BASE =
  'min-h-12 w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-rv-gold focus:outline-none focus:ring-2 focus:ring-rv-gold/30';

const styles = {
  testsFisicosManager: 'mx-auto w-full max-w-7xl space-y-4',
  header: 'flex flex-wrap items-start justify-between gap-3',
  headerLeft: '[&_h2]:text-xl [&_h2]:font-black [&_h2]:text-white mobile:[&_h2]:text-2xl [&_p]:mt-1 [&_p]:text-sm [&_p]:text-slate-200',
  addButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-4 py-2 text-sm font-black uppercase tracking-wide text-rv-dark shadow-rv-gold transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  statsGrid: 'grid gap-3 mobile:grid-cols-2 desktop:grid-cols-4',
  statCard: 'rounded-2xl border border-rv-gold/25 bg-black/35 p-4 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-rv-gold/50',
  statIcon: 'mb-2 inline-flex text-2xl',
  statInfo: '[&_h3]:text-3xl [&_h3]:font-black [&_h3]:text-white [&_p]:mt-1 [&_p]:text-xs [&_p]:font-semibold [&_p]:uppercase [&_p]:tracking-wide [&_p]:text-slate-300',
  pendientesSection: 'rounded-2xl border border-amber-300/35 bg-amber-900/15 p-4 backdrop-blur-md',
  pendientesHeader: 'flex flex-wrap items-center justify-between gap-2 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-white',
  toggleButton: 'inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-amber-300/45 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25',
  categoriaFilters: 'mt-3 flex flex-wrap gap-2 rounded-xl border border-amber-300/20 bg-black/20 p-2',
  categoriaFilterBtn: 'inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-100 transition hover:bg-amber-500/20',
  active: 'border-amber-300/80 bg-amber-500/30 text-white shadow',
  filterCount: 'rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold',
  pendientesCategorias: 'mt-3 space-y-3',
  categoriaGroup: 'rounded-xl border border-amber-300/20 bg-black/20 p-3',
  categoriaTitulo: 'mb-2 flex items-center gap-2 border-b border-amber-300/25 pb-2 text-sm font-black uppercase tracking-wide text-amber-200',
  categoriaCount: 'text-xs font-semibold text-slate-300',
  pendientesGrid: 'grid gap-2 mobile:grid-cols-2 desktop:grid-cols-3',
  pendienteCard: 'flex items-center justify-between gap-2 rounded-xl border border-amber-300/30 bg-black/30 p-3',
  pendienteInfo: '[&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-white',
  quickAddButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-amber-300/45 bg-amber-500/20 text-amber-200 transition hover:bg-amber-500/35',
  filtersCard: 'mb-4',
  filtersSection: 'space-y-4',
  filtersTopGrid: 'grid gap-4 tablet:grid-cols-[2fr_1fr]',
  filtersBottomGrid: 'grid gap-4 mobile:grid-cols-2 desktop:grid-cols-4',
  filtersActions: 'grid gap-4 mobile:grid-cols-2',
  filterSummary: 'flex h-full items-end',
  filterSummaryBox: 'w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-slate-200',
  filterHint: 'text-[11px] text-slate-300',
  searchInput: INPUT_BASE,
  filterSelect: INPUT_BASE,
  filterInput: INPUT_BASE,
  actionButton: 'w-full',
  checkboxLabel: 'inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-slate-100',
  checkbox: 'h-4 w-4 accent-rv-gold',
  loading: 'flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-white',
  spinner: 'h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-rv-gold',
  testsGrid: 'space-y-3',
  pagination: 'flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/20 p-3',
  pageButton: 'min-h-[48px] rounded-xl bg-rv-gold px-4 py-2 text-sm font-bold text-rv-dark transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45',
  pageInfo: 'rounded-full border border-rv-gold/30 bg-black/40 px-3 py-1 text-sm font-semibold text-white',
  noTests: 'rounded-2xl border border-white/15 bg-black/25 p-8 text-center text-slate-200 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-white',
  testCard: 'rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-md',
  testHeader: 'flex flex-wrap items-start justify-between gap-2',
  testHeaderLeft: '[&_h3]:text-lg [&_h3]:font-black [&_h3]:text-white',
  categoria: 'mt-1 inline-flex rounded-full border border-rv-gold/35 bg-rv-gold/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rv-gold',
  testActions: 'flex items-center gap-1',
  editButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/20 text-amber-200 transition hover:bg-amber-500/35',
  deleteButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-red-400/30 bg-red-500/20 text-red-200 transition hover:bg-red-500/35',
  testDate: 'mt-2 inline-flex items-center gap-2 text-xs text-slate-300',
  comparisonBadge: 'mt-2 inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-sky-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-200',
  testInfo: 'mt-3 grid gap-2 mobile:grid-cols-2 desktop:grid-cols-3',
  infoItem: 'rounded-xl border border-white/10 bg-black/20 p-2',
  label: 'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-rv-gold/90',
  valueWithChange: 'mt-1 flex items-center justify-between gap-2',
  value: 'text-sm font-black text-white',
  changeIndicator: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
  improvement: 'bg-emerald-500/20 text-emerald-300',
  regression: 'bg-red-500/20 text-red-300',
  neutral: 'bg-white/10 text-slate-200',
  observacionesSection: 'mobile:col-span-2 desktop:col-span-3 rounded-xl border border-white/10 bg-black/20 p-2',
  observaciones: 'mt-1 text-sm text-slate-200',
  modalOverlay: 'fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm',
  modal: 'max-h-[92dvh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-rv-gold/25 bg-slate-950/95 p-4 text-white shadow-2xl mobile:p-6',
  modalHeader: 'mb-4 flex items-start justify-between gap-3 border-b border-white/15 pb-3 [&_h3]:text-lg [&_h3]:font-black',
  closeButton: 'inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  form: 'space-y-4',
  formSection: 'rounded-2xl border border-white/15 bg-black/25 p-4',
  sectionTitle: 'mb-3 inline-flex items-center gap-2 text-base font-black text-white',
  formGrid: 'grid gap-3 tablet:grid-cols-2',
  inputGroup: 'space-y-1 [&_label]:text-xs [&_label]:font-bold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-rv-gold/90 [&_input]:min-h-[48px] [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-white/20 [&_input]:bg-black/30 [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-slate-400 [&_input]:focus:border-rv-gold [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-rv-gold/70 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-white/20 [&_textarea]:bg-black/30 [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:text-white [&_textarea]:placeholder:text-slate-400 [&_textarea]:focus:border-rv-gold [&_textarea]:focus:outline-none [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-rv-gold/70',
  inputHint: 'text-xs text-slate-300',
  searchableSelect: 'relative',
  dropdownList: 'absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-white/20 bg-slate-950/95 shadow-2xl',
  dropdownItem: 'w-full border-b border-white/10 px-3 py-2 text-left transition last:border-0 hover:bg-rv-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80',
  selected: 'bg-rv-gold/20',
  atletaName: 'text-sm font-semibold text-white',
  atletaCategoria: 'text-[11px] uppercase tracking-wide text-slate-300',
  dropdownEmpty: 'px-3 py-2 text-sm text-slate-300',
  clearButton: 'absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20',
  textarea: '',
  formActions: 'flex flex-wrap justify-end gap-2 pt-2',
  cancelButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20',
  saveButton: 'inline-flex min-h-[48px] items-center justify-center rounded-xl bg-rv-gold px-4 py-2 text-sm font-black text-rv-dark shadow-rv-gold transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60'
};

const TestsFisicosManager = ({ user }) => {
  const fieldMeta = {
    estatura: getPhysicalTestFieldMeta('estatura'),
    peso: getPhysicalTestFieldMeta('peso'),
    envergadura: getPhysicalTestFieldMeta('envergadura_brazos_extendidos_lateral'),
    alcanceDePie: getPhysicalTestFieldMeta('brazo_extend_inicial'),
    saltoEstatico: getPhysicalTestFieldMeta('brazo_extend_sin_impulso'),
    saltoConCarrera: getPhysicalTestFieldMeta('brazo_extend_con_impulso'),
    saltoLargo: getPhysicalTestFieldMeta('fuerza_explosiva_salto_largo'),
    abdominales: getPhysicalTestFieldMeta('fuerza_abdomen'),
    flexiones: getPhysicalTestFieldMeta('fuerza_brazos'),
    sentadillas: getPhysicalTestFieldMeta('fuerza_piernas'),
    dominadas: getPhysicalTestFieldMeta('elevaciones_barra'),
    observaciones: getPhysicalTestFieldMeta('observaciones'),
  };
  const buildDefaultFormData = () => physicalTestsService.buildInitialForm();
  const defaultFilters = {
    atletaId: '',
    fechaDesde: '',
    fechaHasta: '',
    search: '',
    onlyPending: false,
    sortField: 'fecha_test',
    sortDirection: 'desc',
  };
  const [tests, setTests] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchableSelectRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAtletasList, setShowAtletasList] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);

  const [stats, setStats] = useState({
    totalAtletas: 0,
    conTestEsteMes: 0,
    sinTestEsteMes: 0,
    promedioTestsPorAtleta: 0
  });

  const [atletasPendientes, setAtletasPendientes] = useState([]);
  const [atletasPendientesPorCategoria, setAtletasPendientesPorCategoria] = useState({});
  const [showPendientes, setShowPendientes] = useState(false);
  const [categoriaSeleccionadaPendientes, setCategoriaSeleccionadaPendientes] = useState('todas');

  const [formData, setFormData] = useState(() => buildDefaultFormData());

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(tests.length / PAGE_SIZE));
  const paginatedTests = tests.slice((currentPage - 1) * PAGE_SIZE, (currentPage - 1) * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    loadAtletas();
    loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (atletas.length > 0) {
      const summary = physicalTestsService.calculateStats({ athletes: atletas, tests });
      setStats(summary.stats);
      setAtletasPendientes(summary.pendingAthletes);
      setAtletasPendientesPorCategoria(summary.pendingByCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atletas, tests]);


  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchableSelectRef.current && !searchableSelectRef.current.contains(event.target)) {
        setShowAtletasList(false);
      }
    };

    if (showAtletasList) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAtletasList]);

  const loadAtletas = async () => {
    try {
      const atletasWithNames = await physicalTestsService.loadAtletas();
      setAtletas(atletasWithNames);
    } catch (error) {
      console.error('Error cargando atletas:', error);
      alert('Error al cargar atletas: ' + error.message);
    }
  };

  const loadTests = async () => {
    setLoading(true);
    try {
      const filteredData = await physicalTestsService.loadTests({ filters });
      setTests(filteredData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error cargando tests fisicos:', error);
      alert('Error al cargar los tests fisicos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const activeFiltersCount = [
    filters.search,
    filters.atletaId,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.onlyPending,
    filters.sortField !== defaultFilters.sortField,
    filters.sortDirection !== defaultFilters.sortDirection,
  ].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const validation = physicalTestsService.validateTestForm({
        formData,
        athletes: atletas,
      });

      if (!validation.ok) {
        alert(validation.errorMessage);
        return;
      }
      
      if (editingTest) {
        await updateTest();
      } else {
        await createTest();
      }
      
      setShowModal(false);
      resetForm();
      loadTests();
    } catch (error) {
      console.error('Error guardando test físico:', error);
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const createTest = async () => {
    await physicalTestsService.createTest({ formData });
    alert('Test fisico registrado correctamente');
  };

  const updateTest = async () => {
    const data = await physicalTestsService.updateTest({
      testId: editingTest.id,
      formData
    });
    console.log('Actualizacion exitosa:', data);

    alert('Test fisico actualizado correctamente');
  };

  const deleteTest = async (test) => {
    const confirmDelete = globalThis.confirm(
      `Estas seguro de eliminar el test fisico de ${test.atleta_name}?`
    );
    if (!confirmDelete) {
      return;
    }

    try {
      await physicalTestsService.deleteTest({ testId: test.id });
      loadTests();
      alert('Test fisico eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando test fisico:', error);
      alert('Error: ' + error.message);
    }
  };

  const openModal = (test = null) => {
    if (test) {
      setEditingTest(test);
      setFormData(physicalTestsService.buildFormFromTest({ test }));
      // Establecer el nombre del atleta en el campo de búsqueda al editar
      if (test.student_id) {
        const atleta = atletas.find(a => a.id === test.student_id);
        if (atleta) {
          setSearchTerm(`${atleta.full_name} (${atleta.categoria?.replaceAll('_', ' ').toUpperCase()})`);
        }
      }
    } else {
      setEditingTest(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData(buildDefaultFormData());
    setSearchTerm('');
    setShowAtletasList(false);
  };

  // Filtrar atletas por término de búsqueda
  const filteredAtletas = atletas.filter(atleta => 
    atleta.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    atleta.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener el nombre del atleta seleccionado
  const getSelectedAtletaName = () => {
    const selected = atletas.find(a => a.id === formData.student_id);
    return selected ? `${selected.full_name} (${selected.categoria?.replaceAll('_', ' ').toUpperCase()})` : '';
  };

  // Seleccionar un atleta
  const selectAtleta = (atleta) => {
    setFormData({...formData, student_id: atleta.id});
    setSearchTerm(`${atleta.full_name} (${atleta.categoria?.replaceAll('_', ' ').toUpperCase()})`);
    setShowAtletasList(false);
  };

  // Obtener test anterior de un atleta para comparación
  const getPreviousTest = (currentTest) => {
    const atletaTests = tests
      .filter(t => t.student_id === currentTest.student_id && t.id !== currentTest.id)
      .sort((a, b) => new Date(b.fecha_test) - new Date(a.fecha_test));
    
    return atletaTests[0] || null;
  };


  // Calcular diferencia y tipo de cambio
  const calculateChange = (current, previous) => {
    if (!previous || !current) return { value: 0, type: 'neutral' };
    
    const diff = current - previous;
    const percentage = previous === 0 ? 0 : ((diff / previous) * 100).toFixed(1);
    
    let changeType = 'neutral';
    if (diff > 0) {
      changeType = 'improvement';
    } else if (diff < 0) {
      changeType = 'regression';
    }
    
    return {
      value: diff,
      percentage: percentage,
      type: changeType
    };
  };

  // Renderizar indicador de cambio
  const renderChangeIndicator = (change) => {
    if (!change || change.type === 'neutral') return null;
    
    const isImprovement = change.type === 'improvement';
    return (
      <span className={`${styles.changeIndicator} ${styles[change.type]}`}>
        {isImprovement ? <FaArrowUp /> : <FaArrowDown />}
        {Math.abs(change.value).toFixed(2)}
      </span>
    );
  };

  const renderedTests = paginatedTests.map(test => {
    const previousTest = getPreviousTest(test);
    const hasComparison = previousTest !== null;

    return (
      <div key={test.id} className={styles.testCard}>
        <div className={styles.testHeader}>
          <div className={styles.testHeaderLeft}>
            <h3>{test.atleta_name}</h3>
            <span className={styles.categoria}>{test.students?.categoria?.replaceAll('_', ' ').toUpperCase()}</span>
          </div>
          <div className={styles.testActions}>
            <button onClick={() => openModal(test)} className={styles.editButton} title="Editar"><FaEdit /></button>
            <button onClick={() => deleteTest(test)} className={styles.deleteButton} title="Eliminar"><FaTrash /></button>
          </div>
        </div>

        <div className={styles.testDate}>
          <FaCalendarAlt />
          <span>{new Date(test.fecha_test).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>

        {hasComparison && (
          <div className={styles.comparisonBadge}><FaChartLine /> Con datos de comparación</div>
        )}

        <div className={styles.testInfo}>
          {test.estatura != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaRulerVertical /> {fieldMeta.estatura.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.estatura}m</span>
                {hasComparison && previousTest.estatura != null && renderChangeIndicator(calculateChange(test.estatura, previousTest.estatura))}
              </div>
            </div>
          )}

          {test.peso != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaWeight /> {fieldMeta.peso.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.peso}kg</span>
                {hasComparison && previousTest.peso != null && renderChangeIndicator(calculateChange(test.peso, previousTest.peso))}
              </div>
            </div>
          )}

          {test.envergadura_brazos_extendidos_lateral != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaArrowsAltH /> {fieldMeta.envergadura.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.envergadura_brazos_extendidos_lateral}cm</span>
                {hasComparison && previousTest.envergadura_brazos_extendidos_lateral != null && renderChangeIndicator(calculateChange(test.envergadura_brazos_extendidos_lateral, previousTest.envergadura_brazos_extendidos_lateral))}
              </div>
            </div>
          )}

          {test.brazo_extend_inicial != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaHandPaper /> {fieldMeta.alcanceDePie.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.brazo_extend_inicial}cm</span>
                {hasComparison && previousTest.brazo_extend_inicial != null && renderChangeIndicator(calculateChange(test.brazo_extend_inicial, previousTest.brazo_extend_inicial))}
              </div>
            </div>
          )}

          {test.brazo_extend_sin_impulso != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaHandPaper /> {fieldMeta.saltoEstatico.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.brazo_extend_sin_impulso}cm</span>
                {hasComparison && previousTest.brazo_extend_sin_impulso != null && renderChangeIndicator(calculateChange(test.brazo_extend_sin_impulso, previousTest.brazo_extend_sin_impulso))}
              </div>
            </div>
          )}

          {test.brazo_extend_con_impulso != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaHandPaper /> {fieldMeta.saltoConCarrera.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.brazo_extend_con_impulso}cm</span>
                {hasComparison && previousTest.brazo_extend_con_impulso != null && renderChangeIndicator(calculateChange(test.brazo_extend_con_impulso, previousTest.brazo_extend_con_impulso))}
              </div>
            </div>
          )}

          {test.fuerza_explosiva_salto_largo != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaRunning /> {fieldMeta.saltoLargo.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.fuerza_explosiva_salto_largo}m</span>
                {hasComparison && previousTest.fuerza_explosiva_salto_largo != null && renderChangeIndicator(calculateChange(test.fuerza_explosiva_salto_largo, previousTest.fuerza_explosiva_salto_largo))}
              </div>
            </div>
          )}

          {test.fuerza_abdomen != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaFire /> {fieldMeta.abdominales.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.fuerza_abdomen} reps</span>
                {hasComparison && previousTest.fuerza_abdomen != null && renderChangeIndicator(calculateChange(test.fuerza_abdomen, previousTest.fuerza_abdomen))}
              </div>
            </div>
          )}

          {test.fuerza_brazos != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaDumbbell /> {fieldMeta.flexiones.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.fuerza_brazos} reps</span>
                {hasComparison && previousTest.fuerza_brazos != null && renderChangeIndicator(calculateChange(test.fuerza_brazos, previousTest.fuerza_brazos))}
              </div>
            </div>
          )}

          {test.fuerza_piernas != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaRunning /> {fieldMeta.sentadillas.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.fuerza_piernas} reps</span>
                {hasComparison && previousTest.fuerza_piernas != null && renderChangeIndicator(calculateChange(test.fuerza_piernas, previousTest.fuerza_piernas))}
              </div>
            </div>
          )}

          {test.elevaciones_barra != null && (
            <div className={styles.infoItem}>
              <span className={styles.label}><FaArrowsAltH /> {fieldMeta.dominadas.shortLabel}:</span>
              <div className={styles.valueWithChange}>
                <span className={styles.value}>{test.elevaciones_barra} reps</span>
                {hasComparison && previousTest.elevaciones_barra != null && renderChangeIndicator(calculateChange(test.elevaciones_barra, previousTest.elevaciones_barra))}
              </div>
            </div>
          )}

          {test.observaciones && (
            <div className={styles.observacionesSection}>
              <span className={styles.label}><FaStickyNote /> {fieldMeta.observaciones.label}:</span>
              <p className={styles.observaciones}>{test.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    );
  });

  return (
    <div className={styles.testsFisicosManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaDumbbell className="mr-2.5 inline align-middle" /> Gestión de Tests Físicos</h2>
          <p>Registrar y seguir el rendimiento físico de los atletas</p>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => openModal()}
        >
          <FaPlus className="mr-2 inline align-middle" /> Nuevo Test Físico
        </button>
      </div>

      {/* Estadísticas Generales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} text-blue-500`}>
            <FaUsers />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalAtletas}</h3>
            <p>Total Estudiantes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} text-emerald-500`}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.conTestEsteMes}</h3>
            <p>Con Test Este Mes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} text-amber-500`}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.sinTestEsteMes}</h3>
            <p>Sin Test Este Mes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} text-violet-500`}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.promedioTestsPorAtleta}</h3>
            <p>Tests Promedio/Estudiante</p>
          </div>
        </div>
      </div>

      {/* Sección de Atletas Pendientes */}
      {atletasPendientes.length > 0 && (
        <div className={styles.pendientesSection}>
          <div className={styles.pendientesHeader}>
            <h3>
              <FaExclamationTriangle className="mr-2.5 text-amber-500" />
              Estudiantes Sin Test Este Mes ({atletasPendientes.length})
            </h3>
            <button 
              className={styles.toggleButton}
              onClick={() => setShowPendientes(!showPendientes)}
            >
              {showPendientes ? <FaEyeSlash /> : <FaEye />}
              {showPendientes ? ' Ocultar' : ' Ver Detalles'}
            </button>
          </div>
          
          {showPendientes && (
            <>
              {/* Botones de filtro por categoría */}
              <div className={styles.categoriaFilters}>
                <button
                  className={`${styles.categoriaFilterBtn} ${categoriaSeleccionadaPendientes === 'todas' ? styles.active : ''}`}
                  onClick={() => setCategoriaSeleccionadaPendientes('todas')}
                >
                  <FaUsers /> Todas ({atletasPendientes.length})
                </button>
                {Object.keys(atletasPendientesPorCategoria).sort().map(categoria => (
                  <button
                    key={categoria}
                    className={`${styles.categoriaFilterBtn} ${categoriaSeleccionadaPendientes === categoria ? styles.active : ''}`}
                    onClick={() => setCategoriaSeleccionadaPendientes(categoria)}
                  >
                    {categoria.replaceAll('_', ' ').toUpperCase()}
                    <span className={styles.filterCount}>
                      ({atletasPendientesPorCategoria[categoria].length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Contenido filtrado por categoría */}
              <div className={styles.pendientesCategorias}>
                {categoriaSeleccionadaPendientes === 'todas' ? (
                  // Mostrar todas las categorías
                  Object.keys(atletasPendientesPorCategoria).sort().map(categoria => (
                    <div key={categoria} className={styles.categoriaGroup}>
                      <h4 className={styles.categoriaTitulo}>
                        {categoria.replaceAll('_', ' ').toUpperCase()}
                        <span className={styles.categoriaCount}>
                          ({atletasPendientesPorCategoria[categoria].length})
                        </span>
                      </h4>
                      <div className={styles.pendientesGrid}>
                        {atletasPendientesPorCategoria[categoria].map(atleta => (
                          <div key={atleta.id} className={styles.pendienteCard}>
                            <div className={styles.pendienteInfo}>
                              <h4>{atleta.full_name}</h4>
                            </div>
                            <button
                              className={styles.quickAddButton}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  student_id: atleta.id
                                });
                                setSearchTerm(`${atleta.full_name} (${atleta.categoria?.replaceAll('_', ' ').toUpperCase()})`);
                                openModal();
                              }}
                              title="Agregar test físico"
                            >
                              <FaPlus />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Mostrar solo la categoría seleccionada
                  atletasPendientesPorCategoria[categoriaSeleccionadaPendientes] && (
                    <div className={styles.categoriaGroup}>
                      <div className={styles.pendientesGrid}>
                        {atletasPendientesPorCategoria[categoriaSeleccionadaPendientes].map(atleta => (
                          <div key={atleta.id} className={styles.pendienteCard}>
                            <div className={styles.pendienteInfo}>
                              <h4>{atleta.full_name}</h4>
                            </div>
                            <button
                              className={styles.quickAddButton}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  student_id: atleta.id
                                });
                                setSearchTerm(`${atleta.full_name} (${atleta.categoria?.replaceAll('_', ' ').toUpperCase()})`);
                                openModal();
                              }}
                              title="Agregar test físico"
                            >
                              <FaPlus />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Filtros */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersSection} role="search" aria-label="Filtros de tests fisicos">
          <div className={styles.filtersTopGrid}>
            <Field label="Buscar Estudiante" icon={<FaSearch />}>
              <input
                id="search-tests"
                type="text"
                placeholder="Buscar por nombre de atleta..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className={styles.searchInput}
                autoComplete="off"
              />
            </Field>

            <div className={styles.filterSummary}>
              <div className={styles.filterSummaryBox}>
                <p className="font-semibold text-white">Resultados: {tests.length} tests</p>
                <p className={styles.filterHint}>Filtros activos: {activeFiltersCount}</p>
              </div>
            </div>
          </div>

          <div className={styles.filtersBottomGrid}>
            <Field label="Atleta" icon={<FaFilter />}>
              <select
                id="physical-tests-athlete-filter"
                value={filters.atletaId}
                onChange={(e) => updateFilter('atletaId', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Todos los atletas</option>
                {atletas.map((atleta) => (
                  <option key={atleta.id} value={atleta.id}>
                    {atleta.full_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Desde" icon={<FaCalendarAlt />}>
              <input
                id="physical-tests-start-date"
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => updateFilter('fechaDesde', e.target.value)}
                className={`${styles.filterInput} rv-dark-date-input`}
              />
            </Field>

            <Field label="Hasta" icon={<FaCalendarAlt />}>
              <input
                id="physical-tests-end-date"
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => updateFilter('fechaHasta', e.target.value)}
                className={`${styles.filterInput} rv-dark-date-input`}
              />
            </Field>

            <Field label="Ordenar por">
              <select
                id="physical-tests-sort-field"
                value={filters.sortField}
                onChange={(e) => updateFilter('sortField', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="fecha_test">Fecha test</option>
                <option value="estatura">Estatura</option>
                <option value="peso">Peso</option>
                <option value="fuerza_abdomen">Fuerza abdomen</option>
              </select>
            </Field>

            <Field label="Direccion">
              <select
                id="physical-tests-sort-direction"
                value={filters.sortDirection}
                onChange={(e) => updateFilter('sortDirection', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </Field>

            <Field label="Estado">
              <label className={styles.checkboxLabel}>
                <input
                  id="physical-tests-only-pending"
                  type="checkbox"
                  checked={filters.onlyPending}
                  onChange={(e) => updateFilter('onlyPending', e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Solo sin test este mes</span>
              </label>
            </Field>
          </div>

          <div className={styles.filtersActions}>
            <Button
              id="physical-tests-clear-filters"
              type="button"
              variant="secondary"
              className={styles.actionButton}
              onClick={resetFilters}
            >
              Limpiar filtros {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Tests Físicos */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando tests físicos...</p>
        </div>
      ) : (
        <div className={styles.testsGrid}>
          {tests.length > 0 ? (
            <>
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageButton}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>Página {currentPage} de {totalPages}</span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageButton}
                >
                  Siguiente
                </button>
              </div>

              {renderedTests}

              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={styles.pageButton}
                >
                  Anterior
                </button>

                <span className={styles.pageInfo}>Página {currentPage} de {totalPages}</span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={styles.pageButton}
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noTests}>
              <h3><FaDumbbell className="mr-2 inline align-middle" /> No hay tests físicos registrados</h3>
              <p>Registra el primer test físico para comenzar el seguimiento</p>
            </div>
          )}
        </div>
      )}

      {/* Modal para Agregar/Editar */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>
                {editingTest ? (
                  <><FaEdit className="mr-2 inline align-middle" /> Editar Test Físico</>
                ) : (
                  <><FaPlus className="mr-2 inline align-middle" /> Nuevo Test Físico</>
                )}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Información General */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaCalendarAlt /> Información General</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="student_search">Estudiante *</label>
                    <div className={styles.searchableSelect} ref={searchableSelectRef}>
                      <input
                        id="student_search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowAtletasList(true);
                          // Limpiar selección si el usuario modifica el texto
                          if (getSelectedAtletaName() !== e.target.value) {
                            setFormData({...formData, student_id: ''});
                          }
                        }}
                        onFocus={() => setShowAtletasList(true)}
                        placeholder="Buscar atleta por nombre o categoría..."
                        required={!formData.student_id}
                        className={styles.searchInput}
                        autoComplete="off"
                      />
                      {showAtletasList && searchTerm && (
                        <div className={styles.dropdownList}>
                          {filteredAtletas.length > 0 ? (
                            filteredAtletas.map(atleta => (
                              <button
                                key={atleta.id}
                                type="button"
                                className={`${styles.dropdownItem} ${formData.student_id === atleta.id ? styles.selected : ''}`}
                                onClick={() => selectAtleta(atleta)}
                              >
                                <div className={styles.atletaName}>{atleta.full_name}</div>
                                <div className={styles.atletaCategoria}>
                                  {atleta.categoria?.replaceAll('_', ' ').toUpperCase()}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className={styles.dropdownEmpty}>
                              No se encontraron atletas
                            </div>
                          )}
                        </div>
                      )}
                      {formData.student_id && (
                        <button
                          type="button"
                          className={styles.clearButton}
                          onClick={() => {
                            setFormData({...formData, student_id: ''});
                            setSearchTerm('');
                            setShowAtletasList(false);
                          }}
                          title="Limpiar selección"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="fecha_test">Fecha del Test *</label>
                    <input
                      id="fecha_test"
                      type="date"
                      value={formData.fecha_test}
                      onChange={(e) => setFormData({...formData, fecha_test: e.target.value})}
                      className="rv-dark-date-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Mediciones Corporales */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaRulerVertical /> Mediciones Corporales</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="estatura">{fieldMeta.estatura.unitLabel}</label>
                    <input
                      id="estatura"
                      type="number"
                      step="0.01"
                      min="1.00"
                      max="2.50"
                      value={formData.estatura}
                      onChange={(e) => setFormData({...formData, estatura: e.target.value})}
                      placeholder="1.75"
                    />
                    <p className={styles.inputHint}>{fieldMeta.estatura.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="peso">{fieldMeta.peso.unitLabel}</label>
                    <input
                      id="peso"
                      type="number"
                      step="0.1"
                      min="30"
                      max="200"
                      value={formData.peso}
                      onChange={(e) => setFormData({...formData, peso: e.target.value})}
                      placeholder="70.5"
                    />
                    <p className={styles.inputHint}>{fieldMeta.peso.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="envergadura">{fieldMeta.envergadura.unitLabel}</label>
                    <input
                      id="envergadura"
                      type="number"
                      step="0.1"
                      min="100"
                      max="300"
                      value={formData.envergadura_brazos_extendidos_lateral}
                      onChange={(e) => setFormData({...formData, envergadura_brazos_extendidos_lateral: e.target.value})}
                      placeholder="180.0"
                    />
                    <p className={styles.inputHint}>{fieldMeta.envergadura.description}</p>
                  </div>
                </div>
              </div>

              {/* Tests de Fuerza */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaDumbbell /> Tests de Fuerza y Explosividad</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="brazo_inicial">{fieldMeta.alcanceDePie.unitLabel}</label>
                    <input
                      id="brazo_inicial"
                      type="number"
                      step="0.1"
                      min="0"
                      max="500"
                      value={formData.brazo_extend_inicial}
                      onChange={(e) => setFormData({...formData, brazo_extend_inicial: e.target.value})}
                      placeholder="25.0"
                    />
                    <p className={styles.inputHint}>{fieldMeta.alcanceDePie.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="brazo_sin_impulso">{fieldMeta.saltoEstatico.unitLabel}</label>
                    <input
                      id="brazo_sin_impulso"
                      type="number"
                      step="0.1"
                      min="0"
                      max="500"
                      value={formData.brazo_extend_sin_impulso}
                      onChange={(e) => setFormData({...formData, brazo_extend_sin_impulso: e.target.value})}
                      placeholder="30.0"
                    />
                    <p className={styles.inputHint}>{fieldMeta.saltoEstatico.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="brazo_con_impulso">{fieldMeta.saltoConCarrera.unitLabel}</label>
                    <input
                      id="brazo_con_impulso"
                      type="number"
                      step="0.1"
                      min="0"
                      max="500"
                      value={formData.brazo_extend_con_impulso}
                      onChange={(e) => setFormData({...formData, brazo_extend_con_impulso: e.target.value})}
                      placeholder="35.0"
                    />
                    <p className={styles.inputHint}>{fieldMeta.saltoConCarrera.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="salto_largo">{fieldMeta.saltoLargo.unitLabel}</label>
                    <input
                      id="salto_largo"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.fuerza_explosiva_salto_largo}
                      onChange={(e) => setFormData({...formData, fuerza_explosiva_salto_largo: e.target.value})}
                      placeholder="2.50"
                    />
                    <p className={styles.inputHint}>{fieldMeta.saltoLargo.description}</p>
                  </div>
                </div>
              </div>

              {/* Pruebas de Fuerza Muscular */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaFire /> Fuerza Muscular (repeticiones por minuto)</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="fuerza_abdomen">{fieldMeta.abdominales.unitLabel}</label>
                    <input
                      id="fuerza_abdomen"
                      type="number"
                      min="0"
                      max="200"
                      value={formData.fuerza_abdomen}
                      onChange={(e) => setFormData({...formData, fuerza_abdomen: e.target.value})}
                      placeholder="50"
                    />
                    <p className={styles.inputHint}>{fieldMeta.abdominales.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="fuerza_brazos">{fieldMeta.flexiones.unitLabel}</label>
                    <input
                      id="fuerza_brazos"
                      type="number"
                      min="0"
                      max="200"
                      value={formData.fuerza_brazos}
                      onChange={(e) => setFormData({...formData, fuerza_brazos: e.target.value})}
                      placeholder="30"
                    />
                    <p className={styles.inputHint}>{fieldMeta.flexiones.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="fuerza_piernas">{fieldMeta.sentadillas.unitLabel}</label>
                    <input
                      id="fuerza_piernas"
                      type="number"
                      min="0"
                      max="300"
                      value={formData.fuerza_piernas}
                      onChange={(e) => setFormData({...formData, fuerza_piernas: e.target.value})}
                      placeholder="40"
                    />
                    <p className={styles.inputHint}>{fieldMeta.sentadillas.description}</p>
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="elevaciones_barra">{fieldMeta.dominadas.unitLabel}</label>
                    <input
                      id="elevaciones_barra"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.elevaciones_barra}
                      onChange={(e) => setFormData({...formData, elevaciones_barra: e.target.value})}
                      placeholder="10"
                    />
                    <p className={styles.inputHint}>{fieldMeta.dominadas.description}</p>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaStickyNote /> {fieldMeta.observaciones.label}</h4>
                <div className={styles.inputGroup}>
                  <label htmlFor="observaciones">{fieldMeta.observaciones.label}</label>
                  <textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Ingrese observaciones sobre el rendimiento, tecnica, recomendaciones, etc..."
                    rows={4}
                    className={styles.textarea}
                  />
                  <p className={styles.inputHint}>{fieldMeta.observaciones.description}</p>
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {(() => {
                    if (saving) return (
                      <><FaClock className="mr-2 inline align-middle" /> Guardando...</>
                    );
                    return editingTest ? (
                      <><FaEdit className="mr-2 inline align-middle" /> Actualizar Test</>
                    ) : (
                      <><FaSave className="mr-2 inline align-middle" /> Guardar Test</>
                    );
                  })()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

TestsFisicosManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string
  }).isRequired
};

export default TestsFisicosManager;


