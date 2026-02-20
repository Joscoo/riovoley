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
    dias_seleccionados: ['lunes'],
    hora_inicio: '',
    hora_fin: '',
    categorias_seleccionadas: ['iniciacion_hombres'],
    aplicar_todos_dias: false,
    descripcion: ''
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
    { value: 'open_gym', label: 'Open Gym' }
  ];

  const getDescripcionPorDefecto = (categoria) => {
    const descripciones = {
      'iniciacion_hombres': 'Perfecto para quienes se inician en el voleibol. Aprende los fundamentos básicos: recepción, saque, golpe de dedos, antebrazo y posicionamiento en cancha. Entrenamiento progresivo y didáctico.',
      'iniciacion_mujeres': 'Ideal para principiantes que quieren aprender voleibol desde cero. Desarrolla técnica básica, coordinación y trabajo en equipo en un ambiente motivador y de apoyo constante.',
      'perfeccionamiento_hombres': 'Para jugadores con experiencia que buscan mejorar su técnica y táctica de juego. Enfoque en remates, bloqueos, sistemas defensivos y estrategias avanzadas de competición.',
      'perfeccionamiento_mujeres': 'Entrenamiento avanzado para jugadoras con bases sólidas. Perfecciona tus habilidades técnicas, lee el juego rival, mejora tu táctica individual y colectiva para competir al máximo nivel.',
      'master_mujeres': 'Categoría especial para atletas mayores de 18 años con experiencia previa en voleibol. Mantén tu nivel competitivo, mejora tu condición física y disfruta del juego con compañeras de tu edad y experiencia.',
      'open_gym': 'Sesión de juego libre para todos los niveles. Practica lo aprendido, conoce jugadores de diferentes categorías y disfruta partidos recreativos en un ambiente divertido y competitivo.'
    };
    return descripciones[categoria] || '';
  };

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

    if (formData.categorias_seleccionadas.length === 0) {
      alert('Debes seleccionar al menos una categoría');
      return;
    }

    if (!formData.aplicar_todos_dias && formData.dias_seleccionados.length === 0) {
      alert('Debes seleccionar al menos un día');
      return;
    }

    try {
      if (editingId) {
        // Actualizar horario existente - solo una categoría por vez
        const { error } = await supabase
          .from('schedules')
          .update({
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin,
            categoria: formData.categorias_seleccionadas[0],
            descripcion: formData.descripcion || getDescripcionPorDefecto(formData.categorias_seleccionadas[0])
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('✅ Horario actualizado exitosamente');
      } else {
        // Crear nuevos horarios - uno por cada combinación de día y categoría
        const diasParaCrear = formData.aplicar_todos_dias 
          ? diasSemana.map(d => d.value) 
          : formData.dias_seleccionados;

        const horariosParaInsertar = [];
        
        for (const dia of diasParaCrear) {
          for (const categoria of formData.categorias_seleccionadas) {
            horariosParaInsertar.push({
              dia_semana: dia,
              hora_inicio: formData.hora_inicio,
              hora_fin: formData.hora_fin,
              categoria: categoria,
              descripcion: formData.descripcion || getDescripcionPorDefecto(categoria)
            });
          }
        }

        const { error } = await supabase
          .from('schedules')
          .insert(horariosParaInsertar);

        if (error) throw error;
        
        const totalCreados = horariosParaInsertar.length;
        alert(`✅ ${totalCreados} horario${totalCreados > 1 ? 's' : ''} creado${totalCreados > 1 ? 's' : ''} exitosamente`);
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
      dias_seleccionados: [horario.dia_semana],
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      categorias_seleccionadas: [horario.categoria],
      aplicar_todos_dias: false,
      descripcion: horario.descripcion || getDescripcionPorDefecto(horario.categoria)
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
      dias_seleccionados: ['lunes'],
      hora_inicio: '',
      hora_fin: '',
      categorias_seleccionadas: ['iniciacion_hombres'],
      aplicar_todos_dias: false,
      descripcion: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'aplicar_todos_dias') {
      setFormData({
        ...formData,
        aplicar_todos_dias: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDiaToggle = (diaValue) => {
    setFormData(prev => {
      const yaSeleccionado = prev.dias_seleccionados.includes(diaValue);
      const nuevosDias = yaSeleccionado
        ? prev.dias_seleccionados.filter(d => d !== diaValue)
        : [...prev.dias_seleccionados, diaValue];
      
      return {
        ...prev,
        dias_seleccionados: nuevosDias.length > 0 ? nuevosDias : [diaValue] // Al menos uno
      };
    });
  };

  const handleCategoriaToggle = (categoriaValue) => {
    setFormData(prev => {
      const yaSeleccionada = prev.categorias_seleccionadas.includes(categoriaValue);
      const nuevasCategorias = yaSeleccionada
        ? prev.categorias_seleccionadas.filter(c => c !== categoriaValue)
        : [...prev.categorias_seleccionadas, categoriaValue];
      
      return {
        ...prev,
        categorias_seleccionadas: nuevasCategorias.length > 0 ? nuevasCategorias : [categoriaValue] // Al menos una
      };
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
      'open_gym': '#1abc9c'
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
            
            {/* Selector de días */}
            {!editingId && (
              <div className={styles.formSection}>
                <label className={styles.sectionLabel}>
                  <FaCalendarAlt className={styles.labelIcon} />
                  Selecciona los días
                </label>
                
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="aplicar_todos_dias"
                      checked={formData.aplicar_todos_dias}
                      onChange={handleChange}
                      className={styles.checkbox}
                    />
                    <span>Aplicar a todos los días de la semana</span>
                  </label>
                </div>

                {!formData.aplicar_todos_dias && (
                  <div className={styles.daysGrid}>
                    {diasSemana.map(dia => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => handleDiaToggle(dia.value)}
                        className={`${styles.dayButton} ${
                          formData.dias_seleccionados.includes(dia.value) ? styles.dayButtonActive : ''
                        }`}
                      >
                        <FaCalendarAlt />
                        <span>{dia.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selector de categorías */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>
                <FaUsers className={styles.labelIcon} />
                Selecciona las categorías
              </label>
              <div className={styles.categoriesGrid}>
                {categorias.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoriaToggle(cat.value)}
                    className={`${styles.categoryButton} ${
                      formData.categorias_seleccionadas.includes(cat.value) ? styles.categoryButtonActive : ''
                    }`}
                    style={{
                      borderLeftColor: formData.categorias_seleccionadas.includes(cat.value) 
                        ? getCategoriaColor(cat.value) 
                        : 'transparent'
                    }}
                  >
                    <FaUsers />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div className={styles.formGrid}>
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

            {/* Descripción */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FaUsers className={styles.labelIcon} />
                Descripción (opcional)
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className={styles.textarea}
                rows="3"
                placeholder={`Descripción sugerida: ${getDescripcionPorDefecto(formData.categorias_seleccionadas[0])}`}
              />
              <p className={styles.helpText}>
                Si dejas vacío, se usará la descripción por defecto según la categoría
              </p>
            </div>

            {/* Resumen de selección */}
            {!editingId && (
              <div className={styles.selectionSummary}>
                <p className={styles.summaryText}>
                  <strong>Resumen:</strong> Se crearán {
                    (formData.aplicar_todos_dias ? diasSemana.length : formData.dias_seleccionados.length) * 
                    formData.categorias_seleccionadas.length
                  } horario(s) - {
                    formData.aplicar_todos_dias 
                      ? 'Todos los días' 
                      : `${formData.dias_seleccionados.length} día(s)`
                  } × {formData.categorias_seleccionadas.length} categoría(s)
                </p>
              </div>
            )}

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
