import { createAthletesUseCases } from '../application/useCases/createAthletesUseCases';
import { SupabaseAthletesRepository } from '../infrastructure/repositories/supabaseAthletesRepository';

export const createAthletesService = (repository = new SupabaseAthletesRepository()) => {
  const useCases = createAthletesUseCases(repository);
  const loadAtletas = async ({ query } = {}) => useCases.loadAtletasUseCase.execute({ query });
  const updateAtleta = async ({ editingAtleta, formData }) =>
    useCases.updateAtletaUseCase.execute({ editingAtleta, formData });
  const validateAthleteForm = ({ formData }) =>
    useCases.validateAthleteFormUseCase.execute({ formData });
  const filterAndSortAtletas = ({ athletes, filters }) =>
    useCases.filterAndSortAtletasUseCase.execute({ athletes, filters });
  const paginateAtletas = ({ athletes, page, pageSize }) =>
    useCases.paginateAtletasUseCase.execute({ athletes, page, pageSize });
  const calculateAthleteAgeDisplay = ({ birthDate }) =>
    useCases.calculateAthleteAgeDisplayUseCase.execute({ birthDate });
  const formatIngresoDate = ({ athlete }) =>
    useCases.formatIngresoDateUseCase.execute({ athlete });
  const formatCategoria = ({ categoria }) =>
    useCases.formatCategoriaUseCase.execute({ categoria });
  const deleteAtletaRecords = async ({ atleta }) =>
    useCases.deleteAtletaRecordsUseCase.execute({ atleta });
  const deleteAtletaCompletely = async ({ atleta }) =>
    useCases.deleteAtletaCompletelyUseCase.execute({ atleta });
  const listOrphanUsers = async () => useCases.listOrphanUsersUseCase.execute();
  const cleanOrphanUsers = async () => useCases.cleanOrphanUsersUseCase.execute();
  const deleteUserRecord = async ({ userId }) =>
    useCases.deleteUserRecordUseCase.execute({ userId });

  return {
    loadAtletas,
    updateAtleta,
    validateAthleteForm,
    filterAndSortAtletas,
    paginateAtletas,
    calculateAthleteAgeDisplay,
    formatIngresoDate,
    formatCategoria,
    deleteAtletaRecords,
    deleteAtletaCompletely,
    listOrphanUsers,
    cleanOrphanUsers,
    deleteUserRecord,
  };
};
