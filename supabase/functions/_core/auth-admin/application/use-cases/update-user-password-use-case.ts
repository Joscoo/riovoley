import { AuthAdminError } from '../../domain/auth-admin-error.ts';
import type { SupabaseAuthAdminGateway } from '../../infrastructure/supabase-auth-admin-gateway.ts';

interface UpdateUserPasswordInput {
  authorization: string;
  userId: string;
  newPassword: string;
}

export class UpdateUserPasswordUseCase {
  constructor(private readonly gateway: SupabaseAuthAdminGateway) {}

  async execute(input: UpdateUserPasswordInput) {
    const actor = await this.gateway.requireActor(input.authorization);

    if (!input.userId || !input.newPassword) {
      throw new AuthAdminError(400, 'MISSING_FIELDS', 'userId y newPassword son requeridos');
    }
    const password = input.newPassword;
    if (password.length < 10 || /\s/.test(password) || !/[A-Z]/.test(password)
      || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
      throw new AuthAdminError(400, 'WEAK_PASSWORD', 'La contraseña temporal debe incluir al menos 10 caracteres, mayúscula, minúscula, número y símbolo, sin espacios.');
    }
    const target = await this.gateway.getPasswordResetTarget(input.userId);
    const targetAllowed = actor.role === 'entrenador'
      ? target.role === 'estudiante'
      : ['estudiante', 'entrenador'].includes(target.role);
    if (!targetAllowed) throw new AuthAdminError(403, 'TARGET_NOT_ALLOWED', 'No tienes permisos para cambiar la contraseña de este usuario.');

    await this.gateway.updateUserPassword(input.userId, input.newPassword);
    let firstLoginUpdated = true;
    try {
      // Password triggers clear first_login: mark it only AFTER updating Auth.
      await this.gateway.markFirstLoginRequired(input.userId);
    } catch (_error) {
      firstLoginUpdated = false;
    }

    return {
      success: true,
      code: 'PASSWORD_UPDATED',
      message: 'Contrasena actualizada exitosamente',
      details: null,
      email: target.email,
      firstLoginUpdated,
    };
  }
}
