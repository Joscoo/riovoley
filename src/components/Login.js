// src/components/Login.js
import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../config/supabase';

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

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Verificar si hay un usuario logueado al cargar el componente
  useEffect(() => {
    checkUser();
    
    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
        
        // Solo cargar perfil si es un evento de login, no en cada cambio
        if (event === 'SIGNED_IN') {
          await loadUserProfile(session.user);
        }
        
        // Llamar callback si se proporciona
        if (onLoginSuccess) {
          onLoginSuccess(session.user);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsLoggedIn(false);
      }
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => subscription.unsubscribe();
  }, [onLoginSuccess]);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoggedIn(true);
      
      // Cargar perfil del usuario
      await loadUserProfile(currentUser);
      
      if (onLoginSuccess) {
        onLoginSuccess(currentUser);
      }
    }
  };

  const loadUserProfile = async (user) => {
    // Evitar cargar el perfil si ya está cargado para el mismo usuario
    if (userProfile && userProfile.id === user.id) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, organization_id, full_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error al obtener perfil:', error);
        setUserProfile(null);
      } else {
        console.log('👤 Perfil cargado en Login:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error en loadUserProfile:', error);
      setUserProfile(null);
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

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMensaje('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setMensaje('Tu cuenta no ha sido confirmada. Revisa tu email.');
        } else {
          setMensaje('Error al iniciar sesión: ' + error.message);
        }
      } else {
        setMensaje('¡Inicio de sesión exitoso!');
        // Limpiar formulario
        setEmail('');
        setPassword('');
      }
    } catch (error) {
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

  if (isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.welcomeCard}>
          <h2 style={styles.title}>¡Bienvenido!</h2>
          
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
                backgroundColor: getRoleColor(userProfile?.role)
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

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={isLoading}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={isLoading}
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading || !email || !password}
            style={{
              ...styles.loginButton,
              ...(isLoading || !email || !password ? styles.disabledButton : {})
            }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
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
    </div>
  );
}

// Estilos inline para el componente
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  loginCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
    fontSize: '28px',
    fontWeight: 'bold'
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
    fontWeight: '500',
    color: '#555',
    fontSize: '14px'
  },
  input: {
    padding: '12px',
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'border-color 0.2s ease',
    outline: 'none'
  },
  loginButton: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '10px'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  logoutButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '20px'
  },
  userInfo: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#555'
  },
  infoValue: {
    color: '#333'
  },
  roleTag: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px'
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  }
};

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