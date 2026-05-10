import { AuthAdminError } from '../../domain/auth-admin-error.ts';
import { SupabaseAuthAdminGateway } from '../../infrastructure/supabase-auth-admin-gateway.ts';

interface DeleteAuthUserInput {
  authorization: string;
  userId: string;
}

export class DeleteAuthUserUseCase {
  constructor(private readonly gateway: SupabaseAuthAdminGateway) {}

  async execute(input: DeleteAuthUserInput) {
    await this.gateway.requireActor(input.authorization);

    if (!input.userId) {
      throw new AuthAdminError(400, 'MISSING_FIELDS', 'userId es requerido');
    }

    await this.gateway.deleteAuthUser(input.userId);

    return {
      success: true,
      code: 'AUTH_USER_DELETED',
      message: 'Usuario eliminado de Auth exitosamente',
      details: null,
    };
  }
}
