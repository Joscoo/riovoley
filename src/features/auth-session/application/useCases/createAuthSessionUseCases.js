export const createAuthSessionUseCases = (repository, deps = {}) => {
  const gamificationGateway = deps.gamificationService || null;
  const onAuthStateChangeUseCase = {
    execute: (handler) => repository.onAuthStateChange(handler),
  };

  const getCurrentUserUseCase = {
    execute: () => repository.getCurrentUser(),
  };

  const checkFirstLoginUseCase = {
    execute: async ({ userId }) => {
      if (!userId) return null;
      const userData = await repository.checkFirstLogin(userId);
      return userData?.first_login ? userData : null;
    },
  };

  const getUserRoleUseCase = {
    execute: ({ userId }) => repository.getUserRole(userId),
  };

  const updateLastLoginUseCase = {
    execute: async ({ authUser }) => {
      if (!authUser?.id) return;
      await repository.updateLastLogin(authUser.id);
    },
  };

  const checkLoginAllowedUseCase = {
    execute: async ({ email }) => {
      try {
        return (await repository.checkLoginAllowed(email)) || { allowed: true };
      } catch (error) {
        console.error('Error verificando lockout de login:', error);
        return { allowed: true };
      }
    },
  };

  const recordLoginAttemptUseCase = {
    execute: async ({ email, success, errorCode = null }) => {
      try {
        await repository.recordLoginAttempt(email, success, errorCode);
      } catch (error) {
        console.error('Error registrando intento de login:', error);
      }
    },
  };

  const signInUseCase = {
    execute: async ({ email, password }) => {
      const data = await repository.signInWithPassword(email, password);
      if (data?.user?.id && gamificationGateway?.registerDailyLoginReward) {
        try {
          await gamificationGateway.registerDailyLoginReward({ userId: data.user.id });
        } catch (rewardError) {
          console.error('No se pudo registrar la recompensa diaria de gamificacion:', rewardError);
        }
      }
      return data;
    },
  };

  const signOutUseCase = {
    execute: () => repository.signOut(),
  };

  const requestPasswordResetUseCase = {
    execute: ({ email, redirectTo }) => repository.requestPasswordReset(email, redirectTo),
  };

  const exchangeCodeForSessionUseCase = {
    execute: ({ code }) => repository.exchangeCodeForSession(code),
  };

  const setRecoverySessionUseCase = {
    execute: ({ accessToken, refreshToken }) => repository.setRecoverySession(accessToken, refreshToken),
  };

  const getSessionUseCase = {
    execute: () => repository.getSession(),
  };

  const updatePasswordUseCase = {
    execute: ({ password }) => repository.updatePassword(password),
  };

  const markFirstLoginCompletedUseCase = {
    execute: ({ userId }) => repository.markFirstLoginCompleted(userId),
  };

  return {
    onAuthStateChangeUseCase,
    getCurrentUserUseCase,
    checkFirstLoginUseCase,
    getUserRoleUseCase,
    updateLastLoginUseCase,
    checkLoginAllowedUseCase,
    recordLoginAttemptUseCase,
    signInUseCase,
    signOutUseCase,
    requestPasswordResetUseCase,
    exchangeCodeForSessionUseCase,
    setRecoverySessionUseCase,
    getSessionUseCase,
    updatePasswordUseCase,
    markFirstLoginCompletedUseCase,
  };
};
