import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { AuthAdminError, type AuthAdminActor } from '../domain/auth-admin-error.ts';

const allowedRoles = ['admin', 'administrador', 'entrenador'];

export class SupabaseAuthAdminGateway {
  private readonly supabaseAdmin;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new AuthAdminError(500, 'MISSING_ENV', 'Faltan variables de entorno de Supabase para ejecutar la funcion');
    }

    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async requireActor(authorization: string): Promise<AuthAdminActor> {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new AuthAdminError(401, 'AUTH_REQUIRED', 'No se proporciono un token Bearer valido en Authorization');
    }

    const token = authorization.replace('Bearer ', '').trim();
    if (!token) {
      throw new AuthAdminError(401, 'AUTH_REQUIRED', 'El token de autorizacion esta vacio');
    }

    const { data: { user: requestingUser }, error: authError } = await this.supabaseAdmin.auth.getUser(token);
    if (authError || !requestingUser) {
      throw new AuthAdminError(401, 'AUTH_INVALID', 'No autorizado. Tu sesion puede haber expirado.', authError);
    }

    let { data: userProfile, error: profileError } = await this.supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if ((profileError || !userProfile) && profileError?.code === 'PGRST116') {
      const { data: profileFallback, error: fallbackError } = await this.supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', requestingUser.id)
        .single();

      if (!fallbackError && profileFallback) {
        userProfile = profileFallback;
        profileError = null;
      }
    }

    if (profileError) {
      throw new AuthAdminError(500, 'PROFILE_QUERY_FAILED', 'Error verificando permisos del usuario', profileError);
    }

    if (!userProfile) {
      throw new AuthAdminError(403, 'PROFILE_NOT_FOUND', 'Usuario solicitante no encontrado en la tabla users');
    }

    if (!allowedRoles.includes(userProfile.role)) {
      throw new AuthAdminError(403, 'ROLE_NOT_ALLOWED', `No tienes permisos. Rol actual: ${userProfile.role}`);
    }

    return { userId: requestingUser.id, role: userProfile.role };
  }

  async deleteAuthUser(userId: string) {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw new AuthAdminError(500, 'AUTH_DELETE_FAILED', `No se pudo eliminar el usuario de Auth: ${error.message}`, error);
    }
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const { data, error } = await this.supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      throw new AuthAdminError(500, 'PASSWORD_UPDATE_FAILED', `No se pudo actualizar la contrasena: ${error.message}`, error);
    }
    return data;
  }
}
