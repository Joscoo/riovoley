import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationTriangle, FaKey, FaLock } from 'react-icons/fa';
import { authSessionService } from '../../authSessionService';
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
  { key: 'uppercase', label: 'Incluye una letra may?scula (A-Z)' },
  { key: 'lowercase', label: 'Incluye una letra min?scula (a-z)' },
  { key: 'number', label: 'Incluye al menos un n?mero (0-9)' },
  { key: 'special', label: 'Incluye al menos un s?mbolo (!@#$...)' },
  { key: 'noSpaces', label: 'No contiene espacios' }
];

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const navigate = useNavigate();

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

    const initPasswordReset = async () => {
      try {
        let hasRecoverySession = false;

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const queryParams = new URLSearchParams(window.location.search);

        const recoveryAccessToken = hashParams.get('access_token');
        const recoveryRefreshToken = hashParams.get('refresh_token');
        const recoveryType = hashParams.get('type');
        const exchangeCode = queryParams.get('code');

        if (exchangeCode) {
          try {
            await authSessionService.exchangeCodeForSession(exchangeCode);
            hasRecoverySession = true;
            clearRecoveryParamsFromUrl();
          } catch (_error) {
            hasRecoverySession = false;
          }
        } else if (recoveryAccessToken && recoveryRefreshToken && recoveryType === 'recovery') {
          try {
            await authSessionService.setRecoverySession(recoveryAccessToken, recoveryRefreshToken);
            hasRecoverySession = true;
            clearRecoveryParamsFromUrl();
          } catch (_error) {
            hasRecoverySession = false;
          }
        }

        if (!hasRecoverySession) {
          const session = await authSessionService.getSession();
          hasRecoverySession = Boolean(session);
        }

        if (!isMounted) return;

        setIsValidToken(hasRecoverySession);
        if (!hasRecoverySession) {
          setMensaje('El enlace de recuperaci?n es inv?lido o ha expirado.');
        }
      } catch (error) {
        console.error('Error inicializando recuperaci?n:', error);
        if (!isMounted) return;

        setIsValidToken(false);
        setMensaje('No se pudo validar el enlace de recuperaci?n. Solicita uno nuevo.');
      } finally {
        if (isMounted) {
          setIsCheckingToken(false);
        }
      }
    };

    const {
      data: { subscription }
    } = authSessionService.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidToken(true);
        setIsCheckingToken(false);
        setMensaje('');
        clearRecoveryParamsFromUrl();
      } else if (event === 'SIGNED_IN' && session) {
        setIsValidToken(true);
        setIsCheckingToken(false);
        setMensaje('');
        clearRecoveryParamsFromUrl();
      } else if (event === 'TOKEN_REFRESHED') {
        setIsValidToken(true);
        setIsCheckingToken(false);
      }
    });

    initPasswordReset();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMensaje('');

    if (!newPassword || !confirmPassword) {
      setMensaje('Por favor, completa todos los campos');
      setIsLoading(false);
      return;
    }

    if (!isStrongPassword) {
      setMensaje('La contrase?a no cumple los requisitos de seguridad.');
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setMensaje('Las contrase?as no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      await authSessionService.updatePassword(newPassword);
      setMensaje('Contrase?a actualizada correctamente. Redirigiendo...');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMensaje(`Error inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
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
              Restablecer Contrase?a
            </h1>
            <p className="mt-2 text-sm text-slate-200">Ingresa tu nueva contrase?a</p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-rv-gold to-transparent" aria-hidden="true" />
          </div>

          {isCheckingToken && (
            <EmptyState title="Validando enlace de recuperaci?n..." description="Estamos verificando tu sesi?n de recuperaci?n." icon={<FaKey />} />
          )}

          {!isCheckingToken && !isValidToken && (
            <EmptyState
              title="Enlace inv?lido o expirado"
              description={mensaje || 'Solicita un nuevo enlace desde la pantalla de inicio de sesi?n.'}
              icon={<FaExclamationTriangle />}
              action={<Button onClick={() => navigate('/login')}>Volver al inicio de sesi?n</Button>}
            />
          )}

          {!isCheckingToken && isValidToken && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Field label="Nueva contrase?a" icon={<FaLock />}>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    disabled={isLoading}
                    required
                    minLength={10}
                    className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 pr-12 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
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
                        <span className="mr-1 font-bold">{passed ? '?' : '?'}</span>
                        {requirement.label}
                      </p>
                    );
                  })}
                </div>
              </Field>

              <Field label="Confirmar contrase?a" icon={<FaLock />}>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={isLoading}
                  required
                  minLength={10}
                  className="h-12 w-full rounded-xl border border-rv-gold/35 bg-slate-900/70 px-4 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80"
                />
                {confirmPassword ? (
                  <p className={cn('text-xs font-semibold', passwordsMatch ? 'text-emerald-300' : 'text-red-300')}>
                    {passwordsMatch ? '? Las contrase?as coinciden' : 'Las contrase?as no coinciden'}
                  </p>
                ) : null}
              </Field>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword || !isStrongPassword || !passwordsMatch}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Contrase?a'}
              </Button>

              {mensaje ? (
                <div
                  className={cn(
                    'rounded-xl border px-4 py-3 text-sm font-semibold',
                    mensaje.toLowerCase().includes('error') || mensaje.toLowerCase().includes('inv?lido')
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



