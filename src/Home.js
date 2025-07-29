// src/Home.js
import React from 'react';

function Home() {

  const handleGoToLogin = () => {
    window.location.href = '/login'; // Asumiendo que tienes una ruta /login
  };

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '3em',
        color: '#fff',
        marginBottom: '20px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>
        ¡Bienvenido a Riovoley!
      </h1>
      <p style={{
        fontSize: '1.5em',
        color: '#fff',
        marginBottom: '40px',
        maxWidth: '600px'
      }}>
        La mejor escuela de voleibol para potenciar tu talento y disfrutar en equipo.
      </p>
      <button
        onClick={handleGoToLogin}
        style={{
          padding: '15px 30px',
          fontSize: '1.2em',
          color: '#fff',
          background: '#ff7e5f',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'background 0.3s'
        }}
        onMouseOver={(e) => e.target.style.background = '#feb47b'}
        onFocus={(e) => e.target.style.background = '#feb47b'}
        onMouseOut={(e) => e.target.style.background = '#ff7e5f'}
        onBlur={(e) => e.target.style.background = '#ff7e5f'}
      >
        Comenzar
      </button>
    </div>
  );
}

export default Home;    