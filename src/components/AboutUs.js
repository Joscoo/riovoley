import React from 'react';
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
        
        {/* Ubicación y mapa */}
        <div className={styles.mapContainer}>
          <h3>Dónde Encontrarnos</h3>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4798.2580374811805!2d-78.6524372242609!3d-1.6507429983339346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d3a9bdb6b16f71%3A0xb4f5ad9daa85eb65!2sEscuela%20de%20Voleibol%20%22RIOVOLEY%22!5e1!3m2!1ses-419!2sec!4v1753062935200!5m2!1ses-419!2sec."
            width="100%"
            height="250"
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