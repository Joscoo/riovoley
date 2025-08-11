import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/AboutUs.module.css';

const AboutUs = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Video de fondo */}
      <video autoPlay muted loop playsInline className={styles.videoBg}>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>

      <div className={styles.container}>
        <h2 className={styles.title}>Sobre Nosotros</h2>
        <div className={styles.content}>

          {/* Misión */}
          <div className={styles.box}>
            <h3>Misión</h3>
            <p>Nuestra misión es formar atletas de voleibol con valores y habilidades, promoviendo el deporte y la salud en Riobamba.</p>
          </div>

          {/* Visión */}
          <div className={styles.box}>
            <h3>Visión</h3>
            <p>Ser la mejor escuela de voleibol en la región, reconocida por su excelencia y valores deportivos.</p>
          </div>
        </div>
        
        {/* Información de Contacto */}
        <div className={styles.contactSection}>
          <h3>📞 Información de Contacto</h3>
          <div className={styles.contactGrid}>
            <div className={styles.contactBox}>
              <h4>📱 Teléfonos</h4>
              <div className={styles.phoneNumbers}>
                <a href="tel:+593963840728" className={styles.phoneLink}>
                  📞 0963 840 728
                </a>
                <a href="tel:+593992680789" className={styles.phoneLink}>
                  📞 0992 680 789
                </a>
              </div>
            </div>

            <div className={styles.contactBox}>
              <h4>💬 WhatsApp</h4>
              <a 
                href="https://wa.me/593963840728?text=Hola,%20me%20interesa%20información%20sobre%20Riovoley"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappLink}
              >
                <span className={styles.whatsappIcon}>📱</span>
                Escribenos por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className={styles.socialSection}>
          <h3>🌐 Síguenos en Redes Sociales</h3>
          <div className={styles.socialGrid}>
            <a 
              href="https://www.instagram.com/rio.voley" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <div className={styles.socialCard}>
                <span className={styles.socialIcon}>📷</span>
                <div className={styles.socialInfo}>
                  <h4>Instagram</h4>
                  <p>@rio.voley</p>
                  <span className={styles.socialDesc}>Fotos y momentos especiales</span>
                </div>
              </div>
            </a>

            <a 
              href="https://www.tiktok.com/@riovoley" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <div className={styles.socialCard}>
                <span className={styles.socialIcon}>🎵</span>
                <div className={styles.socialInfo}>
                  <h4>TikTok</h4>
                  <p>@riovoley</p>
                  <span className={styles.socialDesc}>Videos de entrenamientos y bloopers</span>
                </div>
              </div>
            </a>

            <a 
              href="https://wa.me/593963840728" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              <div className={styles.socialCard}>
                <span className={styles.socialIcon}>💬</span>
                <div className={styles.socialInfo}>
                  <h4>WhatsApp</h4>
                  <p>+593 96 384 0728</p>
                  <span className={styles.socialDesc}>Contacto directo</span>
                </div>
              </div>
            </a>
          </div>
        </div>
        
        {/* Ubicación y mapa */}
        <div className={styles.mapContainer}>
          <h3>📍 Dónde Encontrarnos</h3>
          <div className={styles.locationInfo}>
            <p><strong>Dirección:</strong> Coliseo de Riovoley, Riobamba</p>
            <p>
              <strong>Horarios de Atención:</strong>{' '}
              <Link to="/horarios" className={styles.horariosLink}>
                Ver Horarios
              </Link>
            </p>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4798.2580374811805!2d-78.6524372242609!3d-1.6507429983339346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d3a9bdb6b16f71%3A0xb4f5ad9daa85eb65!2sEscuela%20de%20Voleibol%20%22RIOVOLEY%22!5e1!3m2!1ses-419!2sec!4v1753062935200!5m2!1ses-419!2sec."
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            title="Ubicación Escuela"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;