import { supabase } from '../../../../config/supabase';
import { AuthSessionError } from '../../domain/authSessionError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const buildAuthError = (error, fallback) => {
  const message = normalizeError(error, fallback);
  const lowered = message.toLowerCase();

  if (lowered.includes('invalid login credentials') || lowered.includes('invalid_credentials')) {
    return { message: 'Email o contrasena invalidos.', code: 'AUTH_INVALID_CREDENTIALS' };
  }

  if (lowered.includes('too many requests') || lowered.includes('rate limit')) {
    return { message: 'Demasiados intentos. Espera unos minutos e intentalo de nuevo.', code: 'AUTH_RATE_LIMIT' };
  }

  if (lowered.includes('jwt') || lowered.includes('session') || lowered.includes('token')) {
    return { message: 'Tu sesion expiro. Inicia sesion nuevamente.', code: 'AUTH_SESSION_EXPIRED' };
  }

  return { message: fallback, code: 'AUTH_SESSION_ERROR' };
};

export class SupabaseAuthSessionRepository {
  onAuthStateChange(handler) {
    return supabase.auth.onAuthStateChange(handler);
  }

  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      if (error.name !== 'AuthSessionMissingError') {
        throw new AuthSessionError(normalizeError(error, 'Error obteniendo usuario actual'), error);
      }
      return null;
    }
    return user;
  }

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error obteniendo sesion'), error);
    }
    return data.session || null;
  }

  async checkFirstLogin(userId) {
    const { data, error } = await supabase.from('users').select('id, first_login, nombre, apellido').eq('id', userId).single();

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error verificando first_login'), error);
    }

    return data;
  }

  async updateLastLogin(userId) {
    const { error } = await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', userId);

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error actualizando last_login'), error);
    }
  }

  async getUserRole(userId) {
    const { data, error } = await supabase.from('user_profiles').select('role').eq('id', userId).single();

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error cargando rol de usuario'), error);
    }

    return data?.role || null;
  }

  async checkLoginAllowed(email) {
    const { data, error } = await supabase.rpc('check_login_allowed', {
      p_email: email,
    });

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error verificando lockout de login'), error);
    }

    return Array.isArray(data) ? data[0] : data;
  }

  async recordLoginAttempt(email, success, errorCode = null) {
    const { error } = await supabase.rpc('record_login_attempt', {
      p_email: email,
      p_success: success,
      p_error_code: errorCode,
    });

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error registrando intento de login'), error);
    }
  }

  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const resolved = buildAuthError(error, 'No se pudo iniciar sesion en este momento.');
      throw new AuthSessionError(resolved.message, error, resolved.code);
    }
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AuthSessionError('No se pudo cerrar sesion. Intenta nuevamente.', error, 'AUTH_SIGN_OUT_FAILED');
    }
  }

  async requestPasswordReset(email, redirectTo) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      const resolved = buildAuthError(error, 'No se pudo enviar el enlace de recuperacion.');
      throw new AuthSessionError(resolved.message, error, resolved.code);
    }
  }

  async exchangeCodeForSession(code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw new AuthSessionError('No se pudo validar el enlace de recuperacion.', error, 'AUTH_RECOVERY_LINK_INVALID');
    }
  }

  async setRecoverySession(accessToken, refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AuthSessionError('No se pudo configurar la sesion de recuperacion.', error, 'AUTH_RECOVERY_SESSION_FAILED');
    }
  }

  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const resolved = buildAuthError(error, 'No se pudo actualizar la contrasena.');
      throw new AuthSessionError(resolved.message, error, resolved.code);
    }
  }

  async markFirstLoginCompleted(userId) {
    const { error } = await supabase.from('users').update({ first_login: false }).eq('id', userId);

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error actualizando first_login'), error);
    }
  }
}
