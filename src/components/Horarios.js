import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import styles from '../styles/Horarios.module.css';
import { FaClock, FaCalendarAlt, FaUsers, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const Horarios = () => {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('todos');

  const diasSemana = [
    { value: 'todos', label: 'Todos los días' },
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('schedules')
        .select('*')
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (supabaseError) throw supabaseError;

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
      console.error('Error loading schedules:', error);
      setError(`Error al cargar los horarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const getCategoriaLabel = (categoria) => {
    const labels = {
      'iniciacion_hombres': 'Iniciación Hombres',
      'iniciacion_mujeres': 'Iniciación Mujeres',
      'perfeccionamiento_hombres': 'Perfeccionamiento Hombres',
      'perfeccionamiento_mujeres': 'Perfeccionamiento Mujeres',
      'master_mujeres': 'Master Mujeres',
      'open_gym': 'Open Gym'
    };
    return labels[categoria] || categoria;
  };

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

  // Filtrar horarios por día
  const horariosFiltrados = selectedDay === 'todos' 
    ? horarios 
    : horarios.filter(h => h.dia_semana === selectedDay);

  // Agrupar horarios por día
  const horariosAgrupados = horariosFiltrados.reduce((acc, horario) => {
    if (!acc[horario.dia_semana]) {
      acc[horario.dia_semana] = [];
    }
    acc[horario.dia_semana].push(horario);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        {/* Video de fondo */}
        <video className={styles.videoBg} autoPlay loop muted playsInline>
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlay}></div>

        <section className={styles.heroSection}>
          <h1 className={styles.title}>Horarios de Entrenamientos</h1>
          <p className={styles.subtitle}>Consulta nuestros horarios actualizados</p>
        </section>
        
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Cargando horarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        {/* Video de fondo */}
        <video className={styles.videoBg} autoPlay loop muted playsInline>
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlay}></div>

        <section className={styles.heroSection}>
          <h1 className={styles.title}>Horarios de Entrenamientos</h1>
          <p className={styles.subtitle}>Consulta nuestros horarios actualizados</p>
        </section>
        
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}><FaExclamationTriangle /></div>
          <h2 className={styles.errorTitle}>Error al Cargar Horarios</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={loadSchedules} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Video de fondo */}
      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay}></div>

      <section className={styles.heroSection}>
        <h1 className={styles.title}>Horarios de Entrenamientos</h1>
        <p className={styles.subtitle}>
          Consulta nuestros horarios actualizados y elige el mejor momento para entrenar
        </p>
      </section>

      {/* Filtro por día */}
      <div className={styles.filterContainer}>
        <div className={styles.filterWrapper}>
          <FaCalendarAlt className={styles.filterIcon} />
          <select 
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className={styles.dayFilter}
          >
            {diasSemana.map(dia => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {horariosFiltrados.length > 0 ? (
        <div className={styles.schedulesSection}>
          {diasSemana
            .filter(dia => dia.value !== 'todos' && horariosAgrupados[dia.value])
            .map(dia => (
              <div key={dia.value} className={styles.dayGroup}>
                <h2 className={styles.dayTitle}>
                  <FaCalendarAlt className={styles.dayIcon} />
                  {dia.label}
                </h2>
                <div className={styles.eventsGrid}>
                  {horariosAgrupados[dia.value].map((horario) => (
                    <div 
                      key={horario.id} 
                      className={styles.eventCard}
                      style={{ borderLeftColor: getCategoriaColor(horario.categoria) }}
                    >
                      <div className={styles.eventHeader}>
                        <span 
                          className={styles.categoryBadge}
                          style={{ backgroundColor: getCategoriaColor(horario.categoria) }}
                        >
                          <FaUsers className={styles.badgeIcon} />
                          {getCategoriaLabel(horario.categoria)}
                        </span>
                      </div>
                      
                      <div className={styles.eventDetails}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailIcon}>
                            <FaClock />
                          </div>
                          <div className={styles.detailContent}>
                            <p className={styles.detailLabel}>Horario</p>
                            <p className={styles.detailValue}>
                              {formatTime(horario.hora_inicio)} - {formatTime(horario.hora_fin)}
                            </p>
                          </div>
                        </div>
                        
                        <div className={styles.descriptionItem}>
                          <div className={styles.descriptionIcon}>
                            <FaInfoCircle />
                          </div>
                          <p className={styles.descriptionText}>
                            {horario.descripcion || getDescripcionPorDefecto(horario.categoria)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FaCalendarAlt /></div>
          <h3 className={styles.emptyTitle}>No hay horarios programados</h3>
          <p className={styles.emptyText}>Los horarios se actualizarán pronto. Revisa esta página regularmente.</p>
        </div>
      )}
    </div>
  );
};

export default Horarios;