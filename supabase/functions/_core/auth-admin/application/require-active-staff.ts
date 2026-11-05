import { AuthAdminError, type AuthAdminActor } from '../domain/auth-admin-error.ts';

type StaffClient = {
  auth: { getUser: (token: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }> };
  loadCanonicalActor: (userId: string) => PromiseLike<{ data: { role: string; suspended?: boolean } | null; error: { code?: string } | null }>;
};

export const requireActiveStaff = async (client: StaffClient, authorization: string): Promise<AuthAdminActor> => {
  const token = /^Bearer\s+(.+)$/i.exec(authorization || '')?.[1]?.trim();
  if (!token) throw new AuthAdminError(401, 'AUTH_REQUIRED', 'Se requiere un token Bearer válido.');
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new AuthAdminError(401, 'AUTH_INVALID', 'No se pudo autenticar al actor.');
  const { data: actor, error: queryError } = await client.loadCanonicalActor(data.user.id);
  if (queryError && queryError.code !== 'PGRST116') throw new AuthAdminError(500, 'PROFILE_QUERY_FAILED', 'No se pudieron comprobar los permisos.', queryError);
  if (!actor) throw new AuthAdminError(403, 'PROFILE_NOT_FOUND', 'No existe un usuario canónico autorizado.');
  if (actor.suspended) throw new AuthAdminError(403, 'ACCOUNT_SUSPENDED', 'La cuenta solicitante está suspendida.');
  if (!['admin', 'administrador', 'entrenador'].includes(actor.role)) throw new AuthAdminError(403, 'ROLE_NOT_ALLOWED', 'La operación requiere personal autorizado.');
  return { userId: data.user.id, role: actor.role };
};
