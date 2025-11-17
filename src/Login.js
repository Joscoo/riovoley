// src/Login.js
import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import app from './config/firebase';
import styles from './styles/Login.module.css';

const auth = getAuth(app);
const db = getFirestore(app);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'Usuarios', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje('');
    setIsError(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userRef = doc(db, 'Usuarios', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setMensaje(`¡Bienvenido ${userData.nombre}!`);
        setIsError(false);
        
        // Redirect based on role
        setTimeout(() => {
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/user-dashboard');
          }
        }, 1500);
      } else {
        setMensaje('Usuario sin datos adicionales.');
        setIsError(true);
      }
    } catch (error) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      }
      
      setMensaje(errorMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMensaje('Sesión cerrada exitosamente');
      setIsError(false);
    } catch (error) {
      setMensaje('Error al cerrar sesión');
      setIsError(true);
    }
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  // Si el usuario ya está logueado, mostrar welcome card
  if (user && userData) {
    return (
      <div className={styles.pageContainer}>
        <video className={styles.videoBg} autoPlay loop muted playsInline>
          <source src="/videos/bg-video.mp4" type="video/mp4" />
        </video>
        <div className={styles.overlay}></div>

        <div className={styles.welcomeCard}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className={styles.title}>¡Bienvenido!</h1>
            <p className={styles.subtitle}>Sesión activa</p>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre</span>
              <span className={styles.infoValue}>{userData.nombre || 'No disponible'}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
            
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Rol</span>
              <span 
                className={styles.roleTag}
                style={{
                  background: userData.role === 'admin' 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)'
                }}
              >
                {userData.role || 'Usuario'}
              </span>
            </div>
          </div>

          {userData.role === 'admin' && (
            <div className={styles.adminMessage}>
              <h3 className={styles.adminTitle}>Panel de Administración</h3>
              <p className={styles.adminText}>
                Tienes acceso completo al sistema
              </p>
              <button onClick={goToAdmin} className={styles.adminButton}>
                Ir al Panel Admin
              </button>
            </div>
          )}

          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>

          {mensaje && (
            <div className={`${styles.message} ${isError ? styles.errorMessage : styles.successMessage}`}>
              {mensaje}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Formulario de login
  return (
    <div className={styles.pageContainer}>
      <video className={styles.videoBg} autoPlay loop muted playsInline>
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay}></div>
      
      {/* Partículas animadas de fondo */}
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoGlow}></div>
            <div className={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <h1 className={styles.title}>Iniciar Sesión</h1>
          <p className={styles.subtitle}>Accede a tu cuenta RioVoley</p>
          <div className={styles.decorLine}></div>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              <span className={styles.labelIcon}>📧</span>
              Correo Electrónico
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              <span className={styles.labelIcon}>🔒</span>
              Contraseña
            </label>
            <div className={styles.passwordContainer}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.passwordInput}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                disabled={loading}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <span className={styles.loader}></span>
                {' Ingresando...'}
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        {mensaje && (
          <div className={`${styles.message} ${isError ? styles.errorMessage : styles.successMessage}`}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;