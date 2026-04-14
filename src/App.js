import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar'; // Con mayúscula
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import Horarios from './components/Horarios';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import { getCurrentUser } from './config/supabase';
import { useUserProfile } from './hooks/useUserProfile';
import { ToastProvider } from './contexts/ToastContext';

// Code splitting: Lazy load de paneles pesados
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const TrainerPanel = lazy(() => import('./components/trainer/TrainerPanel'));
const StudentPanel = lazy(() => import('./components/student/StudentPanel'));

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    <div>
      <div style={{ marginBottom: '10px' }}>⏳ Cargando...</div>
    </div>
  </div>
);

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
      <>
        <Navbar user={null} userProfile={null} onLogout={handleLogout} />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 'calc(100vh - 65px)',
          fontSize: '18px'
        }}>
          Cargando...
        </div>
      </>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
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
    </Suspense>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}

export default App;
