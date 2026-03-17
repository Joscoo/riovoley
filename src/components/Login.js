// src/components/Login.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser } from '../config/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import ChangePasswordModal from './ChangePasswordModal';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';

// Agregar estilos de animaciones globales
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes float {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(100px) scale(0);
    opacity: 0;
  }
}

@keyframes slideInScale {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes rotateGlow {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes float3D {
  0%, 100% {
    transform: translateY(0) rotateX(0deg);
  }
  50% {
    transform: translateY(-10px) rotateX(10deg);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Media queries para responsividad */
@media (max-width: 768px) {
  body {
    overflow-x: hidden;
  }
}

@media (max-width: 480px) {
  body {
    overflow-x: hidden;
  }
}
`;
if (!document.head.querySelector('style[data-login-animations]')) {
  styleSheet.setAttribute('data-login-animations', 'true');
  document.head.appendChild(styleSheet);
}

// Hook para detectar el tamaño de la pantalla
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, isSmallMobile };
}

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [userNeedsPasswordChange, setUserNeedsPasswordChange] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();
  const { isMobile, isSmallMobile } = useIsMobile();
  
  // Usar el hook para manejar el perfil
  const { profile: userProfile, getRoleColor } = useUserProfile(user);

  // Redirigir automáticamente según el rol del usuario
  useEffect(() => {
    if (user && userProfile && !isLoading && !passwordChangeRequired && !showChangePasswordModal) {
      const userRole = userProfile.role?.toLowerCase();
      console.log('🔄 Verificando redirección:', { userRole, userProfile });
      
      // Redirigir inmediatamente según el rol
      if (userRole === 'administrador') {
        console.log('[REDIRECT] Redirigiendo a /admin');
        navigate('/admin');
      } else if (userRole === 'entrenador') {
        console.log('[REDIRECT] Redirigiendo a /entrenador');
        navigate('/entrenador');
      } else if (userRole === 'estudiante' || userRole === 'usuario') {
        console.log('[REDIRECT] Redirigiendo a /estudiante');
        navigate('/estudiante');
      } else {
        console.log('[INFO] Rol no reconocido, redirigiendo a /estudiante:', userRole);
        navigate('/estudiante');
      }
    }
  }, [user, userProfile, isLoading, navigate, passwordChangeRequired, showChangePasswordModal]);

  // Verificar si hay un usuario logueado al cargar el componente
  useEffect(() => {
    checkUser();
    
    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        const mustChangePassword = await checkFirstLogin(session.user.id);
        if (mustChangePassword) {
          setPasswordChangeRequired(true);
          setIsLoggedIn(false);
          setMensaje('Debes cambiar tu contraseña temporal para continuar.');
        } else {
          setPasswordChangeRequired(false);
          setShowChangePasswordModal(false);
          setUserNeedsPasswordChange(null);
          setIsLoggedIn(true);
        }
        
        // Llamar callback si se proporciona
        if (onLoginSuccess) {
          onLoginSuccess(session.user);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setPasswordChangeRequired(false);
        setShowChangePasswordModal(false);
        setUserNeedsPasswordChange(null);
      }
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoginSuccess]);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);

      const mustChangePassword = await checkFirstLogin(currentUser.id);
      if (mustChangePassword) {
        setPasswordChangeRequired(true);
        setIsLoggedIn(false);
      } else {
        setPasswordChangeRequired(false);
        setIsLoggedIn(true);
      }
      
      if (onLoginSuccess) {
        onLoginSuccess(currentUser);
      }
    }
  };

  const checkFirstLogin = async (userId) => {
    if (!userId) {
      return false;
    }

    const localPasswordChangedMark = localStorage.getItem(`password_changed_${userId}`);
    if (localPasswordChangedMark) {
      // Mejor esfuerzo para sincronizar first_login en backend.
      supabase
        .from('users')
        .update({ first_login: false })
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.warn('No se pudo sincronizar first_login=false desde marker local:', error.message);
          }
        });
      return false;
    }

    try {
      // Consultar la tabla users para verificar si es primer login
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, first_login, nombre, apellido')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error verificando first_login:', error);
        return false;
      }

      if (userData && userData.first_login) {
        // Mostrar modal de cambio de contraseña
        setUserNeedsPasswordChange(userData);
        setShowChangePasswordModal(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en checkFirstLogin:', error);
      return false;
    }
  };

  const handlePasswordChanged = () => {
    setShowChangePasswordModal(false);
    setUserNeedsPasswordChange(null);
    setPasswordChangeRequired(false);
    setIsLoggedIn(true);
    if (user?.id) {
      localStorage.setItem(`password_changed_${user.id}`, new Date().toISOString());
    }
    setMensaje('✓ ¡Contraseña actualizada correctamente! Ya puedes usar la plataforma.');
  };

  const updateLastLogin = async (authUser) => {
    if (!authUser?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', authUser.id);

      if (error) {
        console.error('Error actualizando last_login:', error);
      }
    } catch (error) {
      console.error('Error inesperado actualizando last_login:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    if (!email || !password) {
      setMensaje('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    // Validación adicional del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMensaje('Por favor, ingresa un email válido');
      setIsLoading(false);
      return;
    }

    console.log('🔐 Intentando login con:', { 
      email: email.trim(), 
      passwordLength: password.length 
    });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('[DEBUG] Resultado de login:', { data, error });

      if (error) {
        console.error('[ERROR] Error de autenticación:', error);
        
        // Manejo específico de errores
        if (error.message.includes('Invalid login credentials')) {
          setMensaje('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setMensaje('Tu cuenta no ha sido confirmada. Revisa tu email.');
        } else if (error.message.includes('Too many requests')) {
          setMensaje('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
        } else if (error.status === 400) {
          setMensaje(`Error de solicitud: ${error.message}. Verifica tu email y contraseña.`);
        } else {
          setMensaje('Error al iniciar sesión: ' + error.message);
        }
      } else {
        console.log('[SUCCESS] Login exitoso:', data);

        // Persistir último login para paneles administrativos y auditoría.
        await updateLastLogin(data?.user);
        
        // Verificar si el usuario necesita cambiar la contraseña
        const mustChangePassword = await checkFirstLogin(data?.user?.id);
        setPasswordChangeRequired(!!mustChangePassword);
        if (!mustChangePassword) {
          setShowChangePasswordModal(false);
          setUserNeedsPasswordChange(null);
        }
        
        setMensaje('¡Inicio de sesión exitoso!');
        // Limpiar formulario
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('💥 Error inesperado en login:', error);
      setMensaje('Error inesperado: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMensaje('Error al cerrar sesión: ' + error.message);
    } else {
      setMensaje('Sesión cerrada exitosamente');
      setEmail('');
      setPassword('');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage('');

    if (!resetEmail) {
      setResetMessage('Por favor, ingresa tu email');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetMessage('Por favor, ingresa un email válido');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Error al enviar email de recuperación:', error);
        setResetMessage('Error: ' + error.message);
      } else {
        setResetMessage('✓ Se ha enviado un enlace de recuperación a tu email');
        setResetEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setResetMessage('Error inesperado: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoggedIn) {
    const styles = getStyles(isMobile, isSmallMobile);
    return (
      <div style={styles.container}>
        {/* Video de fondo */}
        <video style={styles.videoBg} autoPlay loop muted playsInline>
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        <div style={styles.overlay}></div>

        <div style={styles.welcomeCard}>
          <div style={styles.logoSection}>
            <div style={styles.logoWrapper}>
              <div style={styles.logoGlow}></div>
              <div style={styles.logo}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.logoSvg}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            </div>
            <h1 style={styles.title}>¡Bienvenido!</h1>
            <p style={styles.subtitle}>Sesión activa</p>
          </div>
          
          <div style={styles.userInfo}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Email:</span>
              <span style={styles.infoValue}>{user?.email}</span>
            </div>
            
            {userProfile?.full_name && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Nombre:</span>
                <span style={styles.infoValue}>{userProfile.full_name}</span>
              </div>
            )}
            
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Rol:</span>
              <span style={{
                ...styles.infoValue,
                ...styles.roleTag,
                backgroundColor: getRoleColor()
              }}>
                {userProfile?.role || 'Sin rol asignado'}
              </span>
            </div>
            
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Último acceso:</span>
              <span style={styles.infoValue}>
                {user?.last_sign_in_at ? 
                  new Date(user.last_sign_in_at).toLocaleString('es-ES') : 
                  'Primera vez'
                }
              </span>
            </div>
          </div>

          {/* Mensaje especial para administradores */}
          {userProfile?.role?.toLowerCase() === 'administrador' && (
            <div style={styles.adminMessage}>
              <h3 style={styles.adminTitle}>🔴 Panel de Administración</h3>
              <p style={styles.adminText}>
                Redirigiendo al panel de administración...
              </p>
              <div style={styles.adminActions}>
                <button 
                  onClick={() => navigate('/admin')} 
                  style={styles.adminButton}
                >
                  Ir al Panel Admin
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
          >
            Cerrar Sesión
          </button>
          
          {mensaje && <p style={styles.successMessage}>{mensaje}</p>}
        </div>
      </div>
    );
  }

  const styles = getStyles(isMobile, isSmallMobile);
  
  return (
    <div style={styles.container}>
      {/* Video de fondo */}
      <video style={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>
      <div style={styles.overlay}></div>
      
      {/* Partículas animadas */}
      <div style={styles.particles}>
        {[...new Array(15)].map((_, i) => (
          <div 
            key={`particle-${i}`}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div style={styles.loginCard}>
        <div style={styles.logoSection}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoGlow}></div>
            <div style={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.logoSvg}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <h2 style={styles.title}>Iniciar Sesión</h2>
          <p style={styles.subtitle}>Accede a tu cuenta RioVoley</p>
          <div style={styles.decorLine}></div>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              <FaEnvelope style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              CORREO ELECTRÓNICO
            </label>
            <div style={styles.inputWrapper}>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              <FaLock style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              CONTRASEÑA
            </label>
            <div style={styles.passwordContainer}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.passwordInput}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading || !email || !password}
            style={{
              ...styles.loginButton,
              ...(isLoading || !email || !password ? styles.disabledButton : {})
            }}
          >
            {isLoading ? (
              <>
                <span style={styles.loader}></span>
                {' Ingresando...'}
              </>
            ) : (
              'INGRESAR'
            )}
          </button>
        </form>
        
        {/* Enlace de recuperación de contraseña */}
        <div style={styles.forgotPasswordContainer}>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            style={styles.forgotPasswordLink}
            disabled={isLoading}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        
        {mensaje && (
          <div style={{
            ...styles.message,
            ...(mensaje.includes('Error') || mensaje.includes('incorrectas') ? 
                styles.errorMessage : styles.successMessage)
          }}>
            {mensaje}
          </div>
        )}
      </div>
      
      {/* Modal de cambio de contraseña obligatorio */}
      {showChangePasswordModal && userNeedsPasswordChange && (
        <ChangePasswordModal
          user={{
            ...userNeedsPasswordChange,
            email: user?.email || userNeedsPasswordChange?.email
          }}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {/* Modal de recuperación de contraseña */}
      {showForgotPassword && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><FaKey style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Recuperar Contraseña</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>
            
            <p style={styles.modalText}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            
            <form onSubmit={handleForgotPassword} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label htmlFor="reset-email" style={styles.label}>
                  <FaEnvelope style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  CORREO ELECTRÓNICO
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={styles.input}
                  disabled={isLoading}
                  required
                />
              </div>

              {resetMessage && (
                <div style={{
                  ...styles.message,
                  ...(resetMessage.includes('Error') ? 
                      styles.errorMessage : styles.successMessage)
                }}>
                  {resetMessage}
                </div>
              )}

              <div style={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetMessage('');
                  }}
                  style={styles.modalCancelButton}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !resetEmail}
                  style={{
                    ...styles.modalSubmitButton,
                    ...(isLoading || !resetEmail ? styles.disabledButton : {})
                  }}
                >
                  {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos inline para el componente
const getStyles = (isMobile, isSmallMobile) => ({
  container: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    padding: isMobile ? '10px' : '20px',
    overflow: 'hidden'
  },
  videoBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    filter: 'brightness(0.4) blur(3px) saturate(1.3)'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(30, 58, 138, 0.4) 50%, rgba(10, 10, 10, 0.95) 100%)',
    zIndex: 1,
    pointerEvents: 'none'
  },
  particles: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none',
    overflow: 'hidden'
  },
  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'rgba(255, 215, 0, 0.6)',
    borderRadius: '50%',
    bottom: '-10px',
    animation: 'float 20s linear infinite',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.4)'
  },
  loginCard: {
    position: 'relative',
    zIndex: 2,
    maxWidth: isSmallMobile ? '100%' : isMobile ? '420px' : '480px',
    width: '100%',
    background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(30, 30, 45, 0.95) 100%)',
    backdropFilter: 'blur(30px)',
    padding: isSmallMobile ? '30px 20px' : isMobile ? '40px 30px' : '60px 45px',
    borderRadius: isSmallMobile ? '20px' : isMobile ? '25px' : '30px',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 100px rgba(255, 215, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
    animation: 'slideInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: isSmallMobile ? '30px' : isMobile ? '35px' : '45px'
  },
  logoWrapper: {
    position: 'relative',
    width: isSmallMobile ? '70px' : isMobile ? '85px' : '100px',
    height: isSmallMobile ? '70px' : isMobile ? '85px' : '100px',
    margin: isSmallMobile ? '0 auto 15px' : isMobile ? '0 auto 20px' : '0 auto 25px'
  },
  logoGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '120%',
    height: '120%',
    transform: 'translate(-50%, -50%)',
    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255, 215, 0, 0.4) 60deg, rgba(255, 215, 0, 0.8) 120deg, transparent 180deg)',
    borderRadius: '50%',
    animation: 'rotateGlow 3s linear infinite',
    filter: 'blur(15px)'
  },
  logo: {
    position: 'relative',
    width: isSmallMobile ? '70px' : isMobile ? '85px' : '100px',
    height: isSmallMobile ? '70px' : isMobile ? '85px' : '100px',
    background: 'linear-gradient(135deg, #ffd700 0%, #cc9900 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 15px 40px rgba(255, 215, 0, 0.4), inset 0 -5px 15px rgba(0, 0, 0, 0.3), inset 0 5px 15px rgba(255, 255, 255, 0.3)',
    animation: 'float3D 4s ease-in-out infinite',
    zIndex: 1
  },
  logoSvg: {
    width: isSmallMobile ? '35px' : isMobile ? '40px' : '45px',
    height: isSmallMobile ? '35px' : isMobile ? '40px' : '45px',
    stroke: '#0a0a0a',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
  },
  title: {
    fontSize: isSmallMobile ? '1.6rem' : isMobile ? '1.9rem' : '2.2rem',
    fontWeight: '900',
    margin: '0 0 12px 0',
    background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #ffe44d 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.5px',
    textShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
  },
  subtitle: {
    fontSize: isSmallMobile ? '0.9rem' : isMobile ? '0.95rem' : '1.05rem',
    color: '#94a3b8',
    margin: '0 0 20px 0',
    fontWeight: '400'
  },
  decorLine: {
    width: isSmallMobile ? '45px' : isMobile ? '55px' : '60px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
    margin: '20px auto 0',
    borderRadius: '2px',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: isSmallMobile ? '18px' : isMobile ? '20px' : '24px',
    marginTop: isSmallMobile ? '20px' : isMobile ? '25px' : '30px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: isSmallMobile ? '0.75rem' : isMobile ? '0.8rem' : '0.85rem',
    fontWeight: '600',
    color: '#f8f9fa',
    letterSpacing: '1px'
  },
  labelIcon: {
    fontSize: isSmallMobile ? '1rem' : isMobile ? '1.1rem' : '1.2rem',
    filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))'
  },
  inputWrapper: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: isSmallMobile ? '14px 18px' : isMobile ? '16px 20px' : '18px 22px',
    fontSize: isSmallMobile ? '0.95rem' : '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 215, 0, 0.2)',
    borderRadius: isSmallMobile ? '12px' : '14px',
    color: '#f8f9fa',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    width: '100%',
    padding: isSmallMobile ? '14px 55px 14px 18px' : isMobile ? '16px 58px 16px 20px' : '18px 60px 18px 22px',
    fontSize: isSmallMobile ? '0.95rem' : '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 215, 0, 0.2)',
    borderRadius: isSmallMobile ? '12px' : '14px',
    color: '#f8f9fa',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: isSmallMobile ? '1.3rem' : '1.5rem',
    width: '48px',
    height: '48px',
    minWidth: '48px',
    minHeight: '48px',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background 0.3s ease'
  },
  loginButton: {
    width: '100%',
    padding: isSmallMobile ? '16px' : isMobile ? '18px' : '20px',
    fontSize: isSmallMobile ? '0.95rem' : isMobile ? '1rem' : '1.1rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ffd700 0%, #cc9900 100%)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: isSmallMobile ? '12px' : '14px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'uppercase',
    letterSpacing: isSmallMobile ? '1px' : '2px',
    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '10px'
  },
  disabledButton: {
    background: 'rgba(255, 215, 0, 0.3)',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  },
  loader: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 0.8s linear infinite'
  },
  message: {
    padding: isSmallMobile ? '12px 16px' : '16px 20px',
    borderRadius: '12px',
    marginTop: isSmallMobile ? '15px' : '20px',
    textAlign: 'center',
    fontSize: isSmallMobile ? '0.85rem' : '0.95rem',
    fontWeight: '500',
    animation: 'slideIn 0.3s ease-out'
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    color: '#fca5a5'
  },
  successMessage: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    color: '#6ee7b7'
  },
  welcomeCard: {
    position: 'relative',
    zIndex: 2,
    maxWidth: isSmallMobile ? '100%' : isMobile ? '520px' : '600px',
    width: '100%',
    background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(30, 30, 45, 0.95) 100%)',
    backdropFilter: 'blur(30px)',
    padding: isSmallMobile ? '35px 25px' : isMobile ? '40px 30px' : '50px 40px',
    borderRadius: isSmallMobile ? '20px' : '24px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    animation: 'slideInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards'
  },
  logoutButton: {
    width: '100%',
    padding: isSmallMobile ? '14px' : '16px',
    background: 'transparent',
    color: '#f8f9fa',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: isSmallMobile ? '0.95rem' : '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '20px'
  },
  userInfo: {
    margin: isSmallMobile ? '20px 0' : '30px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: isSmallMobile ? '15px' : '20px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isSmallMobile ? '12px 16px' : '16px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    gap: isMobile ? '8px' : '0'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: isSmallMobile ? '0.8rem' : '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    color: '#f8f9fa',
    fontWeight: '500',
    fontSize: isSmallMobile ? '0.9rem' : '1rem',
    wordBreak: 'break-word'
  },
  roleTag: {
    padding: isSmallMobile ? '4px 12px' : '6px 16px',
    borderRadius: '20px',
    fontSize: isSmallMobile ? '0.75rem' : '0.85rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'white'
  },
  adminMessage: {
    margin: isSmallMobile ? '20px 0' : '30px 0',
    padding: isSmallMobile ? '18px' : '24px',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '16px',
    textAlign: 'center'
  },
  adminTitle: {
    color: '#fca5a5',
    margin: '0 0 10px 0',
    fontSize: isSmallMobile ? '1.1rem' : '1.3rem'
  },
  adminText: {
    color: '#94a3b8',
    margin: '0 0 20px 0',
    fontSize: isSmallMobile ? '0.9rem' : '1rem'
  },
  adminActions: {
    display: 'flex',
    justifyContent: 'center'
  },
  adminButton: {
    padding: isSmallMobile ? '12px 24px' : '14px 32px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: isSmallMobile ? '0.9rem' : '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
  },
  forgotPasswordContainer: {
    textAlign: 'center',
    marginTop: '15px',
    marginBottom: '15px'
  },
  forgotPasswordLink: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 215, 0, 0.9)',
    fontSize: isSmallMobile ? '0.85rem' : '0.9rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'all 0.3s ease',
    minHeight: '48px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modalContent: {
    background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(30, 58, 138, 0.95) 100%)',
    borderRadius: isSmallMobile ? '20px' : '25px',
    padding: isSmallMobile ? '25px' : '35px',
    maxWidth: isSmallMobile ? '95%' : '450px',
    width: '100%',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(20px)',
    animation: 'slideInScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid rgba(255, 215, 0, 0.2)'
  },
  modalTitle: {
    margin: 0,
    fontSize: isSmallMobile ? '1.3rem' : '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  modalCloseButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    width: '48px',
    height: '48px',
    minWidth: '48px',
    minHeight: '48px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isSmallMobile ? '0.9rem' : '1rem',
    marginBottom: '20px',
    lineHeight: '1.6'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px'
  },
  modalCancelButton: {
    flex: 1,
    padding: isSmallMobile ? '12px' : '14px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: isSmallMobile ? '0.9rem' : '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  modalSubmitButton: {
    flex: 1,
    padding: isSmallMobile ? '12px' : '14px',
    background: 'linear-gradient(135deg, #ffd700 0%, #f0c14b 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: isSmallMobile ? '0.9rem' : '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)'
  }
});

// PropTypes validation
Login.propTypes = {
  onLoginSuccess: function(props, propName, componentName) {
    if (props[propName] && typeof props[propName] !== 'function') {
      return new Error(
        'Invalid prop `' + propName + '` of type `' + typeof props[propName] +
        '` supplied to `' + componentName + '`, expected `function`.'
      );
    }
  }
};

export default Login;