import { createLoadUserProfileUseCase } from '../application/useCases/loadUserProfileUseCase';
import { SupabaseAuthProfileRepository } from '../infrastructure/repositories/supabaseAuthProfileRepository';

export const createAuthProfileService = (repository = new SupabaseAuthProfileRepository()) => {
  const loadUserProfileUseCase = createLoadUserProfileUseCase(repository);

  return {
    loadUserProfile: async (currentUser) => loadUserProfileUseCase.execute(currentUser),
  };
};
