import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationTriangle, FaKey, FaLock } from 'react-icons/fa';
import { authSessionService } from '../../authSessionService';
import { deferAuthEvent } from '../utils/deferAuthEvent';
import { cn } from '../../../../lib/cn';
import { PageShell } from '../../../../shared/ui';
import { Card } from '../../../../shared/ui';
import { Field } from '../../../../shared/ui';
import { Button } from '../../../../shared/ui';
import { EmptyState } from '../../../../shared/ui';

const clearRecoveryParamsFromUrl = () => {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, '/reset-password');
};

const PASSWORD_REQUIREMENTS = [
  { key: 'minLength', label: 'Al menos 10 caracteres' },
  { key: 'uppercase', label: 'Incluye una letra mayúscula (A-Z)' },
  { key: 'lowercase', label: 'Incluye una letra minúscula (a-z)' },
  { key: 'number', label: 'Incluye al menos un número (0-9)' },
  { key: 'special', label: 'Incluye al menos un símbolo (!@#$...)' },
  { key: 'noSpaces', label: 'No contiene espacios' }
];

const ResetPassword = ({ onPasswordReset }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const navigate = useNavigate();
  const initializationRef = useRef(null);
  const recoveryFailedRef = useRef(false);
  const recoveryUserRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const submittingRef = useRef(false);
  const [completed, setCompleted] = useState(false);

  const passwordChecks = {
    minLength: newPassword.length >= 10,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    noSpaces: !/\s/.test(newPassword)
  };

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword;

  useEffect(() => {
    let isMounted = true;
    const validateRecovery = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const query = new URLSearchParams(window.location.search);
      if (['error', 'error_code', 'error_description'].some((key) => hash.has(key) || query.has(key))) {
        throw new Error('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.');
      }
      let session;
      if (query.has('token_hash')) {
        if (query.get('type') !== 'recovery') throw new Error('El enlace no es de recuperación de contraseña.');
        session = await authSessionService.verifyRecoveryToken(query.get('token_hash'));
      } else if (query.has('code')) {
        session = await authSessionService.exchangeCodeForSession(query.get('code'));
      } else if (hash.has('access_token') || hash.has('refresh_token')) {
        if (!hash.get('access_token') || !hash.get('refresh_token') || hash.get('type') !== 'recovery') {
          throw new Error('El enlace de recuperación está incompleto o no es válido.');
        }
        session = await authSessionService.setRecoverySession(hash.get('access_token'), hash.get('refresh_token'));
      } else {
        // Supabase may already have consumed a valid recovery URL during startup.
        session = await authSessionService.getSession();
      }
      if (!session?.user) throw new Error('El enlace de recuperación es inválido o ha expirado.');
      recoveryUserRef.current = session.user;
      clearRecoveryParamsFromUrl();
      return true;
    };
    const { data: { subscription } } = authSessionService.onAuthStateChange(
      deferAuthEvent((event, session) => {
        if (!isMounted || recoveryFailedRef.current) return;
        if (event === 'PASSWORD_RECOVERY' && session?.user) {
          recoveryUserRef.current = session.user;
          setIsValidToken(true);
          setIsCheckingToken(false);
          setMensaje('');
        }
      })
    );
    if (!initializationRef.current) initializationRef.current = validateRecovery();
    initializationRef.current.then(() => {
      if (!isMounted) return;
      setIsValidToken(true);
      setIsCheckingToken(false);
    }).catch((error) => {
      recoveryFailedRef.current = true;
      if (!isMounted) return;
      setIsValidToken(false);
      setIsCheckingToken(false);
      setMensaje(error.message || 'No se pudo validar el enlace de recuperación. Solicita uno nuevo.');
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => () => window.clearTimeout(navigationTimerRef.current), []);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (submittingRef.current || completed || !isValidToken) return;
    submittingRef.current = true;
    setIsLoading(true);
    setMensaje('');

    if (!newPassword || !confirmPassword) {
      setMensaje('Por favor, completa todos los campos');
      setIsLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!isStrongPassword) {
      setMensaje('La contraseña no cumple los requisitos de seguridad.');
      setIsLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!passwordsMatch) {
      setMensaje('Las contraseñas no coinciden');
      setIsLoading(false);
      submittingRef.current = false;
      return;
    }

    try {
      const currentSession = await authSessionService.getSession();
      if (!currentSession?.user || currentSession.user.id !== recoveryUserRef.current?.id) {
        recoveryFailedRef.current = true;
        setIsValidToken(false);
        setMensaje('La sesión de recuperación cambió o expiró. Solicita un nuevo enlace.');
        return;
      }
      await authSessionService.updatePassword(newPassword);
      setCompleted(true);
      try {
        await authSessionService.markFirstLoginCompleted(recoveryUserRef.current.id);
      } catch (_error) {
        // Metadata synchronization must not prevent closing the recovery session.
      }
      try {
        await authSessionService.signOut();
      } catch (_error) {
        // The password was changed; do not claim failure or submit it a second time.
      }
      onPasswordReset?.();
      setMensaje('Contraseña actualizada correctamente. Redirigiendo...');
      setNewPassword('');
      setConfirmPassword('');
      navigationTimerRef.current = window.setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMensaje(`Error inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <PageShell contentClassName="px-4 py-10 mobile:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-xl items-center justify-center">
        <Card padding="lg" className="w-full border-rv-gold/30 bg-[linear-gradient(140deg,rgba(10,10,10,0.96)_0%,rgba(30,58,138,0.7)_100%)]">
          <div className="mb-8 text-center">
            <div className="relative mx-auto mb-4 h-20 w-20">
              <div className="absolute inset-0 rounded-full bg-rv-gold/25 blur-xl" aria-hidden="true" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-rv-gold to-amber-400 text-rv-dark shadow-rv-gold">
                <FaKey className="text-3xl" />
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-white to-rv-gold bg-clip-text text-3xl font-black text-transparent mobile:text-4xl">
              Restablecer Contraseña
            </h1>
            <p className="mt-2 text-sm text-slate-200">Ingresa tu nueva contraseña</p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-rv-gold to-transparent" aria-hidden="true" />
          </div>

          {isCheckingToken && (
            <EmptyState title="Validando enlace de recuperación..." description="Estamos verificando tu sesión de recuperación." icon={<FaKey />} />
          )}

          {!isCheckingToken && !isValidToken && (
            <EmptyState
              title="Enlace inválido o expirado"
              description={mensaje || 'Solicita un nuevo enlace desde la pantalla de inicio de sesión.'}
              icon={<FaExclamationTriangle />}
              action={<Button onClick={() => navigate('/login')}>Volver al inicio de sesión</Button>}
            />
          )}

          {!isCheckingToken && isValidToken && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Field label="Nueva contraseña" icon={<FaLock />}>
                <div className="relative">
                  <input
                    id="new-password"
                    aria-label="Nueva contraseña"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={isLoading || completed}
                    required
                    minLength={10}
                    className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 pr-12 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading || completed}
                    className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/85 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="mt-3 grid gap-1 rounded-xl border border-white/15 bg-slate-900/60 p-3">
                  {PASSWORD_REQUIREMENTS.map((requirement) => {
                    const passed = passwordChecks[requirement.key];
                    return (
                      <p
                        key={requirement.key}
                        className={cn('text-xs', passed ? 'text-emerald-300' : 'text-slate-300')}
                      >
                        <span className="mr-1 font-bold">{passed ? '✓' : '•'}</span>
                        {requirement.label}
                      </p>
                    );
                  })}
                </div>
              </Field>

              <Field label="Confirmar contraseña" icon={<FaLock />}>
                <input
                  id="confirm-password"
                  aria-label="Confirmar contraseña"
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading || completed}
                  required
                  minLength={10}
                  className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                />
                {confirmPassword ? (
                  <p className={cn('text-xs font-semibold', passwordsMatch ? 'text-emerald-300' : 'text-red-300')}>
                    {passwordsMatch ? '✓ Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </p>
                ) : null}
              </Field>

              <Button
                type="submit"
                disabled={completed || isLoading || !newPassword || !confirmPassword || !isStrongPassword || !passwordsMatch}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>

              {mensaje ? (
                <div
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-semibold',
                    mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('inválido')
                      ? 'border-red-400/45 bg-red-500/15 text-red-200'
                      : 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                  )}
                >
                  {mensaje}
                </div>
              ) : null}
            </form>
          )}
        </Card>
      </div>
    </PageShell>
  );
};

export default ResetPassword;



