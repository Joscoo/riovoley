import { AuthAdminError } from '../../domain/auth-admin-error.ts';
import type { SupabaseAuthAdminGateway } from '../../infrastructure/supabase-auth-admin-gateway.ts';

interface DeleteAuthUserInput {
  authorization: string;
  userId: string;
}

export class DeleteAuthUserUseCase {
  constructor(private readonly gateway: SupabaseAuthAdminGateway) {}

  async execute(input: DeleteAuthUserInput) {
    const actor = await this.gateway.requireActor(input.authorization);

    if (!input.userId) {
      throw new AuthAdminError(400, 'MISSING_FIELDS', 'userId es requerido');
    }

    const target = await this.gateway.getDeletionTarget(input.userId);
    const targetAllowed = target.id !== actor.userId && (actor.role === 'entrenador'
      ? target.role === 'estudiante'
      : ['estudiante', 'entrenador', 'usuario'].includes(target.role));
    if (!targetAllowed) throw new AuthAdminError(403, 'TARGET_NOT_ALLOWED', 'No tienes permisos para eliminar este usuario.');

    await this.gateway.deleteAuthUser(input.userId);

    return {
      success: true,
      code: 'AUTH_USER_DELETED',
      message: 'Usuario eliminado de Auth exitosamente',
      details: null,
    };
  }
}
