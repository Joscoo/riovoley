import { createTrainerManagementUseCases } from '../application/useCases/createTrainerManagementUseCases';
import { SupabaseTrainerManagementRepository } from '../infrastructure/repositories/supabaseTrainerManagementRepository';

export const createTrainerManagementService = (repository = new SupabaseTrainerManagementRepository()) => {
  const useCases = createTrainerManagementUseCases(repository);

  const loadEntrenadores = async ({ query } = {}) => useCases.loadEntrenadoresUseCase.execute({ query });
  const saveEntrenador = async ({ editingEntrenador, formData }) =>
    useCases.saveEntrenadorUseCase.execute({ editingEntrenador, formData });
  const deleteEntrenador = async ({ trainerId }) => useCases.deleteEntrenadorUseCase.execute({ trainerId });

  return {
    loadEntrenadores,
    saveEntrenador,
    deleteEntrenador,
  };
};
