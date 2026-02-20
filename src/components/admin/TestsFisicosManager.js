// src/components/admin/TestsFisicosManager.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import { getEcuadorDate } from '../../utils/dateUtils';
import styles from '../../styles/TestsFisicosManager.module.css';
import { 
  FaEdit, FaPlus, FaClock, FaSave, FaDumbbell, FaTrash, 
  FaUsers, FaCheckCircle, FaExclamationTriangle, FaChartLine,
  FaArrowUp, FaArrowDown, FaEye, FaEyeSlash,
  FaCalendarAlt, FaFilter, FaRulerVertical, FaWeight,
  FaHandPaper, FaRunning, FaFire, FaArrowsAltH,
  FaStickyNote, FaSearch
} from 'react-icons/fa';

const TestsFisicosManager = ({ user }) => {
  const [tests, setTests] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchableSelectRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAtletasList, setShowAtletasList] = useState(false);
  const [filters, setFilters] = useState({
    atletaId: '',
    fechaDesde: '',
    fechaHasta: '',
    search: '',
    onlyPending: false  // Nueva: mostrar solo atletas sin test este mes
  });

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

  const [formData, setFormData] = useState({
    student_id: '',
    estatura: '',
    peso: '',
    brazo_extend_inicial: '',
    brazo_extend_sin_impulso: '',
    brazo_extend_con_impulso: '',
    fuerza_explosiva_salto_largo: '',
    envergadura_brazos_extendidos_lateral: '',
    fuerza_abdomen: '',
    fuerza_brazos: '',
    fuerza_piernas: '',
    elevaciones_barra: '',
    observaciones: '',
    fecha_test: getEcuadorDate()
  });

  useEffect(() => {
    loadAtletas();
    loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (atletas.length > 0) {
      calculateStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atletas, tests]);

  // Función para calcular estadísticas
  const calculateStats = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Atletas con test este mes
    const atletasConTestEsteMes = new Set();
    tests.forEach(test => {
      const testDate = new Date(test.fecha_test);
      if (testDate >= firstDayOfMonth && testDate <= lastDayOfMonth) {
        atletasConTestEsteMes.add(test.student_id);
      }
    });

    // Atletas sin test este mes
    const atletasSinTest = atletas.filter(atleta => 
      !atletasConTestEsteMes.has(atleta.id)
    );

    // Promedio de tests por atleta
    const testsPorAtleta = {};
    tests.forEach(test => {
      if (!testsPorAtleta[test.student_id]) {
        testsPorAtleta[test.student_id] = 0;
      }
      testsPorAtleta[test.student_id]++;
    });

    const totalTests = Object.values(testsPorAtleta).reduce((sum, count) => sum + count, 0);
    const promedio = atletas.length > 0 ? (totalTests / atletas.length).toFixed(1) : 0;

    setStats({
      totalAtletas: atletas.length,
      conTestEsteMes: atletasConTestEsteMes.size,
      sinTestEsteMes: atletasSinTest.length,
      promedioTestsPorAtleta: promedio
    });

    setAtletasPendientes(atletasSinTest);

    // Agrupar atletas pendientes por categoría
    const porCategoria = {};
    atletasSinTest.forEach(atleta => {
      const categoria = atleta.categoria || 'sin_categoria';
      if (!porCategoria[categoria]) {
        porCategoria[categoria] = [];
      }
      porCategoria[categoria].push(atleta);
    });
    setAtletasPendientesPorCategoria(porCategoria);
  };

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
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          users!inner(
            id,
            nombre,
            apellido
          )
        `);

      if (studentsError) throw studentsError;

      const atletasWithNames = studentsData.map(student => ({
        ...student,
        full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim()
      }));

      setAtletas(atletasWithNames);
    } catch (error) {
      console.error('Error cargando atletas:', error);
      alert('Error al cargar atletas: ' + error.message);
    }
  };

  const loadTests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('physical_tests')
        .select(`
          *,
          students!inner(
            id,
            categoria,
            users!inner(
              nombre,
              apellido
            )
          )
        `)
        .order('fecha_test', { ascending: false });

      // Aplicar filtros
      if (filters.atletaId) {
        query = query.eq('student_id', filters.atletaId);
      }

      if (filters.fechaDesde) {
        query = query.gte('fecha_test', filters.fechaDesde);
      }

      if (filters.fechaHasta) {
        query = query.lte('fecha_test', filters.fechaHasta);
      }

      const { data: testsData, error: testsError } = await query;

      if (testsError) throw testsError;

      // Procesar datos de tests
      const testsWithAtletaNames = testsData.map(test => ({
        ...test,
        atleta_name: `${test.students?.users?.nombre || ''} ${test.students?.users?.apellido || ''}`.trim()
      }));

      // Filtrar por búsqueda local si hay término
      let filteredData = testsWithAtletaNames || [];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(test => 
          test.atleta_name?.toLowerCase().includes(searchLower) ||
          test.observaciones?.toLowerCase().includes(searchLower)
        );
      }

      setTests(filteredData);
    } catch (error) {
      console.error('Error cargando tests físicos:', error);
      alert('Error al cargar los tests físicos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Validaciones básicas
      if (!formData.student_id) {
        alert('Error: Debe seleccionar un atleta');
        return;
      }
      
      if (!formData.fecha_test) {
        alert('Error: La fecha del test es requerida');
        return;
      }

      // Validar fecha no futura
      const fechaTest = new Date(formData.fecha_test);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      
      if (fechaTest > hoy) {
        alert('Error: La fecha del test no puede ser futura');
        return;
      }

      // Validar que al menos un campo de medición esté completo
      const mediciones = [
        formData.estatura, formData.peso, formData.brazo_extend_inicial,
        formData.brazo_extend_sin_impulso, formData.brazo_extend_con_impulso,
        formData.fuerza_explosiva_salto_largo, formData.envergadura_brazos_extendidos_lateral
      ];

      if (!mediciones.some(medicion => medicion && String(medicion).trim() !== '')) {
        alert('Error: Debe ingresar al menos una medición física');
        return;
      }

      // Validaciones específicas de rangos
      if (formData.estatura && (Number.parseFloat(formData.estatura) < 0.5 || Number.parseFloat(formData.estatura) > 3)) {
        alert('Error: La estatura debe estar entre 0.5m y 3.0m');
        return;
      }

      if (formData.peso && (Number.parseFloat(formData.peso) < 20 || Number.parseFloat(formData.peso) > 300)) {
        alert('Error: El peso debe estar entre 20kg y 300kg');
        return;
      }

      if (formData.fuerza_explosiva_salto_largo && Number.parseFloat(formData.fuerza_explosiva_salto_largo) > 10) {
        alert('Error: El salto largo no puede ser mayor a 10 metros');
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
    const testData = {
      student_id: formData.student_id,
      estatura: formData.estatura ? Number.parseFloat(formData.estatura) : null,
      peso: formData.peso ? Number.parseFloat(formData.peso) : null,
      brazo_extend_inicial: formData.brazo_extend_inicial ? Number.parseFloat(formData.brazo_extend_inicial) : null,
      brazo_extend_sin_impulso: formData.brazo_extend_sin_impulso ? Number.parseFloat(formData.brazo_extend_sin_impulso) : null,
      brazo_extend_con_impulso: formData.brazo_extend_con_impulso ? Number.parseFloat(formData.brazo_extend_con_impulso) : null,
      fuerza_explosiva_salto_largo: formData.fuerza_explosiva_salto_largo ? Number.parseFloat(formData.fuerza_explosiva_salto_largo) : null,
      envergadura_brazos_extendidos_lateral: formData.envergadura_brazos_extendidos_lateral ? Number.parseFloat(formData.envergadura_brazos_extendidos_lateral) : null,
      fuerza_abdomen: formData.fuerza_abdomen ? Number.parseInt(formData.fuerza_abdomen) : null,
      fuerza_brazos: formData.fuerza_brazos ? Number.parseInt(formData.fuerza_brazos) : null,
      fuerza_piernas: formData.fuerza_piernas ? Number.parseInt(formData.fuerza_piernas) : null,
      elevaciones_barra: formData.elevaciones_barra ? Number.parseInt(formData.elevaciones_barra) : null,
      observaciones: formData.observaciones || null,
      fecha_test: formData.fecha_test,
      modified_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('physical_tests')
      .insert(testData);

    if (error) {
      throw new Error(`Error creando test físico: ${error.message}`);
    }

    alert('Test físico registrado correctamente');
  };

  const updateTest = async () => {
    const testData = {
      student_id: formData.student_id,
      estatura: formData.estatura ? Number.parseFloat(formData.estatura) : null,
      peso: formData.peso ? Number.parseFloat(formData.peso) : null,
      brazo_extend_inicial: formData.brazo_extend_inicial ? Number.parseFloat(formData.brazo_extend_inicial) : null,
      brazo_extend_sin_impulso: formData.brazo_extend_sin_impulso ? Number.parseFloat(formData.brazo_extend_sin_impulso) : null,
      brazo_extend_con_impulso: formData.brazo_extend_con_impulso ? Number.parseFloat(formData.brazo_extend_con_impulso) : null,
      fuerza_explosiva_salto_largo: formData.fuerza_explosiva_salto_largo ? Number.parseFloat(formData.fuerza_explosiva_salto_largo) : null,
      envergadura_brazos_extendidos_lateral: formData.envergadura_brazos_extendidos_lateral ? Number.parseFloat(formData.envergadura_brazos_extendidos_lateral) : null,
      fuerza_abdomen: formData.fuerza_abdomen ? Number.parseInt(formData.fuerza_abdomen) : null,
      fuerza_brazos: formData.fuerza_brazos ? Number.parseInt(formData.fuerza_brazos) : null,
      fuerza_piernas: formData.fuerza_piernas ? Number.parseInt(formData.fuerza_piernas) : null,
      elevaciones_barra: formData.elevaciones_barra ? Number.parseInt(formData.elevaciones_barra) : null,
      observaciones: formData.observaciones || null,
      fecha_test: formData.fecha_test,
      modified_at: new Date().toISOString() // Agregar el campo que el trigger espera
    };

    console.log('Actualizando test físico:', testData);
    
    const { data, error } = await supabase
      .from('physical_tests')
      .update(testData)
      .eq('id', editingTest.id)
      .select();

    if (error) {
      console.error('Error actualizando:', error);
      throw new Error(`Error actualizando test físico: ${error.message}`);
    }
    
    console.log('Actualización exitosa:', data);

    alert('Test físico actualizado correctamente');
  };

  const deleteTest = async (test) => {
    const confirmDelete = globalThis.confirm(`¿Estás seguro de eliminar el test físico de ${test.atleta_name}?`);
    if (!confirmDelete) {
      return;
    }

    try {
      const { error } = await supabase
        .from('physical_tests')
        .delete()
        .eq('id', test.id);

      if (error) throw error;

      loadTests();
      alert('Test físico eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando test físico:', error);
      alert('Error: ' + error.message);
    }
  };

  const openModal = (test = null) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        student_id: test.student_id || '',
        estatura: test.estatura || '',
        peso: test.peso || '',
        brazo_extend_inicial: test.brazo_extend_inicial || '',
        brazo_extend_sin_impulso: test.brazo_extend_sin_impulso || '',
        brazo_extend_con_impulso: test.brazo_extend_con_impulso || '',
        fuerza_explosiva_salto_largo: test.fuerza_explosiva_salto_largo || '',
        envergadura_brazos_extendidos_lateral: test.envergadura_brazos_extendidos_lateral || '',
        fuerza_abdomen: test.fuerza_abdomen || '',
        fuerza_brazos: test.fuerza_brazos || '',
        fuerza_piernas: test.fuerza_piernas || '',
        elevaciones_barra: test.elevaciones_barra || '',
        observaciones: test.observaciones || '',
        fecha_test: test.fecha_test || getEcuadorDate()
      });
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
    setFormData({
      student_id: '',
      estatura: '',
      peso: '',
      brazo_extend_inicial: '',
      brazo_extend_sin_impulso: '',
      brazo_extend_con_impulso: '',
      fuerza_explosiva_salto_largo: '',
      envergadura_brazos_extendidos_lateral: '',
      fuerza_abdomen: '',
      fuerza_brazos: '',
      fuerza_piernas: '',
      elevaciones_barra: '',
      observaciones: '',
      fecha_test: getEcuadorDate()
    });
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

  return (
    <div className={styles.testsFisicosManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaDumbbell style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Gestión de Tests Físicos</h2>
          <p>Registrar y seguir el rendimiento físico de los atletas</p>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => openModal()}
        >
          <FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Nuevo Test Físico
        </button>
      </div>

      {/* Estadísticas Generales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#3b82f6' }}>
            <FaUsers />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.totalAtletas}</h3>
            <p>Total Atletas</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.conTestEsteMes}</h3>
            <p>Con Test Este Mes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#f59e0b' }}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.sinTestEsteMes}</h3>
            <p>Sin Test Este Mes</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#8b5cf6' }}>
            <FaChartLine />
          </div>
          <div className={styles.statInfo}>
            <h3>{stats.promedioTestsPorAtleta}</h3>
            <p>Tests Promedio/Atleta</p>
          </div>
        </div>
      </div>

      {/* Sección de Atletas Pendientes */}
      {atletasPendientes.length > 0 && (
        <div className={styles.pendientesSection}>
          <div className={styles.pendientesHeader}>
            <h3>
              <FaExclamationTriangle style={{ marginRight: '10px', color: '#f59e0b' }} />
              Atletas Sin Test Este Mes ({atletasPendientes.length})
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
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label htmlFor="search-tests"><FaSearch /> Buscar Atleta</label>
          <input
            id="search-tests"
            type="text"
            placeholder="Buscar por nombre de atleta..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
            autoComplete="off"
          />
        </div>

        <div className={styles.filterGroup}>
          <label><FaFilter /> Filtrar por Atleta</label>
          <select
            value={filters.atletaId}
            onChange={(e) => setFilters({...filters, atletaId: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Todos los atletas</option>
            {atletas.map(atleta => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.full_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label><FaCalendarAlt /> Desde</label>
          <input
            type="date"
            placeholder="Fecha desde"
            value={filters.fechaDesde}
            onChange={(e) => setFilters({...filters, fechaDesde: e.target.value})}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label><FaCalendarAlt /> Hasta</label>
          <input
            type="date"
            placeholder="Fecha hasta"
            value={filters.fechaHasta}
            onChange={(e) => setFilters({...filters, fechaHasta: e.target.value})}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={filters.onlyPending}
              onChange={(e) => setFilters({...filters, onlyPending: e.target.checked})}
              className={styles.checkbox}
            />
            <span>Solo sin test este mes</span>
          </label>
        </div>
      </div>

      {/* Lista de Tests Físicos */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando tests físicos...</p>
        </div>
      ) : (
        <div className={styles.testsGrid}>
          {tests.length > 0 ? (
            tests.map(test => {
              const previousTest = getPreviousTest(test);
              const hasComparison = previousTest !== null;

              return (
                <div key={test.id} className={styles.testCard}>
                  <div className={styles.testHeader}>
                    <div className={styles.testHeaderLeft}>
                      <h3>{test.atleta_name}</h3>
                      <span className={styles.categoria}>
                        {test.students?.categoria?.replaceAll('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.testActions}>
                      <button 
                        onClick={() => openModal(test)}
                        className={styles.editButton}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => deleteTest(test)}
                        className={styles.deleteButton}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.testDate}>
                    <FaCalendarAlt />
                    <span>{new Date(test.fecha_test).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>

                  {hasComparison && (
                    <div className={styles.comparisonBadge}>
                      <FaChartLine /> Con datos de comparación
                    </div>
                  )}
                  
                  <div className={styles.testInfo}>
                    {test.estatura && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaRulerVertical /> Estatura:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.estatura}m</span>
                          {hasComparison && previousTest.estatura && 
                            renderChangeIndicator(calculateChange(test.estatura, previousTest.estatura))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.peso && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaWeight /> Peso:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.peso}kg</span>
                          {hasComparison && previousTest.peso && 
                            renderChangeIndicator(calculateChange(test.peso, previousTest.peso))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.brazo_extend_inicial && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaHandPaper /> Ext. brazo inicial:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.brazo_extend_inicial}cm</span>
                          {hasComparison && previousTest.brazo_extend_inicial && 
                            renderChangeIndicator(calculateChange(test.brazo_extend_inicial, previousTest.brazo_extend_inicial))
                          }
                        </div>
                      </div>
                    )}

                    {test.brazo_extend_sin_impulso && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaHandPaper /> Ext. sin impulso:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.brazo_extend_sin_impulso}cm</span>
                          {hasComparison && previousTest.brazo_extend_sin_impulso && 
                            renderChangeIndicator(calculateChange(test.brazo_extend_sin_impulso, previousTest.brazo_extend_sin_impulso))
                          }
                        </div>
                      </div>
                    )}

                    {test.brazo_extend_con_impulso && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaHandPaper /> Ext. con impulso:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.brazo_extend_con_impulso}cm</span>
                          {hasComparison && previousTest.brazo_extend_con_impulso && 
                            renderChangeIndicator(calculateChange(test.brazo_extend_con_impulso, previousTest.brazo_extend_con_impulso))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.fuerza_explosiva_salto_largo && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaRunning /> Salto largo:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.fuerza_explosiva_salto_largo}m</span>
                          {hasComparison && previousTest.fuerza_explosiva_salto_largo && 
                            renderChangeIndicator(calculateChange(test.fuerza_explosiva_salto_largo, previousTest.fuerza_explosiva_salto_largo))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.fuerza_abdomen && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaFire /> Abdominales:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.fuerza_abdomen} reps</span>
                          {hasComparison && previousTest.fuerza_abdomen && 
                            renderChangeIndicator(calculateChange(test.fuerza_abdomen, previousTest.fuerza_abdomen))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.fuerza_brazos && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaDumbbell /> Flexiones:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.fuerza_brazos} reps</span>
                          {hasComparison && previousTest.fuerza_brazos && 
                            renderChangeIndicator(calculateChange(test.fuerza_brazos, previousTest.fuerza_brazos))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.fuerza_piernas && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaRunning /> Sentadillas:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.fuerza_piernas} reps</span>
                          {hasComparison && previousTest.fuerza_piernas && 
                            renderChangeIndicator(calculateChange(test.fuerza_piernas, previousTest.fuerza_piernas))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.elevaciones_barra && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}><FaArrowsAltH /> Elevaciones:</span>
                        <div className={styles.valueWithChange}>
                          <span className={styles.value}>{test.elevaciones_barra} reps</span>
                          {hasComparison && previousTest.elevaciones_barra && 
                            renderChangeIndicator(calculateChange(test.elevaciones_barra, previousTest.elevaciones_barra))
                          }
                        </div>
                      </div>
                    )}
                    
                    {test.observaciones && (
                      <div className={styles.observacionesSection}>
                        <span className={styles.label}><FaStickyNote /> Observaciones:</span>
                        <p className={styles.observaciones}>{test.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noTests}>
              <h3><FaDumbbell style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No hay tests físicos registrados</h3>
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
                  <><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Editar Test Físico</>
                ) : (
                  <><FaPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Nuevo Test Físico</>
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
                    <label htmlFor="student_search">Atleta *</label>
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
                    <label htmlFor="estatura">Estatura (m)</label>
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
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="peso">Peso (kg)</label>
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
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="envergadura">Envergadura brazos (cm)</label>
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
                  </div>
                </div>
              </div>

              {/* Tests de Fuerza */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaDumbbell /> Tests de Fuerza y Explosividad</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="brazo_inicial">Extensión brazo inicial (cm)</label>
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
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="brazo_sin_impulso">Extensión sin impulso (cm)</label>
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
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="brazo_con_impulso">Extensión con impulso (cm)</label>
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
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="salto_largo">Salto largo (m)</label>
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
                  </div>
                </div>
              </div>

              {/* Pruebas de Fuerza Muscular */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaFire /> Fuerza Muscular (repeticiones por minuto)</h4>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="fuerza_abdomen">Abdominales (1 min)</label>
                    <input
                      id="fuerza_abdomen"
                      type="number"
                      min="0"
                      max="200"
                      value={formData.fuerza_abdomen}
                      onChange={(e) => setFormData({...formData, fuerza_abdomen: e.target.value})}
                      placeholder="50"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="fuerza_brazos">Flexiones de brazo (1 min)</label>
                    <input
                      id="fuerza_brazos"
                      type="number"
                      min="0"
                      max="200"
                      value={formData.fuerza_brazos}
                      onChange={(e) => setFormData({...formData, fuerza_brazos: e.target.value})}
                      placeholder="30"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="fuerza_piernas">Sentadillas (1 min)</label>
                    <input
                      id="fuerza_piernas"
                      type="number"
                      min="0"
                      max="300"
                      value={formData.fuerza_piernas}
                      onChange={(e) => setFormData({...formData, fuerza_piernas: e.target.value})}
                      placeholder="40"
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="elevaciones_barra">Elevaciones en barra (1 min)</label>
                    <input
                      id="elevaciones_barra"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.elevaciones_barra}
                      onChange={(e) => setFormData({...formData, elevaciones_barra: e.target.value})}
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div className={styles.formSection}>
                <h4 className={styles.sectionTitle}><FaStickyNote /> Observaciones</h4>
                <div className={styles.inputGroup}>
                  <label htmlFor="observaciones">Comentarios adicionales</label>
                  <textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Ingrese observaciones sobre el rendimiento, técnica, recomendaciones, etc..."
                    rows={4}
                    className={styles.textarea}
                  />
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
                      <><FaClock style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Guardando...</>
                    );
                    return editingTest ? (
                      <><FaEdit style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Actualizar Test</>
                    ) : (
                      <><FaSave style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Guardar Test</>
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