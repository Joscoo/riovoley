import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import styles from '../styles/Navbar.module.css';

// Función auxiliar para obtener color del rol
const getRoleColor = (role) => {
  const roleColors = {
    'admin': '#dc3545',
    'moderador': '#fd7e14',
    'usuario': '#28a745', 
    'premium': '#6f42c1',
    'invitado': '#6c757d'
  };
  return roleColors[role?.toLowerCase()] || '#17a2b8';
};

const Navbar = ({ user, userProfile, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (onLogout) {
        onLogout();
      }
      setMenuOpen(false); // Cerrar menú móvil después del logout
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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

        {/* Botón de login/logout para pantallas grandes */}
        {user ? (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user.email}</span>
              {userProfile?.role && (
                <span 
                  className={styles.userRole}
                  style={{ backgroundColor: getRoleColor(userProfile.role) }}
                >
                  {userProfile.role}
                </span>
              )}
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <Link to="/login" className={styles.loginButton}>
            Iniciar Sesión
          </Link>
        )}
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
          {user ? (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserInfo}>
                <span>{user.email}</span>
                {userProfile?.role && (
                  <span 
                    className={styles.mobileUserRole}
                    style={{ backgroundColor: getRoleColor(userProfile.role) }}
                  >
                    {userProfile.role}
                  </span>
                )}
              </div>
              <button className={styles.mobileLogoutButton} onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link className={styles.mobileLoginButton} to="/login">
              Iniciar Sesión
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

// PropTypes validation
Navbar.propTypes = {
  user: function(props, propName, componentName) {
    const user = props[propName];
    if (user !== null && user !== undefined && (typeof user !== 'object' || !user.email)) {
      return new Error(
        'Invalid prop `' + propName + '` supplied to `' + componentName + 
        '`. Expected null or an object with email property.'
      );
    }
  },
  userProfile: function(props, propName, componentName) {
    const userProfile = props[propName];
    if (userProfile !== null && userProfile !== undefined && typeof userProfile !== 'object') {
      return new Error(
        'Invalid prop `' + propName + '` supplied to `' + componentName + 
        '`. Expected null or an object.'
      );
    }
  },
  onLogout: function(props, propName, componentName) {
    if (props[propName] && typeof props[propName] !== 'function') {
      return new Error(
        'Invalid prop `' + propName + '` of type `' + typeof props[propName] +
        '` supplied to `' + componentName + '`, expected `function`.'
      );
    }
  }
};

export default Navbar;