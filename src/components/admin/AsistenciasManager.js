// src/components/admin/AsistenciasManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/AsistenciasManager.module.css';
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
  FaCheck 
} from 'react-icons/fa';

const AsistenciasManager = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    categoria: '',
    atleta: ''
  });

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // Nueva: categoría seleccionada en tabs

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

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar atletas solo si no están ya cargados
      if (atletas.length === 0) {
        const { data: atletasData, error: atletasError } = await supabase
          .from('students')
          .select(`
            id,
            categoria,
            users(id, nombre, apellido, email)
          `)
          .order('users(apellido)', { ascending: true });

        if (atletasError) throw atletasError;
        setAtletas(atletasData || []);
      }

      // Cargar asistencias con filtros - Estrategia separada para evitar problemas de JOIN
      let query = supabase
        .from('attendances')
        .select('*')
        .order('fecha', { ascending: false });

      // Aplicar filtros de fecha
      if (filters.fecha_inicio && filters.fecha_fin) {
        query = query
          .gte('fecha', filters.fecha_inicio)
          .lte('fecha', filters.fecha_fin);
      }

      // Filtro por categoría
      if (filters.categoria) {
        const atletasCategoria = (atletas.length > 0 ? atletas : await loadAtletasForFilter())
          .filter(a => a.categoria === filters.categoria)
          .map(a => a.id);
        
        if (atletasCategoria.length > 0) {
          query = query.in('student_id', atletasCategoria);
        }
      }

      // Filtro por atleta específico
      if (filters.atleta) {
        query = query.eq('student_id', filters.atleta);
      }

      const { data: asistenciasRaw, error: asistenciasError } = await query;

      if (asistenciasError) throw asistenciasError;

      // Combinar asistencias con datos de estudiantes
      const currentAtletas = atletas.length > 0 ? atletas : await loadAtletasForFilter();
      const asistenciasWithDetails = await Promise.all(
        (asistenciasRaw || []).map(async (asistencia) => {
          const student = currentAtletas.find(a => a.id === asistencia.student_id);
          
          if (!student) {
            // Si no encontramos el estudiante en cache, cargarlo
            const { data: studentData } = await supabase
              .from('students')
              .select(`
                id,
                categoria,
                users!inner(id, nombre, apellido, email)
              `)
              .eq('id', asistencia.student_id)
              .single();
              
            return {
              ...asistencia,
              students: studentData
            };
          }

          return {
            ...asistencia,
            students: student
          };
        })
      );

      setAsistencias(asistenciasWithDetails);

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para cargar atletas cuando se necesitan para filtros
  const loadAtletasForFilter = async () => {
    const { data: atletasData, error: atletasError } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users(id, nombre, apellido, email)
      `)
      .order('users(apellido)', { ascending: true });

    if (atletasError) throw atletasError;
    const atletasResult = atletasData || [];
    
    if (atletas.length === 0) {
      setAtletas(atletasResult);
    }
    
    return atletasResult;
  };

  const loadTodayAttendance = async () => {
    try {
      // Cargar asistencias del día seleccionado
      const { data: rawAttendance, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('fecha', selectedDate)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Crear mapa de asistencias por atleta
      const attendanceMap = {};
      (rawAttendance || []).forEach(attendance => {
        attendanceMap[attendance.student_id] = attendance;
      });

      // Combinar con lista de atletas para mostrar todos
      const todayData = atletas.map(atleta => ({
        ...atleta,
        attendance: attendanceMap[atleta.id] || null
      }));

      setTodayAttendance(todayData);
    } catch (error) {
      console.error('Error cargando asistencias del día:', error);
    }
  };

  const toggleAttendance = async (atletaId, isCurrentlyPresent) => {
    try {
      if (isCurrentlyPresent) {
        // Si está presente, eliminar el registro (marcar como ausente)
        const { error } = await supabase
          .from('attendances')
          .delete()
          .eq('student_id', atletaId)
          .eq('fecha', selectedDate);

        if (error) throw error;
      } else {
        // Si está ausente, crear registro (marcar como presente)
        const { error } = await supabase
          .from('attendances')
          .insert({
            student_id: atletaId,
            fecha: selectedDate
          });

        if (error) throw error;
      }

      loadTodayAttendance();
      loadData(); // Refrescar la lista general
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      alert('Error: ' + error.message);
    }
  };

  const markAllPresent = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('¿Marcar todos los atletas como presentes?')) {
      return;
    }

    try {
      for (const atleta of todayAttendance) {
        const isCurrentlyPresent = atleta.attendance !== null;
        if (!isCurrentlyPresent) {
          await toggleAttendance(atleta.id, false); // Marcar como presente
        }
      }
      alert('Todos los atletas marcados como presentes');
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
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('fecha', selectedDate);

      if (error) throw error;

      // Recargar solo las asistencias del día, mantener atletas
      loadTodayAttendance();
      alert('Asistencias del día limpiadas correctamente');
    } catch (error) {
      console.error('Error limpiando asistencias:', error);
      alert('Error: ' + error.message);
    }
  };

  const calculateStats = () => {
    // En la nueva lógica, solo tenemos registros de presentes
    const totalPresentes = asistencias.length; // Todos los registros son presencias
    const totalAtletas = atletas.length;
    const ausentes = totalAtletas > 0 ? totalAtletas - totalPresentes : 0; // Estimación basada en total de atletas
    const porcentajeAsistencia = totalAtletas > 0 ? ((totalPresentes / totalAtletas) * 100).toFixed(1) : 0;

    // Estadísticas por categoría
    const categoriaStats = {};
    categorias.forEach(cat => {
      const atletasCategoria = atletas.filter(a => a.categoria === cat);
      const asistenciasCategoria = asistencias.filter(a => 
        a.students?.categoria === cat
      );
      const catTotal = atletasCategoria.length;
      const catPresentes = asistenciasCategoria.length;
      
      categoriaStats[cat] = {
        total: catTotal,
        presentes: catPresentes,
        porcentaje: catTotal > 0 ? ((catPresentes / catTotal) * 100).toFixed(1) : 0
      };
    });

    return { 
      total: totalAtletas, 
      presentes: totalPresentes, 
      ausentes, 
      porcentajeAsistencia, 
      categoriaStats 
    };
  };

  const formatCategoria = (categoria) => {
    if (!categoria) return '--';
    return categoria.replaceAll('_', ' ').toUpperCase();
  };

  // Filtrar atletas según categoría seleccionada en tabs
  const getFilteredAtletas = () => {
    if (selectedCategory === 'all') {
      return todayAttendance;
    }
    return todayAttendance.filter(atleta => 
      atleta.categoria?.includes(selectedCategory)
    );
  };

  // Obtener estadísticas de la categoría seleccionada
  const getCategoryStats = () => {
    const filteredAtletas = getFilteredAtletas();
    const presentes = filteredAtletas.filter(a => a.attendance !== null).length;
    const total = filteredAtletas.length;
    const ausentes = total - presentes;
    const porcentaje = total > 0 ? ((presentes / total) * 100).toFixed(1) : 0;

    return { total, presentes, ausentes, porcentaje };
  };

  const stats = calculateStats();

  return (
    <div className={styles.asistenciasManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2><FaCalendarAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Control de Asistencias</h2>
          <p>Registro y seguimiento de entrenamientos</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.bulkButton}
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? (
              <><FaChartBar style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Ver Reportes</>
            ) : (
              <><FaCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Registro Rápido</>
            )}
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
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
            
            <div className={styles.bulkActions}>
              <button onClick={markAllPresent} className={styles.allPresentButton}>
                <FaCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Todos Presentes
              </button>
              <button onClick={clearAllAttendance} className={styles.clearButton}>
                <FaTrash style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Limpiar Día
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

            {/* Estadísticas de la categoría seleccionada */}
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
                      <FaCheckCircle className={styles.miniIcon} style={{ color: '#28a745' }} />
                      <span>Presentes: {catStats.presentes}</span>
                    </div>
                    <div className={styles.miniStat}>
                      <FaTimesCircle className={styles.miniIcon} style={{ color: '#dc3545' }} />
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
                      <FaVolleyballBall style={{ marginRight: '8px' }} /> Iniciación
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'iniciacion_hombres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'iniciacion_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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

                  {/* Perfeccionamiento */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaTrophy style={{ marginRight: '8px' }} /> Perfeccionamiento
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'perfeccionamiento_hombres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'perfeccionamiento_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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

                  {/* Master */}
                  <div className={styles.categorySection}>
                    <h3 className={styles.categoryTitle}>
                      <FaMedal style={{ marginRight: '8px' }} /> Master
                    </h3>
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'master_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'iniciacion_hombres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'iniciacion_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                  )}

                  {selectedCategory === 'perfeccionamiento' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaMars style={{ marginRight: '6px' }} /> Hombres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'perfeccionamiento_hombres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                      
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'perfeccionamiento_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                  )}

                  {selectedCategory === 'master' && (
                    <div className={styles.categorySubGrid}>
                      <div className={styles.subCategory}>
                        <h4><FaVenus style={{ marginRight: '6px' }} /> Mujeres</h4>
                        <div className={styles.atletasList}>
                          {todayAttendance
                            .filter(atleta => atleta.categoria === 'master_mujeres')
                            .map(atleta => {
                              const isPresent = atleta.attendance !== null;
                              return (
                                <div key={atleta.id} className={styles.atletaItem}>
                                  <span className={styles.atletaName}>
                                    {atleta.users?.nombre} {atleta.users?.apellido}
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
                <option value=""><FaVolleyballBall style={{ marginRight: '6px' }} /> Todas las categorías</option>
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
                <option value=""><FaUsers style={{ marginRight: '6px' }} /> Todos los atletas</option>
                {atletas.map(atleta => (
                  <option key={atleta.id} value={atleta.id}>
                    {atleta.users?.nombre} {atleta.users?.apellido}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estadísticas por Categoría */}
          <div className={styles.categoryStats}>
            <h3><FaChartBar style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Estadísticas por Categoría</h3>
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

          {/* Lista de Asistencias */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Cargando asistencias...</p>
            </div>
          ) : (
            <div className={styles.attendanceTable}>
              <h3>📋 Historial de Asistencias</h3>
              
              {asistencias.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Atleta</th>
                        <th>Categoría</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.map(asistencia => (
                        <tr key={asistencia.id} className={styles.tableRow}>
                          <td>{new Date(asistencia.fecha).toLocaleDateString()}</td>
                          <td>
                            <div className={styles.atletaCell}>
                              <strong>{asistencia.students?.users?.nombre} {asistencia.students?.users?.apellido}</strong>
                              <small>{asistencia.students?.users?.email}</small>
                            </div>
                          </td>
                          <td>{formatCategoria(asistencia.students?.categoria)}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles.present}`}>
                              <FaCheckCircle style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Presente
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.noData}>
                  <h3><FaCalendarAlt style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No hay registros de asistencia</h3>
                  <p>Selecciona un rango de fechas o ajusta los filtros</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

AsistenciasManager.propTypes = {
  user: PropTypes.object
};

export default AsistenciasManager;