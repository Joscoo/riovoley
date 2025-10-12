// src/LoginSupabase.js
import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from './config/supabase';

function LoginSupabase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Verificar si hay un usuario logueado al cargar el componente
  useEffect(() => {
    checkUser();
    
    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoggedIn(true);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setMensaje('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setMensaje('Error: ' + error.message);
      } else {
        setMensaje('¡Inicio de sesión exitoso!');
        // El usuario se actualizará automáticamente por el listener
      }
    } catch (error) {
      setMensaje('Error inesperado: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setMensaje('');

    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        setMensaje('Error: ' + error.message);
      } else {
        setMensaje('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
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
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
        <h2>Bienvenido</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>ID:</strong> {user?.id}</p>
        <p><strong>Último acceso:</strong> {new Date(user?.last_sign_in_at).toLocaleString()}</p>
        
        <button 
          onClick={handleLogout} 
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginTop: '20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Cerrar Sesión
        </button>
        
        {mensaje && <p style={{ marginTop: '20px', color: 'green' }}>{mensaje}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Iniciar Sesión con Supabase</h2>
      
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ 
          width: '100%', 
          marginBottom: '10px', 
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
        disabled={isLoading}
      />
      
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ 
          width: '100%', 
          marginBottom: '10px', 
          padding: '8px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
        disabled={isLoading}
      />
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button 
          onClick={handleLogin} 
          disabled={isLoading || !email || !password}
          style={{ 
            flex: 1, 
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
        
        <button 
          onClick={handleSignUp} 
          disabled={isLoading || !email || !password}
          style={{ 
            flex: 1, 
            padding: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Cargando...' : 'Registrarse'}
        </button>
      </div>
      
      {mensaje && (
        <p style={{ 
          marginTop: '20px', 
          color: mensaje.includes('Error') ? 'red' : 'green',
          padding: '10px',
          border: `1px solid ${mensaje.includes('Error') ? 'red' : 'green'}`,
          borderRadius: '4px',
          backgroundColor: mensaje.includes('Error') ? '#ffe6e6' : '#e6ffe6'
        }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}

export default LoginSupabase;