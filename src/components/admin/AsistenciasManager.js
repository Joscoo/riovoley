// src/components/admin/AsistenciasManager.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import styles from '../../styles/AsistenciasManager.module.css';

const AsistenciasManager = ({ user }) => {
  const [asistencias, setAsistencias] = useState([]);
  const [atletas, setAtletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    categoria: '',
    atleta: ''
  });

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);

  const categorias = [
    'iniciacion_hombres',
    'iniciacion_mujeres', 
    'perfeccionamiento_mujeres',
    'perfeccionamiento_hombres',
    'master_mujeres'
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    loadTodayAttendance();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar atletas
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

      // Cargar asistencias con filtros
      let query = supabase
        .from('attendance')
        .select(`
          *,
          student:students(
            id,
            categoria,
            user:users(id, nombre, apellido, email)
          )
        `)
        .order('fecha', { ascending: false });

      // Aplicar filtros de fecha
      if (filters.fecha_inicio && filters.fecha_fin) {
        query = query
          .gte('fecha', filters.fecha_inicio)
          .lte('fecha', filters.fecha_fin);
      }

      // Filtro por categoría
      if (filters.categoria) {
        const atletasCategoria = atletasData
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

      const { data: asistenciasData, error: asistenciasError } = await query;

      if (asistenciasError) throw asistenciasError;
      setAsistencias(asistenciasData || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      // Cargar asistencias del día seleccionado
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(
            id,
            categoria,
            user:users(id, nombre, apellido, email)
          )
        `)
        .eq('fecha', selectedDate)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Crear mapa de asistencias por atleta
      const attendanceMap = {};
      (data || []).forEach(attendance => {
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

  const toggleAttendance = async (atletaId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'presente' ? 'ausente' : 'presente';
      
      // Buscar si ya existe una asistencia para este día
      const { data: existing, error: findError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', atletaId)
        .eq('fecha', selectedDate)
        .single();

      if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw findError;
      }

      if (existing) {
        // Actualizar existente
        const { error } = await supabase
          .from('attendance')
          .update({ status: newStatus })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Crear nueva asistencia
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: atletaId,
            fecha: selectedDate,
            status: newStatus
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
    if (!window.confirm('¿Marcar todos los atletas como presentes?')) {
      return;
    }

    try {
      for (const atleta of todayAttendance) {
        await toggleAttendance(atleta.id, 'ausente'); // Esto los marcará como presentes
      }
      alert('Todos los atletas marcados como presentes');
    } catch (error) {
      console.error('Error marcando asistencias masivas:', error);
      alert('Error: ' + error.message);
    }
  };

  const clearAllAttendance = async () => {
    if (!window.confirm('¿Limpiar todas las asistencias del día?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('fecha', selectedDate);

      if (error) throw error;

      loadTodayAttendance();
      loadData();
      alert('Asistencias del día limpiadas');
    } catch (error) {
      console.error('Error limpiando asistencias:', error);
      alert('Error: ' + error.message);
    }
  };

  const calculateStats = () => {
    const total = asistencias.length;
    const presentes = asistencias.filter(a => a.status === 'presente').length;
    const ausentes = asistencias.filter(a => a.status === 'ausente').length;
    const porcentajeAsistencia = total > 0 ? ((presentes / total) * 100).toFixed(1) : 0;

    // Estadísticas por categoría
    const categoriaStats = {};
    categorias.forEach(cat => {
      const catAsistencias = asistencias.filter(a => 
        a.student?.categoria === cat
      );
      const catPresentes = catAsistencias.filter(a => a.status === 'presente').length;
      const catTotal = catAsistencias.length;
      
      categoriaStats[cat] = {
        total: catTotal,
        presentes: catPresentes,
        porcentaje: catTotal > 0 ? ((catPresentes / catTotal) * 100).toFixed(1) : 0
      };
    });

    return { total, presentes, ausentes, porcentajeAsistencia, categoriaStats };
  };

  const formatCategoria = (categoria) => {
    if (!categoria) return '--';
    return categoria.replace(/_/g, ' ').toUpperCase();
  };

  const stats = calculateStats();

  return (
    <div className={styles.asistenciasManager}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>📅 Control de Asistencias</h2>
          <p>Registro y seguimiento de entrenamientos</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.bulkButton}
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? '📊 Ver Reportes' : '✅ Registro Rápido'}
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Registros</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>{stats.presentes}</h3>
            <p>Presentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statInfo}>
            <h3>{stats.ausentes}</h3>
            <p>Ausentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statInfo}>
            <h3>{stats.porcentajeAsistencia}%</h3>
            <p>Asistencia Promedio</p>
          </div>
        </div>
      </div>

      {bulkMode ? (
        /* Modo de Registro Rápido */
        <div className={styles.bulkAttendance}>
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
                ✅ Todos Presentes
              </button>
              <button onClick={clearAllAttendance} className={styles.clearButton}>
                🗑️ Limpiar Día
              </button>
            </div>
          </div>

          <div className={styles.attendanceGrid}>
            {todayAttendance.map(atleta => {
              const isPresent = atleta.attendance?.status === 'presente';
              return (
                <div key={atleta.id} className={styles.atletaAttendance}>
                  <div className={styles.atletaInfo}>
                    <h4>{atleta.users?.nombre} {atleta.users?.apellido}</h4>
                    <span className={styles.categoria}>
                      {formatCategoria(atleta.categoria)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => toggleAttendance(atleta.id, atleta.attendance?.status)}
                    className={`${styles.attendanceButton} ${
                      isPresent ? styles.present : styles.absent
                    }`}
                  >
                    {isPresent ? '✅ Presente' : '❌ Ausente'}
                  </button>
                </div>
              );
            })}
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
                <option value="">🏐 Todas las categorías</option>
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
                <option value="">👥 Todos los atletas</option>
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
            <h3>📊 Estadísticas por Categoría</h3>
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
                              <strong>{asistencia.student?.user?.nombre} {asistencia.student?.user?.apellido}</strong>
                              <small>{asistencia.student?.user?.email}</small>
                            </div>
                          </td>
                          <td>{formatCategoria(asistencia.student?.categoria)}</td>
                          <td>
                            <span 
                              className={`${styles.statusBadge} ${
                                asistencia.status === 'presente' ? styles.present : styles.absent
                              }`}
                            >
                              {asistencia.status === 'presente' ? '✅ Presente' : '❌ Ausente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.noData}>
                  <h3>📅 No hay registros de asistencia</h3>
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

export default AsistenciasManager;