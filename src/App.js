import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar'; // Con mayúscula
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import Horarios from './components/Horarios';
import Login from './components/Login';
import { getCurrentUser } from './config/supabase';
import { useUserProfile } from './hooks/useUserProfile';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profile: userProfile } = useUserProfile(user);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} userProfile={userProfile} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sobre" element={<AboutUs />} />
        <Route path="/horarios" element={<Horarios />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    </Router>
  );
}

export default App;
