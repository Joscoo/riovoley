import React from 'react';
import styles from '../styles/HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Video de fondo */}
      <video autoPlay muted loop playsInline className={styles.videoBg}>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>

      {/* Contenido de bienvenida */}
      <div className={styles.bienvenida}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.titulo}>Bienvenidos a Riovoley</h1>
          <p className={styles.subtitulo}>
            La escuela de voleibol más prestigiosa de Riobamba. 
            Desarrollamos talento, formamos campeones y construimos sueños.
          </p>
          <a href="/sobre" className={styles.btn}>Conoce Más</a>
          <a href="/horarios" className={styles.btn}>Ver Horarios</a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;