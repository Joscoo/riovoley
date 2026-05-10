import { AuthAdminError } from '../../domain/auth-admin-error.ts';
import { SupabaseAuthAdminGateway } from '../../infrastructure/supabase-auth-admin-gateway.ts';

interface UpdateUserPasswordInput {
  authorization: string;
  userId: string;
  newPassword: string;
}

export class UpdateUserPasswordUseCase {
  constructor(private readonly gateway: SupabaseAuthAdminGateway) {}

  async execute(input: UpdateUserPasswordInput) {
    await this.gateway.requireActor(input.authorization);

    if (!input.userId || !input.newPassword) {
      throw new AuthAdminError(400, 'MISSING_FIELDS', 'userId y newPassword son requeridos');
    }

    const data = await this.gateway.updateUserPassword(input.userId, input.newPassword);

    return {
      success: true,
      code: 'PASSWORD_UPDATED',
      message: 'Contrasena actualizada exitosamente',
      details: data ?? null,
    };
  }
}
