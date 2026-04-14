import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '../config/supabase';
import { FaUser, FaUserShield, FaChalkboardTeacher, FaBars } from 'react-icons/fa';
import NotificationBell from './NotificationBell';
import { cn } from '../lib/cn';

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
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  const role = userProfile?.role?.toLowerCase();
  const isLandingRoute = location.pathname === '/' || location.pathname === '/sobre' || location.pathname === '/horarios';

  const navLinkClass = 'inline-flex min-h-[48px] items-center rounded-xl px-5 py-3 text-[1.03rem] font-semibold text-slate-100 transition-all duration-200 hover:bg-rv-gold/10 hover:text-rv-gold';
  const roleLinkClass = {
    administrador: 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-[0_2px_8px_rgba(220,53,69,0.3)] hover:-translate-y-0.5 hover:text-white hover:shadow-[0_4px_12px_rgba(220,53,69,0.45)]',
    entrenador: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_2px_8px_rgba(253,126,20,0.3)] hover:-translate-y-0.5 hover:text-white hover:shadow-[0_4px_12px_rgba(253,126,20,0.45)]',
    estudiante: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_2px_8px_rgba(0,123,255,0.3)] hover:-translate-y-0.5 hover:text-white hover:shadow-[0_4px_12px_rgba(0,123,255,0.45)]'
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideNav = navRef.current?.contains(event.target);
      const clickedInsideMenu = mobileMenuRef.current?.contains(event.target);

      if (!clickedInsideNav && !clickedInsideMenu) {
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

  useEffect(() => {
    if (!menuOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
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
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-[1200] isolate flex h-[56px] w-full max-w-full items-center justify-between overflow-visible border-b-2 border-rv-gold/20 bg-gradient-to-br from-rv-dark/95 to-rv-deepBlue/90 pl-1 pr-1 pt-[env(safe-area-inset-top)] shadow-[0_4px_30px_rgba(0,0,0,0.3),0_0_60px_rgba(255,215,0,0.1)] backdrop-blur-[20px] mobile:h-[65px] mobile:pl-3 mobile:pr-3 tablet:h-[70px] tablet:px-5 desktop:px-10"
        ref={navRef}
      >
      <Link to="/" className="group flex shrink-0 items-center no-underline">
        <img 
          src="/images/logoRio.png" 
          alt="Logo Riovoley" 
          className="mr-0 h-9 w-auto rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.02] mobile:mr-2 mobile:h-10 tablet:mr-3 tablet:h-12 xl:h-14"
        />
        <h1 className="hidden max-w-[180px] truncate bg-gradient-to-br from-white to-rv-gold bg-clip-text text-[1.35rem] font-black tracking-wide text-transparent transition-all duration-300 group-hover:brightness-110 xl:block">
          Riovoley
        </h1>
      </Link>

      <div className="ml-auto hidden items-center gap-4 xl:flex">
        <ul className="m-0 flex list-none items-center gap-2 p-0 desktop:gap-3">
          <li><Link to="/" className={navLinkClass}>Inicio</Link></li>
          <li><Link to="/sobre" className={navLinkClass}>Sobre Nosotros</Link></li>
          <li><Link to="/horarios" className={navLinkClass}>Horarios</Link></li>
          {user && role === 'estudiante' && (
            <li>
              <Link to="/estudiante" className={cn(navLinkClass, roleLinkClass.estudiante)}>
                <FaUser className="mr-1.5" /> Mi Perfil
              </Link>
            </li>
          )}
          {role === 'entrenador' && (
            <li>
              <Link to="/entrenador" className={cn(navLinkClass, roleLinkClass.entrenador)}>
                <FaChalkboardTeacher className="mr-1.5" /> Panel Entrenador
              </Link>
            </li>
          )}
          {role === 'administrador' && (
            <li>
              <Link to="/admin" className={cn(navLinkClass, roleLinkClass.administrador)}>
                <FaUserShield className="mr-1.5" /> Panel Admin
              </Link>
            </li>
          )}
        </ul>

        {user && role && (
          <NotificationBell userRole={userProfile.role} />
        )}

        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end gap-1 desktop:flex">
              <span className="text-sm font-medium text-rv-gold">{user.email}</span>
              {userProfile?.role && (
                <span 
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: getRoleColor(userProfile.role) }}
                >
                  {userProfile.role}
                </span>
              )}
            </div>
            <button
              className="rv-touch-target rounded-lg border border-red-500/50 bg-gradient-to-br from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-red-700 hover:to-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <Link to="/login" className="rv-touch-target inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-rv-gold to-yellow-400 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.4px] text-rv-dark shadow-rv-gold transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105">
            Iniciar Sesión
          </Link>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5 xl:hidden">
        {user && role && (
          <NotificationBell userRole={userProfile.role} />
        )}

        <button
          className="z-[1202] inline-flex h-12 w-12 items-center justify-center rounded-lg text-2xl text-white transition-all duration-200 hover:bg-white/10 mobile:h-[50px] mobile:w-[50px]"
          onClick={toggleMenu}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          type="button"
        >
          <FaBars />
        </button>
      </div>

      </nav>

      <div
        className={cn(
          'fixed inset-0 z-[1199] bg-black/45 transition-opacity duration-300 xl:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMenuOpen(false)}
        aria-hidden={menuOpen ? 'false' : 'true'}
      />

      <ul
        ref={mobileMenuRef}
        className={cn(
          'fixed bottom-0 right-0 top-[calc(56px+env(safe-area-inset-top))] z-[1201] m-0 flex w-[86vw] max-w-[340px] list-none flex-col gap-2 border-l border-white/10 bg-gradient-to-br from-slate-800/98 to-slate-700/98 p-3 pb-5 shadow-[-12px_0_24px_rgba(0,0,0,0.3)] backdrop-blur-md transition-transform duration-300 mobile:top-[calc(65px+env(safe-area-inset-top))] tablet:top-[calc(70px+env(safe-area-inset-top))] xl:hidden',
          isLandingRoute ? 'overflow-y-hidden' : 'overflow-y-auto',
          menuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        )}
      >
        <li>
          <Link className={cn('flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 text-center font-semibold text-white', isLandingRoute ? 'min-h-[42px] py-2.5' : 'min-h-[48px] py-3')} to="/" onClick={() => setMenuOpen(false)}>
            Inicio
          </Link>
        </li>
        <li>
          <Link className={cn('flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 text-center font-semibold text-white', isLandingRoute ? 'min-h-[42px] py-2.5' : 'min-h-[48px] py-3')} to="/sobre" onClick={() => setMenuOpen(false)}>
            Sobre Nosotros
          </Link>
        </li>
        <li>
          <Link className={cn('flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-4 text-center font-semibold text-white', isLandingRoute ? 'min-h-[42px] py-2.5' : 'min-h-[48px] py-3')} to="/horarios" onClick={() => setMenuOpen(false)}>
            Horarios
          </Link>
        </li>
        {user && role === 'estudiante' && (
          <li>
            <Link className="flex min-h-[48px] items-center justify-center rounded-lg border border-blue-400/30 bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-center font-semibold text-white" to="/estudiante" onClick={() => setMenuOpen(false)}>
              <FaUser className="mr-1.5" /> Mi Perfil
            </Link>
          </li>
        )}
        {role === 'entrenador' && (
          <li>
            <Link className="flex min-h-[48px] items-center justify-center rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-3 text-center font-semibold text-white" to="/entrenador" onClick={() => setMenuOpen(false)}>
              <FaChalkboardTeacher className="mr-1.5" /> Panel Entrenador
            </Link>
          </li>
        )}
        {role === 'administrador' && (
          <li>
            <Link className={cn('flex items-center justify-center rounded-lg border border-red-400/30 bg-gradient-to-br from-red-600 to-red-700 px-4 text-center font-semibold text-white', isLandingRoute ? 'min-h-[42px] py-2.5' : 'min-h-[48px] py-3')} to="/admin" onClick={() => setMenuOpen(false)}>
              <FaUserShield className="mr-1.5" /> Panel Admin
            </Link>
          </li>
        )}
        <li>
          {user ? (
            <div className={cn('mt-1 flex flex-col rounded-lg border border-white/10 bg-white/5', isLandingRoute ? 'gap-2 p-3' : 'gap-3 p-4')}>
              {!isLandingRoute && (
                <div className="flex flex-col gap-2 text-white">
                  <span className="font-semibold text-rv-gold">{user.email}</span>
                  {userProfile?.role && (
                    <span 
                      className="w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
                      style={{ backgroundColor: getRoleColor(userProfile.role) }}
                    >
                      {userProfile.role}
                    </span>
                  )}
                </div>
              )}
              <button
                className={cn('rv-touch-target rounded-lg bg-gradient-to-br from-red-600 to-red-700 px-4 text-base font-semibold text-white transition-all duration-200 hover:brightness-105', isLandingRoute ? 'py-2' : 'py-2.5')}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link className="mt-1 flex min-h-[48px] items-center justify-center rounded-lg border-2 border-rv-gold bg-gradient-to-br from-rv-dark to-slate-800 px-4 py-3 text-center font-bold text-rv-gold" to="/login" onClick={() => setMenuOpen(false)}>
              Iniciar Sesión
            </Link>
          )}
        </li>
      </ul>
    </>
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