import { createAuthSessionUseCases } from '../application/useCases/createAuthSessionUseCases';
import { SupabaseAuthSessionRepository } from '../infrastructure/repositories/supabaseAuthSessionRepository';
import { gamificationService } from '../../gamification';

export const createAuthSessionService = (repository = new SupabaseAuthSessionRepository()) => {
  const useCases = createAuthSessionUseCases(repository, { gamificationService });

  const onAuthStateChange = (handler) => useCases.onAuthStateChangeUseCase.execute(handler);
  const getCurrentUser = () => useCases.getCurrentUserUseCase.execute();
  const checkFirstLogin = async (userId) => useCases.checkFirstLoginUseCase.execute({ userId });
  const getUserRole = (userId) => useCases.getUserRoleUseCase.execute({ userId });
  const updateLastLogin = async (authUser) => useCases.updateLastLoginUseCase.execute({ authUser });
  const checkLoginAllowed = async (email) => useCases.checkLoginAllowedUseCase.execute({ email });
  const recordLoginAttempt = async (email, success, errorCode = null) =>
    useCases.recordLoginAttemptUseCase.execute({ email, success, errorCode });
  const signIn = (email, password) => useCases.signInUseCase.execute({ email, password });
  const signOut = () => useCases.signOutUseCase.execute();
  const requestPasswordReset = (email, redirectTo) => useCases.requestPasswordResetUseCase.execute({ email, redirectTo });
  const exchangeCodeForSession = (code) => useCases.exchangeCodeForSessionUseCase.execute({ code });
  const setRecoverySession = (accessToken, refreshToken) =>
    useCases.setRecoverySessionUseCase.execute({ accessToken, refreshToken });
  const getSession = () => useCases.getSessionUseCase.execute();
  const updatePassword = (password) => useCases.updatePasswordUseCase.execute({ password });
  const markFirstLoginCompleted = (userId) => useCases.markFirstLoginCompletedUseCase.execute({ userId });

  return {
    onAuthStateChange,
    getCurrentUser,
    checkFirstLogin,
    getUserRole,
    updateLastLogin,
    checkLoginAllowed,
    recordLoginAttempt,
    signIn,
    signOut,
    requestPasswordReset,
    exchangeCodeForSession,
    setRecoverySession,
    getSession,
    updatePassword,
    markFirstLoginCompleted,
  };
};
