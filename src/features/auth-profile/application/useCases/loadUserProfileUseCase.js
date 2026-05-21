import { AuthProfileError } from '../../domain/authProfileError';

export const createLoadUserProfileUseCase = (repository) => {
  return {
    execute: async (currentUser) => {
      if (!currentUser?.id) {
        throw new AuthProfileError('Usuario inválido para cargar perfil');
      }

      const profileFromProfiles = await repository.findUserProfile(currentUser.id);
      if (profileFromProfiles) {
        return profileFromProfiles;
      }

      try {
        const coreUser = await repository.findCoreUser(currentUser.id);
        if (coreUser?.role) {
          const fullName = `${coreUser.nombre || ''} ${coreUser.apellido || ''}`.trim();
          const syncedProfile = {
            id: coreUser.id,
            role: coreUser.role,
            full_name: fullName,
            organization_id: null,
            created_at: null,
          };

          try {
            await repository.upsertUserProfile(syncedProfile);
          } catch (_error) {
            // Mejor esfuerzo: no interrumpir login si falla la sincronización.
          }

          return syncedProfile;
        }
      } catch (_error) {
        // Si falla users, intentamos crear perfil fallback.
      }

      return repository.createFallbackProfile({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || null,
        role: 'usuario',
      });
    },
  };
};
