# auth-session

Feature clean-lite para autenticacion de sesion y recuperacion de contrasena.

## Responsabilidades
- Orquestar login/logout y flujo de primer ingreso.
- Gestionar sesiones de recuperacion de contrasena.
- Centralizar operaciones de Supabase Auth y RPC de control de intentos.

## Capas
- `presentation/createAuthSessionService.js`: casos de uso de sesion/autenticacion.
- `domain/authSessionError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseAuthSessionRepository.js`: adaptador Supabase Auth/DB.

## Contrato publico
- `authSessionService.onAuthStateChange(handler)`
- `authSessionService.getCurrentUser()`
- `authSessionService.checkFirstLogin(userId)`
- `authSessionService.getUserRole(userId)`
- `authSessionService.updateLastLogin(authUser)`
- `authSessionService.checkLoginAllowed(email)`
- `authSessionService.recordLoginAttempt(email, success, errorCode?)`
- `authSessionService.signIn(email, password)`
- `authSessionService.signOut()`
- `authSessionService.requestPasswordReset(email, redirectTo)`
- `authSessionService.exchangeCodeForSession(code)`
- `authSessionService.setRecoverySession(accessToken, refreshToken)`
- `authSessionService.getSession()`
- `authSessionService.updatePassword(password)`
- `authSessionService.markFirstLoginCompleted(userId)`
