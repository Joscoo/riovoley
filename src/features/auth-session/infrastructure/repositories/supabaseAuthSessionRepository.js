import { supabase } from '../../../../config/supabase';
import { AuthSessionError } from '../../domain/authSessionError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const isInvalidRefreshTokenError = (error) =>
  typeof error?.message === 'string' &&
  error.message.toLowerCase().includes('invalid refresh token');

const clearCorruptedLocalSession = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (_error) {
    // Ignorar errores al limpiar una sesion local corrupta.
  }
};

export class SupabaseAuthSessionRepository {
  onAuthStateChange(handler) {
    return supabase.auth.onAuthStateChange(handler);
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await clearCorruptedLocalSession();
        return null;
      }
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
      if (isInvalidRefreshTokenError(error)) {
        await clearCorruptedLocalSession();
        return null;
      }
      throw new AuthSessionError(normalizeError(error, 'Error obteniendo sesion'), error);
    }
    return data.session || null;
  }

  async checkFirstLogin(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_login, nombre, apellido')
      .eq('id', userId)
      .single();

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error verificando first_login'), error);
    }

    return data;
  }

  async updateLastLogin(userId) {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error actualizando last_login'), error);
    }
  }

  async getUserRole(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

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
      throw new AuthSessionError(normalizeError(error, 'Error iniciando sesion'), error);
    }
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error cerrando sesion'), error);
    }
  }

  async requestPasswordReset(email, redirectTo) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error enviando reset de contrasena'), error);
    }
  }

  async exchangeCodeForSession(code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error intercambiando code por sesion'), error);
    }
  }

  async setRecoverySession(accessToken, refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error configurando sesion de recuperacion'), error);
    }
  }

  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error actualizando contrasena'), error);
    }
  }

  async markFirstLoginCompleted(userId) {
    const { error } = await supabase
      .from('users')
      .update({ first_login: false })
      .eq('id', userId);

    if (error) {
      throw new AuthSessionError(normalizeError(error, 'Error actualizando first_login'), error);
    }
  }
}
