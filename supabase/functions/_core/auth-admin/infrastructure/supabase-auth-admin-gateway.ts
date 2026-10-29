import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { AuthAdminError, type AuthAdminActor } from '../domain/auth-admin-error.ts';
import { requireActiveStaff } from '../application/require-active-staff.ts';

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
    return requireActiveStaff({
      auth: this.supabaseAdmin.auth,
      loadCanonicalActor: (userId: string) => this.supabaseAdmin.from('users').select('role, suspended').eq('id', userId).single(),
    }, authorization);
  }

  async deleteAuthUser(userId: string) {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      throw new AuthAdminError(500, 'AUTH_DELETE_FAILED', `No se pudo eliminar el usuario de Auth: ${error.message}`, error);
    }
  }

  async getDeletionTarget(userId: string) {
    const { data, error } = await this.supabaseAdmin.from('users').select('id, role').eq('id', userId).single();
    if (error || !data) throw new AuthAdminError(404, 'TARGET_NOT_FOUND', 'No existe un usuario canónico para autorizar la eliminación.');
    return data;
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const { data, error } = await this.supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      throw new AuthAdminError(500, 'PASSWORD_UPDATE_FAILED', `No se pudo actualizar la contrasena: ${error.message}`, error);
    }
    return data;
  }

  async getPasswordResetTarget(userId: string) {
    const { data: target, error } = await this.supabaseAdmin.from('users').select('id, role').eq('id', userId).single();
    if (error || !target) throw new AuthAdminError(404, 'TARGET_NOT_FOUND', 'No se encontró el usuario para reenviar credenciales.');
    const { data, error: authError } = await this.supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !data?.user?.email) throw new AuthAdminError(404, 'AUTH_USER_NOT_FOUND', 'El usuario no tiene una cuenta de acceso con email válido.');
    return { ...target, email: data.user.email };
  }

  async markFirstLoginRequired(userId: string) {
    const { error } = await this.supabaseAdmin.from('users').update({ first_login: true }).eq('id', userId).select('id').single();
    if (error) throw new AuthAdminError(500, 'FIRST_LOGIN_UPDATE_FAILED', 'No se pudo activar el cambio obligatorio de contraseña.');
  }
}
