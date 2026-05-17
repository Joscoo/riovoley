const { createSchedulesUseCases } = require('./createSchedulesUseCases');

describe('createSchedulesUseCases', () => {
  const buildRepository = () => ({
    listSchedules: jest.fn(),
    updateSchedule: jest.fn(),
    createSchedules: jest.fn(),
    deleteSchedule: jest.fn(),
  });

  it('loadHorariosUseCase ordena por dia y hora', async () => {
    const repository = buildRepository();
    repository.listSchedules.mockResolvedValue([
      { id: 2, dia_semana: 'martes', hora_inicio: '09:00' },
      { id: 1, dia_semana: 'lunes', hora_inicio: '10:00' },
    ]);
    const useCases = createSchedulesUseCases(repository);

    const result = await useCases.loadHorariosUseCase.execute();

    expect(result.map((x) => x.id)).toEqual([1, 2]);
  });

  it('updateHorarioUseCase aplica fallback si falta columna descripcion', async () => {
    const repository = buildRepository();
    repository.updateSchedule
      .mockRejectedValueOnce(new Error("Could not find the 'descripcion' column in schema cache"))
      .mockResolvedValueOnce(undefined);
    const useCases = createSchedulesUseCases(repository);

    const result = await useCases.updateHorarioUseCase.execute({
      scheduleId: 'h1',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      categoria: 'iniciacion_hombres',
      descripcion: 'desc',
    });

    expect(repository.updateSchedule).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ descripcionOmitida: true });
  });

  it('createHorariosUseCase crea combinatoria de dias x categorias', async () => {
    const repository = buildRepository();
    const useCases = createSchedulesUseCases(repository);

    const result = await useCases.createHorariosUseCase.execute({
      diasParaCrear: ['lunes', 'martes'],
      categorias: ['a', 'b'],
      hora_inicio: '08:00',
      hora_fin: '09:00',
      descripcionResolver: (categoria) => `desc-${categoria}`,
    });

    expect(repository.createSchedules).toHaveBeenCalledTimes(1);
    expect(repository.createSchedules.mock.calls[0][0]).toHaveLength(4);
    expect(result).toEqual({ totalCreados: 4, descripcionOmitida: false });
  });
});
