// src/components/admin/TestsFisicosManager.js
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/TestsFisicosManager.module.css';
import { FaEdit, FaPlus, FaClock, FaSave, FaDumbbell } from 'react-icons/fa';

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
    search: ''
  });

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
    fecha_test: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAtletas();
    loadTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
        alert('❌ Error: Debe seleccionar un atleta');
        return;
      }
      
      if (!formData.fecha_test) {
        alert('❌ Error: La fecha del test es requerida');
        return;
      }

      // Validar fecha no futura
      const fechaTest = new Date(formData.fecha_test);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      
      if (fechaTest > hoy) {
        alert('❌ Error: La fecha del test no puede ser futura');
        return;
      }

      // Validar que al menos un campo de medición esté completo
      const mediciones = [
        formData.estatura, formData.peso, formData.brazo_extend_inicial,
        formData.brazo_extend_sin_impulso, formData.brazo_extend_con_impulso,
        formData.fuerza_explosiva_salto_largo, formData.envergadura_brazos_extendidos_lateral
      ];

      if (!mediciones.some(medicion => medicion && String(medicion).trim() !== '')) {
        alert('❌ Error: Debe ingresar al menos una medición física');
        return;
      }

      // Validaciones específicas de rangos
      if (formData.estatura && (Number.parseFloat(formData.estatura) < 0.5 || Number.parseFloat(formData.estatura) > 3)) {
        alert('❌ Error: La estatura debe estar entre 0.5m y 3.0m');
        return;
      }

      if (formData.peso && (Number.parseFloat(formData.peso) < 20 || Number.parseFloat(formData.peso) > 300)) {
        alert('❌ Error: El peso debe estar entre 20kg y 300kg');
        return;
      }

      if (formData.fuerza_explosiva_salto_largo && Number.parseFloat(formData.fuerza_explosiva_salto_largo) > 10) {
        alert('❌ Error: El salto largo no puede ser mayor a 10 metros');
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
      alert('❌ Error: ' + error.message);
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

    alert('✅ ¡Test físico registrado correctamente!');
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

    alert('✅ ¡Test físico actualizado correctamente!');
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
        fecha_test: test.fecha_test || new Date().toISOString().split('T')[0]
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
      fecha_test: new Date().toISOString().split('T')[0]
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

      {/* Filtros */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <select
            value={filters.atletaId}
            onChange={(e) => setFilters({...filters, atletaId: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">👥 Todos los atletas</option>
            {atletas.map(atleta => (
              <option key={atleta.id} value={atleta.id}>
                {atleta.full_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <input
            type="date"
            placeholder="Fecha desde"
            value={filters.fechaDesde}
            onChange={(e) => setFilters({...filters, fechaDesde: e.target.value})}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <input
            type="date"
            placeholder="Fecha hasta"
            value={filters.fechaHasta}
            onChange={(e) => setFilters({...filters, fechaHasta: e.target.value})}
            className={styles.filterInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Buscar por atleta u observaciones..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className={styles.searchInput}
          />
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
            tests.map(test => (
              <div key={test.id} className={styles.testCard}>
                <div className={styles.testHeader}>
                  <h3>{test.atleta_name}</h3>
                  <div className={styles.testActions}>
                    <button 
                      onClick={() => openModal(test)}
                      className={styles.editButton}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => deleteTest(test)}
                      className={styles.deleteButton}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className={styles.testInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Fecha:</span>
                    <span>{new Date(test.fecha_test).toLocaleDateString()}</span>
                  </div>
                  
                  {test.estatura && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Estatura:</span>
                      <span>{test.estatura}m</span>
                    </div>
                  )}
                  
                  {test.peso && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Peso:</span>
                      <span>{test.peso}kg</span>
                    </div>
                  )}
                  
                  {test.brazo_extend_inicial && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Extensión brazo inicial:</span>
                      <span>{test.brazo_extend_inicial}cm</span>
                    </div>
                  )}
                  
                  {test.fuerza_explosiva_salto_largo && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Salto largo:</span>
                      <span>{test.fuerza_explosiva_salto_largo}m</span>
                    </div>
                  )}
                  
                  {test.fuerza_abdomen && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Abdominales (1min):</span>
                      <span>{test.fuerza_abdomen} reps</span>
                    </div>
                  )}
                  
                  {test.fuerza_brazos && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Flexiones (1min):</span>
                      <span>{test.fuerza_brazos} reps</span>
                    </div>
                  )}
                  
                  {test.fuerza_piernas && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Sentadillas (1min):</span>
                      <span>{test.fuerza_piernas} reps</span>
                    </div>
                  )}
                  
                  {test.elevaciones_barra && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Elevaciones (1min):</span>
                      <span>{test.elevaciones_barra} reps</span>
                    </div>
                  )}
                  
                  {test.observaciones && (
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Observaciones:</span>
                      <span>{test.observaciones}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
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
                <h4 className={styles.sectionTitle}>📋 Información General</h4>
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
                <h4 className={styles.sectionTitle}>📏 Mediciones Corporales</h4>
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
                <h4 className={styles.sectionTitle}>💪 Tests de Fuerza y Explosividad</h4>
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
                <h4 className={styles.sectionTitle}>💪 Fuerza Muscular (repeticiones por minuto)</h4>
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
                <h4 className={styles.sectionTitle}>📝 Observaciones</h4>
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