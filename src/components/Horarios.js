import React, { useState, useEffect } from 'react';
import { initializeGapi, getCalendarEvents } from '../services/googleCalendar';
import styles from '../styles/Horarios.module.css';

const Horarios = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCalendarEvents = async () => {
      try {
        setLoading(true);
        const initialized = await initializeGapi();
        
        if (initialized) {
          const calendarEvents = await getCalendarEvents();
          setEvents(calendarEvents);
        } else {
          setError('No se pudo conectar con Google Calendar');
        }
      } catch (error) {
        console.error('Error loading calendar:', error);
        setError('Error al cargar los horarios');
      } finally {
        setLoading(false);
      }
    };

    loadCalendarEvents();
  }, []);

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

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <video autoPlay muted loop playsInline className={styles.videoBg}>
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.container}>
          <div className={styles.loading}>
            <h2>🔄 Cargando horarios...</h2>
            <p>Conectando con Google Calendar</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <video autoPlay muted loop playsInline className={styles.videoBg}>
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>❌ Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <video autoPlay muted loop playsInline className={styles.videoBg}>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>

      <div className={styles.container}>
        <h2 className={styles.title}>📅 Horarios de Entrenamientos</h2>
        
        {events.length > 0 ? (
          <div className={styles.calendarGrid}>
            {events.map((event, index) => (
              <div key={index} className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <h3 className={styles.eventTitle}>{event.summary}</h3>
                  <span className={styles.dayBadge}>
                    {getDayOfWeek(event.start.dateTime || event.start.date)}
                  </span>
                </div>
                <div className={styles.eventDetails}>
                  <p className={styles.eventDate}>
                    📅 {formatDate(event.start.dateTime || event.start.date)}
                  </p>
                  {event.start.dateTime && event.end.dateTime && (
                    <p className={styles.eventTime}>
                      🕐 {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                    </p>
                  )}
                  {event.description && (
                    <p className={styles.eventDescription}>
                      📝 {event.description}
                    </p>
                  )}
                  {event.location && (
                    <p className={styles.eventLocation}>
                      📍 {event.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noEvents}>
            <h3>📭 No hay entrenamientos programados</h3>
            <p>Los horarios se actualizarán pronto en Google Calendar.</p>
          </div>
        )}

        <div className={styles.calendarInfo}>
          <h3>💡 Información</h3>
          <p>Los horarios se actualizan automáticamente desde nuestro Google Calendar.</p>
          <p>Para cambios de último momento, revisa esta página regularmente.</p>
        </div>
      </div>
    </div>
  );
};

export default Horarios;