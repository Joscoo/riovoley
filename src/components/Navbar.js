import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  return (
    <nav className={styles.navbar}>
      {/* Logo y título */}
      <Link to="/" className={styles.logoContainer}>
        <img 
          src="/images/logoRio.png" 
          alt="Logo Riovoley" 
          className={styles.logo} 
        />
        <h1 className={styles.title}>Riovoley</h1>
      </Link>

      {/* Contenedor de elementos de la derecha (solo visible en PC) */}
      <div className={styles.rightContent}>
        {/* Enlaces para pantallas grandes */}
        <ul className={styles.linksList}>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/sobre">Sobre Nosotros</Link></li>
          <li><Link to="/horarios">Horarios</Link></li>
        </ul>

        {/* Botón de login para pantallas grandes */}
        <button className={styles.loginButton}>
          Iniciar Sesión
        </button>
      </div>

      {/* Botón menú en móvil */}
      <button className={styles.menuToggle} onClick={toggleMenu}>
        ☰
      </button>

      {/* Lista de enlaces móvil */}
      <ul
        className={`${styles.linksContainer} ${menuOpen ? styles.show : ''}`}
      >
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/sobre">Sobre Nosotros</Link></li>
        <li><Link to="/horarios">Horarios</Link></li>
        <li>
          <a className={styles.mobileLoginButton} href="#login">
            Iniciar Sesión
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;