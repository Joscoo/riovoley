const isDescripcionMissingError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes("could not find the 'descripcion' column") ||
    (message.includes('descripcion') && message.includes('schema cache'))
  );
};

export const createSchedulesUseCases = (repository) => {
  const loadHorariosUseCase = {
    execute: async ({ query } = {}) => {
      const schedules = await repository.listSchedules({ query });
      return schedules || [];
    },
  };

  const updateHorarioUseCase = {
    execute: async ({ scheduleId, hora_inicio, hora_fin, categoria, descripcion }) => {
      const payloadConDescripcion = {
        hora_inicio,
        hora_fin,
        categoria,
        descripcion,
      };

      let descripcionOmitida = false;

      try {
        await repository.updateSchedule(scheduleId, payloadConDescripcion);
      } catch (error) {
        if (!isDescripcionMissingError(error)) throw error;
        descripcionOmitida = true;
        await repository.updateSchedule(scheduleId, { hora_inicio, hora_fin, categoria });
      }

      return { descripcionOmitida };
    },
  };

  const createHorariosUseCase = {
    execute: async ({ diasParaCrear, categorias, hora_inicio, hora_fin, descripcionResolver }) => {
      const horariosParaInsertar = [];
      diasParaCrear.forEach((dia) => {
        categorias.forEach((categoria) => {
          horariosParaInsertar.push({
            dia_semana: dia,
            hora_inicio,
            hora_fin,
            categoria,
            descripcion: descripcionResolver(categoria),
          });
        });
      });

      let descripcionOmitida = false;
      try {
        await repository.createSchedules(horariosParaInsertar);
      } catch (error) {
        if (!isDescripcionMissingError(error)) throw error;
        descripcionOmitida = true;
        const horariosSinDescripcion = horariosParaInsertar.map(({ descripcion, ...rest }) => rest);
        await repository.createSchedules(horariosSinDescripcion);
      }

      return { totalCreados: horariosParaInsertar.length, descripcionOmitida };
    },
  };

  const deleteHorarioUseCase = {
    execute: async ({ scheduleId }) => repository.deleteSchedule(scheduleId),
  };

  return {
    loadHorariosUseCase,
    updateHorarioUseCase,
    createHorariosUseCase,
    deleteHorarioUseCase,
  };
};
