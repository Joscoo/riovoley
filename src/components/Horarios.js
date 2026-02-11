import React, { useState, useEffect } from 'react';
import { initializeGapi, getCalendarEvents } from '../services/googleCalendar';
import styles from '../styles/Horarios.module.css';
import { FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';

const Horarios = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      
      const initialized = await initializeGapi();
      
      if (initialized) {
        const calendarEvents = await getCalendarEvents();
        setEvents(calendarEvents);
      } else {
        setError('No se pudo conectar con Google Calendar API');
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
      setError(`Error al cargar los horarios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
          <button onClick={loadCalendarEvents} className={styles.retryButton}>
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
      
      {events.length > 0 ? (
        <div className={styles.eventsContainer}>
          <div className={styles.eventsGrid}>
            {events.map((event) => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <div className={styles.eventIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className={styles.eventTitle}>{event.summary}</h3>
                </div>
                
                <div className={styles.eventDetails}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.detailContent}>
                      <p className={styles.detailLabel}>Fecha</p>
                      <p className={styles.detailValue}>{formatDate(event.start.dateTime || event.start.date)}</p>
                    </div>
                  </div>

                  {event.start.dateTime && event.end.dateTime && (
                    <div className={styles.detailItem}>
                      <div className={styles.detailIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className={styles.detailContent}>
                        <p className={styles.detailLabel}>Hora</p>
                        <p className={styles.detailValue}>{formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}</p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className={styles.detailItem}>
                      <div className={styles.detailIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className={styles.detailContent}>
                        <p className={styles.detailLabel}>Ubicación</p>
                        <p className={styles.detailValue}>{event.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {event.description && (
                  <div className={styles.eventDescription}>
                    <p>{event.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FaCalendarAlt /></div>
          <h3 className={styles.emptyTitle}>No hay entrenamientos programados</h3>
          <p className={styles.emptyText}>Los horarios se actualizarán pronto. Revisa esta página regularmente.</p>
        </div>
      )}
    </div>
  );
};

export default Horarios;