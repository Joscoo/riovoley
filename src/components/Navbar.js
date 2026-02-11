import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';
import { FaUser, FaUserShield, FaChalkboardTeacher, FaBars } from 'react-icons/fa';
import styles from '../styles/Navbar.module.css';

// Función auxiliar para obtener color del rol
const getRoleColor = (role) => {
  const roleColors = {
    'administrador': '#dc3545',  // Rojo para administrador
    'entrenador': '#fd7e14',     // Naranja para entrenador
    'usuario': '#28a745'         // Verde para usuario
  };
  return roleColors[role?.toLowerCase()] || '#17a2b8';
};

const Navbar = ({ user, userProfile, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

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
    <nav className={styles.navbar} ref={navRef}>
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
          {user && userProfile?.role?.toLowerCase() === 'estudiante' && (
            <li><Link to="/estudiante" className={styles.studentLink}><FaUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Mi Perfil</Link></li>
          )}
          {userProfile?.role?.toLowerCase() === 'entrenador' && (
            <li><Link to="/entrenador" className={styles.trainerLink}><FaChalkboardTeacher style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Panel Entrenador</Link></li>
          )}
          {userProfile?.role?.toLowerCase() === 'administrador' && (
            <li><Link to="/admin" className={styles.adminLink}><FaUserShield style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Panel Admin</Link></li>
          )}
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
        <FaBars />
      </button>

      {/* Lista de enlaces móvil */}
      <ul
        className={`${styles.linksContainer} ${menuOpen ? styles.show : ''}`}
      >
        <li><Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link></li>
        <li><Link to="/sobre" onClick={() => setMenuOpen(false)}>Sobre Nosotros</Link></li>
        <li><Link to="/horarios" onClick={() => setMenuOpen(false)}>Horarios</Link></li>
        {user && userProfile?.role?.toLowerCase() === 'estudiante' && (
          <li><Link to="/estudiante" className={styles.studentLink} onClick={() => setMenuOpen(false)}><FaUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Mi Perfil</Link></li>
        )}
        {userProfile?.role?.toLowerCase() === 'entrenador' && (
          <li><Link to="/entrenador" className={styles.trainerLink} onClick={() => setMenuOpen(false)}><FaChalkboardTeacher style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Panel Entrenador</Link></li>
        )}
        {userProfile?.role?.toLowerCase() === 'administrador' && (
          <li><Link to="/admin" className={styles.adminLink} onClick={() => setMenuOpen(false)}><FaUserShield style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Panel Admin</Link></li>
        )}
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
            <Link className={styles.mobileLoginButton} to="/login" onClick={() => setMenuOpen(false)}>
              Iniciar Sesión
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
};

Navbar.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string
  }),
  userProfile: PropTypes.shape({
    role: PropTypes.string
  }),
  onLogout: PropTypes.func
};

export default Navbar;