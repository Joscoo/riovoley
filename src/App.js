import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar'; // Con mayúscula
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import Horarios from './components/Horarios';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import AdminPanel from './components/admin/AdminPanel';
import TrainerPanel from './components/trainer/TrainerPanel';
import StudentPanel from './components/student/StudentPanel';
import { getCurrentUser } from './config/supabase';
import { useUserProfile } from './hooks/useUserProfile';

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profile: userProfile } = useUserProfile(user);
  const navigate = useNavigate();

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
    navigate('/');
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
    <Routes>
      <Route path="/" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><HomePage /></>} />
      <Route path="/sobre" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><AboutUs /></>} />
      <Route path="/horarios" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><Horarios /></>} />
      <Route path="/login" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><Login onLoginSuccess={handleLoginSuccess} /></>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><AdminPanel user={user} /></>} />
      <Route path="/entrenador" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><TrainerPanel user={user} /></>} />
      <Route path="/estudiante" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><StudentPanel user={user} /></>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
