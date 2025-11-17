import React, { useEffect, useState } from 'react';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 100);

    // Efecto parallax sutil
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* Video de fondo */}
      <video autoPlay muted loop playsInline className={styles.videoBg}>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>

      {/* Overlay con gradiente */}
      <div className={styles.overlay}></div>

      {/* Hero Section */}
      <section className={`${styles.heroSection} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.heroContent} style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
          <div className={styles.logoContainer}>
            <div className={styles.logoPulse}></div>
            <h1 className={styles.mainTitle}>
              <span className={styles.titleWord}>Rio</span>
              <span className={styles.titleWordAccent}>voley</span>
            </h1>
          </div>
          
          <p className={styles.tagline}>
            Formando Campeones, Construyendo Sueños
          </p>
          
          <p className={styles.description}>
            La escuela de voleibol más prestigiosa de Riobamba. 
            Desarrollamos talento deportivo con excelencia y pasión.
          </p>

          <div className={styles.ctaButtons}>
            <a href="/sobre" className={`${styles.btn} ${styles.btnPrimary}`}>
              <span>Conoce Nuestra Historia</span>
              <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
            <a href="/horarios" className={`${styles.btn} ${styles.btnSecondary}`}>
              <span>Ver Horarios</span>
              <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={styles.scrollIndicator}>
          <div className={styles.mouse}>
            <div className={styles.wheel}></div>
          </div>
          <p>Desliza para más</p>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>¿Por Qué Elegirnos?</h2>
          
          <div className={styles.featuresGrid}>
            <div className={`${styles.featureCard} ${styles.cardDelay1}`}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Entrenadores Profesionales</h3>
              <p>Staff técnico certificado con experiencia a nivel nacional</p>
            </div>

            <div className={`${styles.featureCard} ${styles.cardDelay2}`}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M17 11v1a5 5 0 0 1-10 0v-1M12 19v2M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Instalaciones Modernas</h3>
              <p>Canchas de primer nivel totalmente equipadas</p>
            </div>

            <div className={`${styles.featureCard} ${styles.cardDelay3}`}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Resultados Comprobados</h3>
              <p>Múltiples campeonatos y reconocimientos a nivel regional y nacional</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>Estudiantes Activos</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>5+</div>
              <div className={styles.statLabel}>Años de Experiencia</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>¿Listo para Empezar?</h2>
          <p className={styles.ctaText}>
            Comienza tu viaje hacia la excelencia deportiva hoy mismo
          </p>
          <a href="/login" className={`${styles.btn} ${styles.btnLarge} ${styles.btnPrimary}`}>
            <span>Acceder al Portal</span>
            <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;