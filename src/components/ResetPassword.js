// src/components/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initPasswordReset = async () => {
      // Supabase maneja automáticamente el token de la URL
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔍 Sesión actual:', session);
      
      if (session) {
        console.log('✅ Sesión de recuperación activa');
        setIsValidToken(true);
      } else {
        console.log('⏳ Esperando autenticación de Supabase...');
      }
    };

    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Evento de auth:', event);
      console.log('🔔 Sesión:', session);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ Evento de recuperación de contraseña detectado');
        setIsValidToken(true);
        setMensaje('');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ Usuario autenticado para recuperación');
        setIsValidToken(true);
        setMensaje('');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refrescado');
        setIsValidToken(true);
      }
    });

    initPasswordReset();

    // Cleanup
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMensaje('');

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setMensaje('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMensaje('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error al actualizar contraseña:', error);
        setMensaje('Error al actualizar la contraseña: ' + error.message);
      } else {
        setMensaje('✅ Contraseña actualizada correctamente. Redirigiendo...');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setMensaje('Error inesperado: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Video de fondo */}
      <video style={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>
      <div style={styles.overlay}></div>

      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logoWrapper}>
            <div style={styles.logoGlow}></div>
            <div style={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.logoSvg}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <h2 style={styles.title}>🔑 Restablecer Contraseña</h2>
          <p style={styles.subtitle}>Ingresa tu nueva contraseña</p>
          <div style={styles.decorLine}></div>
        </div>

        {!isValidToken ? (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <p style={styles.errorText}>
              El enlace de recuperación es inválido o ha expirado.
            </p>
            <button 
              onClick={() => navigate('/login')}
              style={styles.backButton}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="new-password" style={styles.label}>
                <span style={styles.labelIcon}>🔒</span>
                {' '}NUEVA CONTRASEÑA
              </label>
              <div style={styles.passwordContainer}>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.passwordInput}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                  disabled={isLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <small style={styles.hint}>Mínimo 6 caracteres</small>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="confirm-password" style={styles.label}>
                <span style={styles.labelIcon}>🔒</span>
                {' '}CONFIRMAR CONTRASEÑA
              </label>
              <div style={styles.passwordContainer}>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.passwordInput}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              style={{
                ...styles.submitButton,
                ...(isLoading || !newPassword || !confirmPassword ? styles.disabledButton : {})
              }}
            >
              {isLoading ? (
                <>
                  <span style={styles.loader}></span>
                  {' Actualizando...'}
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>

            {mensaje && (
              <div style={{
                ...styles.message,
                ...(mensaje.includes('Error') || mensaje.includes('inválido') ? 
                    styles.errorMessage : styles.successMessage)
              }}>
                {mensaje}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
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
    background: 'linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(30,58,138,0.4) 50%, rgba(10,10,10,0.95) 100%)',
    zIndex: 1
  },
  card: {
    position: 'relative',
    zIndex: 2,
    background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(30, 58, 138, 0.85) 100%)',
    backdropFilter: 'blur(25px)',
    borderRadius: '30px',
    padding: '45px',
    maxWidth: '480px',
    width: '100%',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    animation: 'slideInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards'
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '35px'
  },
  logoWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: '20px'
  },
  logoGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4), transparent 70%)',
    filter: 'blur(25px)',
    animation: 'pulse 3s ease-in-out infinite'
  },
  logo: {
    position: 'relative',
    width: '85px',
    height: '85px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #ffd700 0%, #f0c14b 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 15px 40px rgba(255, 215, 0, 0.4)',
    border: '3px solid rgba(255, 255, 255, 0.2)'
  },
  logoSvg: {
    width: '40px',
    height: '40px',
    color: '#1a1a2e'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.5px'
  },
  subtitle: {
    margin: '0 0 15px 0',
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500'
  },
  decorLine: {
    width: '60px',
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
    margin: '0 auto',
    borderRadius: '2px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: 'rgba(255, 215, 0, 0.95)',
    fontSize: '0.8rem',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  labelIcon: {
    fontSize: '1rem'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    width: '100%',
    padding: '16px 50px 16px 20px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    borderRadius: '12px',
    color: '#f8f9fa',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  passwordToggle: {
    position: 'absolute',
    right: '15px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.3rem',
    padding: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease'
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.8rem',
    marginTop: '4px'
  },
  submitButton: {
    width: '100%',
    padding: '18px',
    background: 'linear-gradient(135deg, #ffd700 0%, #f0c14b 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.4)',
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  loader: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(26, 26, 46, 0.3)',
    borderTopColor: '#1a1a2e',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    display: 'inline-block'
  },
  message: {
    padding: '15px 20px',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '10px'
  },
  successMessage: {
    background: 'rgba(40, 167, 69, 0.15)',
    color: '#4ade80',
    border: '2px solid rgba(40, 167, 69, 0.4)'
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ff6b6b',
    border: '2px solid rgba(239, 68, 68, 0.4)'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '30px 20px'
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.1rem',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  backButton: {
    padding: '14px 30px',
    background: 'linear-gradient(135deg, #ffd700 0%, #f0c14b 100%)',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.4)'
  }
};

export default ResetPassword;
