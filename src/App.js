import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import Horarios from './components/Horarios';
import { Login, ResetPassword } from './features/auth-session';
import { useUserProfile } from './features/auth-profile';
import { getCurrentUser } from './config/supabase';
import { ToastProvider } from './contexts/ToastContext';
import { RenderProfileProvider } from './shared/ui';

const LazyAdminPanel = lazy(() => import('./features/admin-dashboard/presentation/components/AdminPanel'));
const LazyTrainerPanel = lazy(() => import('./features/trainer-dashboard/presentation/components/TrainerPanel'));
const StudentPanel = lazy(() => import('./features/student-dashboard/presentation/components/StudentPanel'));

const LoadingFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-rv-dark text-base font-semibold text-slate-100">
    Cargando...
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 65px)',
            fontSize: '18px',
            background: '#0a0a0a',
            color: '#e2e8f0',
          }}
        >
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
        <Route path="/admin" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><LazyAdminPanel user={user} /></>} />
        <Route path="/entrenador" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><LazyTrainerPanel user={user} /></>} />
        <Route path="/estudiante" element={<><Navbar user={user} userProfile={userProfile} onLogout={handleLogout} /><StudentPanel user={user} /></>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ToastProvider>
      <RenderProfileProvider>
        <Router>
          <AppContent />
        </Router>
      </RenderProfileProvider>
    </ToastProvider>
  );
}

export default App;