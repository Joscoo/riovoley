const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

const sortSchedules = (items) =>
  (items || []).slice().sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dia_semana) - DAY_ORDER.indexOf(b.dia_semana);
    if (dayDiff !== 0) return dayDiff;
    return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
  });

const isDescripcionMissingError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes("could not find the 'descripcion' column") ||
    (message.includes('descripcion') && message.includes('schema cache'))
  );
};

export const createSchedulesUseCases = (repository) => {
  const loadHorariosUseCase = {
    execute: async () => {
      const schedules = await repository.listSchedules();
      return sortSchedules(schedules);
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
