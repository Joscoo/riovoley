import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaEye, FaEyeSlash, FaKey, FaLock, FaUserShield } from 'react-icons/fa';
import { authSessionService } from '../../authSessionService';
import { useUserProfile } from '../../../auth-profile';
import { APP_RESET_PASSWORD_URL } from '../../../../config/appUrls';
import { cn } from '../../../../lib/cn';
import { deferAuthEvent } from '../utils/deferAuthEvent';
import ChangePasswordModal from './ChangePasswordModal';
import { PageShell } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { Button } from '../../../../shared/ui';
import { StatusBadge } from '../../../../shared/ui';

const getRoleBadgeClass = (role) => {
  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === 'administrador') return 'bg-[#2E3192] text-white';
  if (normalizedRole === 'entrenador') return 'bg-[#F9B233] text-slate-900';
  return 'bg-[#355FB3] text-white';
};

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [userNeedsPasswordChange, setUserNeedsPasswordChange] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const isCompletingPasswordChangeRef = useRef(false);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  const { profile: userProfile } = useUserProfile(user);

  useEffect(() => {
    if (user && userProfile && !isLoading && !passwordChangeRequired && !showChangePasswordModal) {
      const userRole = userProfile.role?.toLowerCase();
      if (userRole === 'administrador') {
        navigate('/admin');
      } else if (userRole === 'entrenador') {
        navigate('/entrenador');
      } else {
        navigate('/estudiante');
      }
    }
  }, [isLoading, navigate, passwordChangeRequired, showChangePasswordModal, user, userProfile]);

  useEffect(() => {
    isMountedRef.current = true;
    checkUser();

    const clearAuthState = () => {
      if (!isMountedRef.current) return;
      setUser(null);
      setIsLoggedIn(false);
      setPasswordChangeRequired(false);
      setShowChangePasswordModal(false);
      setUserNeedsPasswordChange(null);
    };

    const handleAuthenticatedSession = async (event, session) => {
      if (!isMountedRef.current || !session?.user) return;

      if (isCompletingPasswordChangeRef.current) {
        setUser(session.user);
        setPasswordChangeRequired(false);
        setShowChangePasswordModal(false);
        setUserNeedsPasswordChange(null);
        setIsLoggedIn(true);
        if (onLoginSuccess) onLoginSuccess(session.user);
        return;
      }

      setUser(session.user);

      if (event === 'USER_UPDATED') {
        setPasswordChangeRequired(false);
        setShowChangePasswordModal(false);
        setUserNeedsPasswordChange(null);
        setIsLoggedIn(true);
        if (onLoginSuccess) onLoginSuccess(session.user);
        return;
      }

      const shouldEvaluateFirstLogin = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
      if (shouldEvaluateFirstLogin) {
        const mustChangePassword = await checkFirstLogin(session.user.id);
        if (!isMountedRef.current) return;

        if (mustChangePassword) {
          setPasswordChangeRequired(true);
          setIsLoggedIn(false);
          setMensaje('Debes cambiar tu contraseña temporal para continuar.');
        } else {
          setPasswordChangeRequired(false);
          setShowChangePasswordModal(false);
          setUserNeedsPasswordChange(null);
          setIsLoggedIn(true);
        }
      } else {
        setPasswordChangeRequired(false);
        setShowChangePasswordModal(false);
        setUserNeedsPasswordChange(null);
        setIsLoggedIn(true);
      }

      if (onLoginSuccess) {
        onLoginSuccess(session.user);
      }
    };

    const {
      data: { subscription }
    } = authSessionService.onAuthStateChange(
      deferAuthEvent((event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          clearAuthState();
          return;
        }

        void handleAuthenticatedSession(event, session);
      })
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoginSuccess]);

  const checkUser = async () => {
    const currentUser = await authSessionService.getCurrentUser();
    if (!currentUser || !isMountedRef.current) return;

    setUser(currentUser);

    const mustChangePassword = await checkFirstLogin(currentUser.id);
    if (!isMountedRef.current) return;

    if (mustChangePassword) {
      setPasswordChangeRequired(true);
      setIsLoggedIn(false);
    } else {
      setPasswordChangeRequired(false);
      setIsLoggedIn(true);
    }

    if (onLoginSuccess) {
      onLoginSuccess(currentUser);
    }
  };

  const checkFirstLogin = async (userId) => {
    if (!userId || isCompletingPasswordChangeRef.current) return false;

    try {
      const userData = await authSessionService.checkFirstLogin(userId);
      if (userData) {
        setUserNeedsPasswordChange(userData);
        setShowChangePasswordModal(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en checkFirstLogin:', error);
      return false;
    }
  };

  const handlePasswordChanged = async () => {
    isCompletingPasswordChangeRef.current = true;
    setShowChangePasswordModal(false);
    setUserNeedsPasswordChange(null);
    setPasswordChangeRequired(false);
    setIsLoggedIn(true);
    setMensaje('Contraseña actualizada correctamente. Ya puedes usar la plataforma.');

    try {
      const currentUser = await authSessionService.getCurrentUser();
      if (!currentUser) return;

      setUser(currentUser);
      if (onLoginSuccess) {
        onLoginSuccess(currentUser);
      }

      const role = (await authSessionService.getUserRole(currentUser.id))?.toLowerCase();
      if (role === 'administrador') {
        navigate('/admin');
      } else if (role === 'entrenador') {
        navigate('/entrenador');
      } else {
        navigate('/estudiante');
      }
    } catch (error) {
      console.error('Error finalizando flujo post-cambio de contraseña:', error);
    } finally {
      setTimeout(() => {
        isCompletingPasswordChangeRef.current = false;
      }, 5000);
    }
  };

  const updateLastLogin = async (authUser) => {
    try {
      await authSessionService.updateLastLogin(authUser);
    } catch (error) {
      console.error('Error inesperado actualizando last_login:', error);
    }
  };

  const checkLoginAllowed = async (normalizedEmail) => {
    try {
      const row = await authSessionService.checkLoginAllowed(normalizedEmail);
      return row || { allowed: true };
    } catch (error) {
      console.error('Error inesperado en pre-check de login:', error);
      return { allowed: true };
    }
  };

  const recordLoginAttempt = async (normalizedEmail, success, errorCode = null) => {
    try {
      await authSessionService.recordLoginAttempt(normalizedEmail, success, errorCode);
    } catch (error) {
      console.error('Error inesperado registrando intento de login:', error);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMensaje('');

    if (!email || !password) {
      setMensaje('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMensaje('Por favor, ingresa un email valido');
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const lockStatus = await checkLoginAllowed(normalizedEmail);
      if (lockStatus?.allowed === false) {
        const retryAfter = Math.max(1, Number(lockStatus?.retry_after_seconds || 0));
        setMensaje(`Demasiados intentos fallidos. Intenta nuevamente en ${retryAfter} segundos.`);
        return;
      }

      let data = null;
      try {
        data = await authSessionService.signIn(normalizedEmail, password);
      } catch (error) {
        await recordLoginAttempt(normalizedEmail, false, error?.code || error?.name || null);
        if (error.message.includes('Too many requests')) {
          setMensaje('Demasiados intentos. Espera unos minutos e intentalo de nuevo.');
        } else {
          setMensaje('Email o contraseña inválidos.');
        }
        return;
      }

      await recordLoginAttempt(normalizedEmail, true);
      await updateLastLogin(data?.user);

      const mustChangePassword = await checkFirstLogin(data?.user?.id);
      setPasswordChangeRequired(Boolean(mustChangePassword));
      if (!mustChangePassword) {
        setShowChangePasswordModal(false);
        setUserNeedsPasswordChange(null);
      }

      setMensaje('Inicio de sesión exitoso.');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Error inesperado en login:', error);
      setMensaje(`Error inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authSessionService.signOut();
      setMensaje('Sesión cerrada exitosamente');
      setEmail('');
      setPassword('');
    } catch (error) {
      setMensaje(`Error al cerrar sesión: ${error.message}`);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setResetMessage('');

    if (!resetEmail) {
      setResetMessage('Por favor, ingresa tu email');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetMessage('Por favor, ingresa un email valido');
      setIsLoading(false);
      return;
    }

    try {
      await authSessionService.requestPasswordReset(resetEmail.trim(), APP_RESET_PASSWORD_URL);
      setResetMessage('Se ha enviado un enlace de recuperacion a tu email.');
      setResetEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
      }, 3000);
    } catch (error) {
      setResetMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const messageClassName =
    mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('inval')
      ? 'border-red-400/45 bg-red-500/15 text-red-200'
      : 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200';

  return (
    <PageShell contentClassName="px-4 py-10 mobile:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-xl items-center justify-center">
        <Card padding="lg" className="w-full border-rv-gold/30 bg-[linear-gradient(140deg,rgba(12,12,20,0.95)_0%,rgba(30,58,138,0.66)_100%)]">
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-4 h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-rv-gold/20 blur-xl" aria-hidden="true" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-rv-gold to-amber-400 text-rv-dark shadow-rv-gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-white to-rv-gold bg-clip-text text-3xl font-black text-transparent mobile:text-4xl">
              {isLoggedIn ? 'Bienvenido' : 'Iniciar Sesión'}
            </h1>
            <p className="mt-2 text-sm text-slate-200">{isLoggedIn ? 'Sesión activa' : 'Accede a tu cuenta RioVoley'}</p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-rv-gold to-transparent" aria-hidden="true" />
          </div>

          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-white/15 bg-slate-900/55 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Email</p>
                  <p className="text-sm font-semibold text-white">{user?.email}</p>
                </div>
                {userProfile?.full_name ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Nombre</p>
                    <p className="text-sm font-semibold text-white">{userProfile.full_name}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Rol</p>
                  <StatusBadge className={getRoleBadgeClass(userProfile?.role)}>
                    {userProfile?.role || 'Sin rol asignado'}
                  </StatusBadge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Ultimo acceso</p>
                  <p className="text-sm font-semibold text-white">
                    {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : 'Primera vez'}
                  </p>
                </div>
              </div>

              {userProfile?.role?.toLowerCase() === 'administrador' ? (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-center">
                  <h3 className="inline-flex items-center gap-2 text-lg font-bold text-red-200">
                    <FaUserShield /> Panel de Administracion
                  </h3>
                  <p className="mt-2 text-sm text-slate-200">Redirigiendo al panel de administracion...</p>
                  <Button className="mt-4" variant="danger" onClick={() => navigate('/admin')}>
                    Ir al Panel Admin
                  </Button>
                </div>
              ) : null}

              <Button className="w-full" size="lg" variant="secondary" onClick={handleLogout}>
                Cerrar Sesión
              </Button>

              {mensaje ? <div className={cn('rounded-xl border px-4 py-3 text-sm font-semibold', messageClassName)}>{mensaje}</div> : null}
            </div>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="Correo Electronico" icon={<FaEnvelope />}>
                  <input
                    id="email"
                    type="email"
                    aria-label="Correo Electronico"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading}
                    required
                    className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                  />
                </Field>

                <Field label="Contraseña" icon={<FaLock />}>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      aria-label="Contraseña"
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isLoading}
                      required
                      className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 pr-12 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isLoading}
                      className="absolute right-0 top-0 inline-flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-white/85 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </Field>

                <Button type="submit" disabled={isLoading || !email || !password} className="w-full" size="lg">
                  {isLoading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                  className="mx-auto min-h-[48px]"
                >
                  Olvidaste tu contraseña?
                </Button>
              </div>

              {mensaje ? <div className={cn('mt-4 rounded-xl border px-4 py-3 text-sm font-semibold', messageClassName)}>{mensaje}</div> : null}
            </>
          )}
        </Card>
      </div>

      {showChangePasswordModal && userNeedsPasswordChange ? (
        <ChangePasswordModal
          user={{
            ...userNeedsPasswordChange,
            email: user?.email || userNeedsPasswordChange?.email
          }}
          onPasswordChanged={handlePasswordChanged}
        />
      ) : null}

      {showForgotPassword ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-rv-gold/35 bg-[linear-gradient(140deg,rgba(10,10,10,0.96)_0%,rgba(30,58,138,0.7)_100%)]" padding="lg">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-rv-gold/25 pb-3">
              <h3 className="inline-flex items-center gap-2 text-xl font-black text-white">
                <FaKey className="text-rv-gold" /> Recuperar Contraseña
              </h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
              >
                Ã—
              </button>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-slate-200">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Field label="Correo Electronico" icon={<FaEnvelope />}>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  disabled={isLoading}
                  required
                  className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                />
              </Field>

              {resetMessage ? (
                <div
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-semibold',
                    resetMessage.toLowerCase().includes('error')
                      ? 'border-red-400/45 bg-red-500/15 text-red-200'
                      : 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                  )}
                >
                  {resetMessage}
                </div>
              ) : null}

              <div className="grid gap-3 mobile:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetMessage('');
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || !resetEmail} className="w-full">
                  {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

Login.propTypes = {
  onLoginSuccess(props, propName, componentName) {
    if (props[propName] && typeof props[propName] !== 'function') {
      return new Error(
        `Invalid prop ${propName} of type ${typeof props[propName]} supplied to ${componentName}, expected function.`
      );
    }

    return null;
  }
};

export default Login;




