import { createSchedulesUseCases } from '../application/useCases/createSchedulesUseCases';
import { SupabaseSchedulesRepository } from '../infrastructure/repositories/supabaseSchedulesRepository';

export const createSchedulesService = (repository = new SupabaseSchedulesRepository()) => {
  const useCases = createSchedulesUseCases(repository);
  const loadHorarios = async ({ query } = {}) => useCases.loadHorariosUseCase.execute({ query });
  const updateHorario = async ({ scheduleId, hora_inicio, hora_fin, categoria, descripcion }) =>
    useCases.updateHorarioUseCase.execute({ scheduleId, hora_inicio, hora_fin, categoria, descripcion });
  const createHorarios = async ({ diasParaCrear, categorias, hora_inicio, hora_fin, descripcionResolver }) =>
    useCases.createHorariosUseCase.execute({ diasParaCrear, categorias, hora_inicio, hora_fin, descripcionResolver });
  const deleteHorario = async ({ scheduleId }) => useCases.deleteHorarioUseCase.execute({ scheduleId });

  return {
    loadHorarios,
    updateHorario,
    createHorarios,
    deleteHorario,
  };
};
