import React from 'react';
import styles from '../styles/AboutUs.module.css';

const AboutUs = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Video de fondo */}
      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay}></div>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Sobre Nosotros</h1>
          <p className={styles.heroSubtitle}>Conoce nuestra historia y lo que nos hace únicos</p>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className={styles.missionVisionSection}>
        <div className={styles.cardsGrid}>
          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Nuestra Misión</h3>
            <p className={styles.cardText}>Formar integralmente a niños, niñas y jóvenes de la ciudad de Riobamba en la disciplina del voleibol, proporcionando un programa estructurado de iniciación, aprendizaje y perfeccionamiento técnico. Nuestro compromiso es fomentar un ambiente de disciplina y respeto, inculcando sólidos valores éticos y morales que preparen a nuestros deportistas no solo para la competencia, sino para ser ciudadanos que aporten positivamente a su comunidad y a la sociedad.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>
            <h3 className={styles.cardTitle}>Nuestra Visión</h3>
            <p className={styles.cardText}>Ser la escuela de voleibol líder y un referente de formación deportiva en Riobamba y la región central del Ecuador, reconocida por su excelencia metodológica en la enseñanza del voleibol y por su profundo impacto en el desarrollo personal de sus atletas. Aspiramos a ser una cantera de talento deportivo y, sobre todo, de ciudadanos ejemplares que demuestren integridad y liderazgo dentro y fuera de la cancha.</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className={styles.valuesSection}>
        <h2 className={styles.sectionTitle}>Nuestros Valores</h2>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <h4 className={styles.valueTitle}>Disciplina</h4>
            <p className={styles.valueText}>Fomentamos la puntualidad, el respeto por el proceso y la perseverancia. La disciplina es el puente entre las metas y los logros.</p>
          </div>
          <div className={styles.valueCard}>
            <h4 className={styles.valueTitle}>Trabajo en Equipo</h4>
            <p className={styles.valueText}>Enseñamos que el voleibol es un deporte de interdependencia. Celebramos el éxito colectivo y aprendemos a confiar y apoyar a nuestros compañeros.</p>
          </div>
          <div className={styles.valueCard}>
            <h4 className={styles.valueTitle}>Excelencia</h4>
            <p className={styles.valueText}>Más que la perfección, buscamos la mejora continua. Motivamos a cada atleta a competir contra sí mismo y a superar sus propios límites cada día.</p>
          </div>
          <div className={styles.valueCard}>
            <h4 className={styles.valueTitle}>Pasión</h4>
            <p className={styles.valueText}>Cultivamos el gozo por el juego y el respeto por el rival. La pasión es el motor que nos impulsa a entrenar con alegría y a jugar con deportividad.</p>
          </div>
        </div>
      </section>
      
        {/* Información de Contacto */}
        <section className={styles.contactSection}>
          <h2 className={styles.sectionTitle}>Contáctanos</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className={styles.contactTitle}>Teléfono</h4>
              <p className={styles.contactInfo}>0963 840 728</p>
              <a href="tel:+593963840728" className={styles.contactButton}>
                Llamar
              </a>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIconWrapper}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className={styles.contactTitle}>WhatsApp</h4>
              <p className={styles.contactInfo}>Escríbenos ahora</p>
              <a 
                href="https://wa.me/593963840728?text=Hola,%20me%20interesa%20información%20sobre%20Riovoley"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactButton}
              >
                Chatear
              </a>
            </div>

          </div>
        </section>

        {/* Redes Sociales */}
        <section className={styles.socialSection}>
          <h2 className={styles.sectionTitle}>Síguenos</h2>
          <div className={styles.socialGrid}>
            <a 
              href="https://www.instagram.com/rio.voley" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialCard}
            >
              <div className={styles.socialIcon}>📸</div>
              <p className={styles.socialName}>Instagram</p>
            </a>

            <a 
              href="https://www.tiktok.com/@riovoley" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialCard}
            >
              <div className={styles.socialIcon}>🎵</div>
              <p className={styles.socialName}>TikTok</p>
            </a>

            <a 
              href="https://wa.me/593963840728" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialCard}
            >
              <div className={styles.socialIcon}>💬</div>
              <p className={styles.socialName}>WhatsApp</p>
            </a>
          </div>
        </section>
        
        {/* Ubicación */}
        <section className={styles.locationSection}>
          <h2 className={styles.sectionTitle}>Nuestra Ubicación</h2>
          <div className={styles.mapContainer}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4798.2580374811805!2d-78.6524372242609!3d-1.6507429983339346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d3a9bdb6b16f71%3A0xb4f5ad9daa85eb65!2sEscuela%20de%20Voleibol%20%22RIOVOLEY%22!5e1!3m2!1ses-419!2sec!4v1753062935200!5m2!1ses-419!2sec"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Escuela de Voleibol Riovoley"
              className={styles.mapIframe}
            ></iframe>
          </div>
        </section>
    </div>
  );
};

export default AboutUs;