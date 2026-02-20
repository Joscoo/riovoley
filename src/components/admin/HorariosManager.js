// src/components/admin/HorariosManager.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../../config/supabase';
import styles from '../../styles/HorariosManager.module.css';
import { 
  FaClock, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaUsers,
  FaSave,
  FaTimes,
  FaFilter,
  FaCalendarWeek
} from 'react-icons/fa';

const HorariosManager = ({ user }) => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDay, setFilterDay] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [formData, setFormData] = useState({
    dia_semana: 'lunes',
    hora_inicio: '',
    hora_fin: '',
    categoria: 'iniciacion_hombres'
  });

  const diasSemana = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  const categorias = [
    { value: 'iniciacion_hombres', label: 'Iniciación Hombres' },
    { value: 'iniciacion_mujeres', label: 'Iniciación Mujeres' },
    { value: 'perfeccionamiento_hombres', label: 'Perfeccionamiento Hombres' },
    { value: 'perfeccionamiento_mujeres', label: 'Perfeccionamiento Mujeres' },
    { value: 'master_mujeres', label: 'Master Mujeres' },
    { value: 'juego_sabado', label: 'Juego Sábado' },
    { value: 'juego_domingo', label: 'Juego Domingo' }
  ];

  useEffect(() => {
    fetchHorarios();
  }, []);

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (error) throw error;

      // Ordenar por día de la semana correctamente
      const ordenDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      const horariosOrdenados = data.sort((a, b) => {
        const diaA = ordenDias.indexOf(a.dia_semana);
        const diaB = ordenDias.indexOf(b.dia_semana);
        if (diaA !== diaB) return diaA - diaB;
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });

      setHorarios(horariosOrdenados);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      alert('Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.hora_inicio || !formData.hora_fin) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.hora_inicio >= formData.hora_fin) {
      alert('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }

    try {
      if (editingId) {
        // Actualizar horario existente
        const { error } = await supabase
          .from('schedules')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        alert('✅ Horario actualizado exitosamente');
      } else {
        // Crear nuevo horario
        const { error } = await supabase
          .from('schedules')
          .insert([formData]);

        if (error) throw error;
        alert('✅ Horario creado exitosamente');
      }

      resetForm();
      fetchHorarios();
    } catch (error) {
      console.error('Error al guardar horario:', error);
      alert(`❌ Error al guardar el horario: ${error.message}`);
    }
  };

  const handleEdit = (horario) => {
    setFormData({
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      categoria: horario.categoria
    });
    setEditingId(horario.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!globalThis.confirm('¿Estás seguro de eliminar este horario?')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('✅ Horario eliminado exitosamente');
      fetchHorarios();
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      alert(`❌ Error al eliminar el horario: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      dia_semana: 'lunes',
      hora_inicio: '',
      hora_fin: '',
      categoria: 'iniciacion_hombres'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const getCategoriaLabel = (categoria) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat ? cat.label : categoria;
  };

  const getCategoriaColor = (categoria) => {
    const colores = {
      'iniciacion_hombres': '#3498db',
      'iniciacion_mujeres': '#e91e63',
      'perfeccionamiento_hombres': '#2ecc71',
      'perfeccionamiento_mujeres': '#9b59b6',
      'master_mujeres': '#f39c12',
      'juego_sabado': '#e74c3c',
      'juego_domingo': '#16a085'
    };
    return colores[categoria] || '#95a5a6';
  };

  // Filtrar horarios
  const horariosFiltrados = horarios.filter(h => {
    const matchDay = filterDay === 'todos' || h.dia_semana === filterDay;
    const matchCategory = filterCategory === 'todos' || h.categoria === filterCategory;
    return matchDay && matchCategory;
  });

  // Agrupar por día de la semana
  const horariosAgrupados = horariosFiltrados.reduce((acc, horario) => {
    if (!acc[horario.dia_semana]) {
      acc[horario.dia_semana] = [];
    }
    acc[horario.dia_semana].push(horario);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Cargando horarios...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FaCalendarWeek className={styles.headerIcon} />
          <div>
            <h2 className={styles.title}>Gestión de Horarios</h2>
            <p className={styles.subtitle}>Administra los horarios de entrenamientos</p>
          </div>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Horario'}</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <FaClock className={styles.statIcon} style={{ color: '#3498db' }} />
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Horarios</p>
            <p className={styles.statValue}>{horarios.length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <FaCalendarAlt className={styles.statIcon} style={{ color: '#2ecc71' }} />
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Días Activos</p>
            <p className={styles.statValue}>{Object.keys(horariosAgrupados).length}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <FaUsers className={styles.statIcon} style={{ color: '#e91e63' }} />
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Categorías</p>
            <p className={styles.statValue}>{new Set(horarios.map(h => h.categoria)).size}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>
            {editingId ? 'Editar Horario' : 'Nuevo Horario'}
          </h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FaCalendarAlt className={styles.labelIcon} />
                  Día de la Semana
                </label>
                <select
                  name="dia_semana"
                  value={formData.dia_semana}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  {diasSemana.map(dia => (
                    <option key={dia.value} value={dia.value}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FaUsers className={styles.labelIcon} />
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FaClock className={styles.labelIcon} />
                  Hora Inicio
                </label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FaClock className={styles.labelIcon} />
                  Hora Fin
                </label>
                <input
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={resetForm} className={styles.cancelButton}>
                <FaTimes />
                <span>Cancelar</span>
              </button>
              <button type="submit" className={styles.saveButton}>
                <FaSave />
                <span>{editingId ? 'Actualizar' : 'Guardar'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <FaFilter className={styles.filterIcon} />
          <span>Filtrar Horarios</span>
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-day" className={styles.filterLabel}>Día</label>
            <select
              id="filter-day"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los días</option>
              {diasSemana.map(dia => (
                <option key={dia.value} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="filter-category" className={styles.filterLabel}>Categoría</label>
            <select
              id="filter-category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="todos">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Horarios por Día */}
      <div className={styles.schedulesContainer}>
        {Object.keys(horariosAgrupados).length === 0 ? (
          <div className={styles.emptyState}>
            <FaCalendarAlt className={styles.emptyIcon} />
            <h3>No hay horarios registrados</h3>
            <p>Comienza agregando un nuevo horario</p>
          </div>
        ) : (
          diasSemana
            .filter(dia => horariosAgrupados[dia.value])
            .map(dia => (
              <div key={dia.value} className={styles.daySection}>
                <h3 className={styles.dayTitle}>
                  <FaCalendarAlt />
                  {dia.label}
                </h3>
                <div className={styles.scheduleGrid}>
                  {horariosAgrupados[dia.value].map(horario => (
                    <div 
                      key={horario.id} 
                      className={styles.scheduleCard}
                      style={{ borderLeftColor: getCategoriaColor(horario.categoria) }}
                    >
                      <div className={styles.scheduleHeader}>
                        <span 
                          className={styles.categoryBadge}
                          style={{ backgroundColor: getCategoriaColor(horario.categoria) }}
                        >
                          {getCategoriaLabel(horario.categoria)}
                        </span>
                      </div>
                      
                      <div className={styles.scheduleTime}>
                        <FaClock className={styles.timeIcon} />
                        <span className={styles.time}>
                          {formatTime(horario.hora_inicio)} - {formatTime(horario.hora_fin)}
                        </span>
                      </div>

                      <div className={styles.scheduleActions}>
                        <button
                          onClick={() => handleEdit(horario)}
                          className={styles.editButton}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(horario.id)}
                          className={styles.deleteButton}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

HorariosManager.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string
  })
};

export default HorariosManager;
