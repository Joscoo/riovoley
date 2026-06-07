import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import AboutUs from './components/AboutUs';
import Horarios from './components/Horarios';
import { Login, ResetPassword } from './features/auth-session';
import { useUserProfile } from './features/auth-profile';
import { getCurrentUser } from './config/supabase';
import { ToastProvider } from './contexts/ToastContext';
import { useToast } from './contexts/ToastContext';
import { mobileDeviceRepository } from './shared/infrastructure/mobile';
import { Button, Card, RenderProfileProvider } from './shared/ui';
import {
  applyAppUpdate,
  checkForAppUpdate,
  downloadAppUpdate,
  initializeMobileAppBridge,
  initializeOtaUpdates,
  initializePushForAuthenticatedUser,
  notifyOtaAppReady,
  subscribeToForegroundPushNotifications,
  subscribeToOtaState,
  subscribeToDeepLinks,
  subscribeToPushRegistration,
  teardownPushForAuthenticatedUser,
} from './shared/platform';

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
  const [pushToken, setPushToken] = useState(null);
  const [otaState, setOtaState] = useState(null);
  const { profile: userProfile } = useUserProfile(user);
  const navigate = useNavigate();
  const previousUserRef = useRef(null);
  const activePushUserRef = useRef(null);
  const { info, warning, error: showError } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    void initializeMobileAppBridge();
    void initializeOtaUpdates();
    void notifyOtaAppReady();

    return subscribeToDeepLinks(({ route }) => {
      if (!route) return;
      navigate(route);
    });
  }, [navigate]);

  useEffect(() => subscribeToOtaState((state) => {
    setOtaState(state);
  }), []);

  useEffect(() => subscribeToPushRegistration((token) => {
    setPushToken(token);
  }), []);

  useEffect(() => subscribeToForegroundPushNotifications((notification) => {
    const title = notification?.title || 'Nueva notificacion';
    const body = notification?.body || 'Tienes una novedad en RioVoley.';
    info(`${title}: ${body}`, 5500);
  }), [info]);

  useEffect(() => {
    const previousUser = previousUserRef.current;
    const nextUserId = user?.id || null;
    const previousUserId = previousUser?.id || null;

    if (nextUserId && activePushUserRef.current !== nextUserId) {
      activePushUserRef.current = nextUserId;
      void initializePushForAuthenticatedUser(user).catch((pushError) => {
        // eslint-disable-next-line no-console
        console.error('Error inicializando push autenticado:', pushError);
      });
    }

    if (!user?.id && previousUser?.id && pushToken) {
      void mobileDeviceRepository.deactivateDeviceToken({
        userId: previousUser.id,
        deviceToken: pushToken,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error desactivando token push:', error);
      });
    }

    if (user?.id && pushToken) {
      void mobileDeviceRepository.upsertDeviceToken({
        userId: user.id,
        deviceToken: pushToken,
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error registrando token push:', error);
      });
    }

    if (!nextUserId && previousUserId) {
      activePushUserRef.current = null;
      void teardownPushForAuthenticatedUser();
    }

    previousUserRef.current = user;
  }, [pushToken, user]);

  useEffect(() => {
    if (otaState?.status === 'available' && otaState?.availableUpdate?.version) {
      info(`Nueva version OTA disponible: ${otaState.availableUpdate.version}`, 5000);
    }

    if (otaState?.status === 'failed' && otaState?.error) {
      showError(otaState.error, 6500);
    }
  }, [info, otaState?.availableUpdate?.version, otaState?.error, otaState?.status, showError]);

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

  const handleCheckOtaUpdate = async () => {
    try {
      const result = await checkForAppUpdate();
      if (!result?.available) {
        warning('No hay una nueva version OTA disponible en este momento.', 4000);
      }
    } catch (checkError) {
      showError(checkError.message || 'No se pudo verificar la actualizacion OTA.', 5000);
    }
  };

  const handleDownloadOtaUpdate = async () => {
    try {
      await downloadAppUpdate();
    } catch (downloadError) {
      showError(downloadError.message || 'No se pudo descargar la actualizacion OTA.', 5000);
    }
  };

  const handleApplyOtaUpdate = async () => {
    try {
      await applyAppUpdate();
    } catch (applyError) {
      showError(applyError.message || 'No se pudo aplicar la actualizacion OTA.', 5000);
    }
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
      {otaState?.supported ? (
        <div className="fixed bottom-4 right-4 z-[1200] w-[min(92vw,380px)]">
          <Card className="border-rv-gold/35 bg-[linear-gradient(145deg,rgba(8,15,33,0.95)_0%,rgba(30,58,138,0.88)_100%)] text-white shadow-2xl" padding="sm">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-rv-gold">Actualizaciones</p>
                  <h2 className="text-base font-black">Estado OTA Android</h2>
                </div>
                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-bold uppercase">
                  {otaState.otaChannel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="font-bold uppercase text-white/70">Nativa</p>
                  <p className="mt-1 font-semibold">{otaState.nativeVersion || 'n/d'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="font-bold uppercase text-white/70">Bundle</p>
                  <p className="mt-1 font-semibold">{otaState.otaBundleVersion || otaState.builtinVersion || 'builtin'}</p>
                </div>
              </div>

              {otaState.availableUpdate?.version ? (
                <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  Nueva version disponible: <strong>{otaState.availableUpdate.version}</strong>
                </div>
              ) : null}

              {otaState.status === 'downloading' ? (
                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-rv-gold transition-all" style={{ width: `${Math.max(6, otaState.progress || 0)}%` }} />
                  </div>
                  <p className="text-xs text-slate-200">Descargando actualizacion... {Math.round(otaState.progress || 0)}%</p>
                </div>
              ) : null}

              {otaState.lastFailure?.message ? (
                <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  {otaState.lastFailure.message}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleCheckOtaUpdate}>
                  Buscar update
                </Button>
                {otaState.status === 'available' ? (
                  <Button size="sm" variant="secondary" onClick={handleDownloadOtaUpdate}>
                    Descargar
                  </Button>
                ) : null}
                {otaState.status === 'ready_to_apply' ? (
                  <Button size="sm" variant="secondary" onClick={handleApplyOtaUpdate}>
                    Aplicar
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      ) : null}
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
