import { getEcuadorDate, getEcuadorDateMinusDays } from '../../../../utils/dateUtils';
import { formatDateString } from '../../../../utils/dateUtils';

const groupAttendancesByDate = (attendances) => {
  const grouped = {};
  (attendances || []).forEach((attendance) => {
    const date = attendance.fecha;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(attendance);
  });
  return grouped;
};

const toStudentDetails = async (repository, attendanceRows, athletes) => {
  return Promise.all((attendanceRows || []).map(async (attendance) => {
    const cachedStudent = (athletes || []).find((athlete) => athlete.id === attendance.student_id);
    if (cachedStudent) {
      return { ...attendance, students: cachedStudent };
    }

    try {
      const student = await repository.getStudentById(attendance.student_id);
      return { ...attendance, students: student };
    } catch (_error) {
      return { ...attendance, students: null };
    }
  }));
};

export const createAttendanceUseCases = (repository, deps = {}) => {
  const currentDate = deps.getEcuadorDate || getEcuadorDate;
  const dateMinusDays = deps.getEcuadorDateMinusDays || getEcuadorDateMinusDays;
  const formatDate = deps.formatDateString || formatDateString;

  const loadAthletesUseCase = {
    execute: async () => {
      const athletes = await repository.listAthletesWithRole();
      return athletes.filter((athlete) => athlete.users?.role === 'estudiante');
    },
  };

  const loadAttendanceDataUseCase = {
    execute: async ({ filters, athletes: currentAthletes }) => {
      const athletes = currentAthletes?.length > 0 ? currentAthletes : await loadAthletesUseCase.execute();
      const categoryAthletes = filters?.categoria
        ? athletes.filter((athlete) => athlete.categoria === filters.categoria).map((athlete) => athlete.id)
        : undefined;

      const attendanceRows = await repository.listAttendances({
        dateFrom: filters?.fecha_inicio,
        dateTo: filters?.fecha_fin,
        studentIds: categoryAthletes,
        studentId: filters?.atleta || undefined,
      });

      const attendancesWithDetails = await toStudentDetails(repository, attendanceRows, athletes);
      const groupedByDate = groupAttendancesByDate(attendancesWithDetails);

      return {
        athletes,
        attendances: attendancesWithDetails,
        groupedByDate,
      };
    },
  };

  const loadTodayAttendanceUseCase = {
    execute: async ({ selectedDate, athletes }) => {
      const rawAttendance = await repository.listAttendances({
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });

      const attendanceMap = {};
      rawAttendance.forEach((attendance) => {
        attendanceMap[attendance.student_id] = attendance;
      });

      return (athletes || []).map((athlete) => ({
        ...athlete,
        attendance: attendanceMap[athlete.id] || null,
      }));
    },
  };

  const listPaymentTypesUseCase = {
    execute: async () => repository.listPaymentTypes(),
  };

  const registerAttendanceWithPaymentUseCase = {
    execute: async ({ athleteId, selectedDate, paymentTypeId }) => {
      const existing = await repository.findAttendanceByStudentAndDate(athleteId, selectedDate);
      if (existing) {
        await repository.updateAttendance(existing.id, { metodo_pago_id: paymentTypeId });
        return;
      }

      await repository.createAttendance({
        student_id: athleteId,
        fecha: selectedDate,
        metodo_pago_id: paymentTypeId,
      });
    },
  };

  const removeAttendanceUseCase = {
    execute: async ({ athleteId, selectedDate }) =>
      repository.deleteAttendanceByStudentAndDate(athleteId, selectedDate),
  };

  const toggleAttendanceUseCase = {
    execute: async ({ athleteId, selectedDate, isCurrentlyPresent }) => {
      if (isCurrentlyPresent) {
        await repository.deleteAttendanceByStudentAndDate(athleteId, selectedDate);
        return;
      }

      await repository.createAttendance({
        student_id: athleteId,
        fecha: selectedDate,
      });
    },
  };

  const clearAttendanceForDateUseCase = {
    execute: async ({ selectedDate }) => repository.deleteAttendancesByDate(selectedDate),
  };

  const getDefaultDatesUseCase = {
    execute: () => ({
      selectedDate: currentDate(),
      dateFrom: dateMinusDays(7),
      dateTo: currentDate(),
    }),
  };

  const calculateStatsUseCase = {
    execute: ({ attendances, athletes, todayAttendance, bulkMode, categories }) => {
      const totalPresentes = (attendances || []).length;
      const totalAtletas = (athletes || []).length;

      let ausentes;
      let porcentajeAsistencia;

      if (bulkMode) {
        const presentesHoy = (todayAttendance || []).filter((athlete) => athlete.attendance !== null).length;
        ausentes = totalAtletas > 0 ? totalAtletas - presentesHoy : 0;
        porcentajeAsistencia = totalAtletas > 0 ? ((presentesHoy / totalAtletas) * 100).toFixed(1) : 0;
      } else {
        const uniqueDays = new Set((attendances || []).map((attendance) => attendance.fecha)).size;
        if (uniqueDays > 0 && totalAtletas > 0) {
          porcentajeAsistencia = ((totalPresentes / (uniqueDays * totalAtletas)) * 100).toFixed(1);
          ausentes = Math.round(totalAtletas - (totalPresentes / uniqueDays));
        } else {
          porcentajeAsistencia = 0;
          ausentes = 0;
        }
      }

      const categoriaStats = {};
      (categories || []).forEach((category) => {
        const athletesInCategory = (athletes || []).filter((athlete) => athlete.categoria === category);
        const attendanceInCategory = (attendances || []).filter((attendance) => attendance.students?.categoria === category);
        const categoryTotal = athletesInCategory.length;
        const categoryPresent = attendanceInCategory.length;

        categoriaStats[category] = {
          total: categoryTotal,
          presentes: categoryPresent,
          porcentaje: categoryTotal > 0 ? ((categoryPresent / categoryTotal) * 100).toFixed(1) : 0,
        };
      });

      return {
        total: bulkMode ? totalAtletas : totalPresentes,
        presentes: bulkMode ? (todayAttendance || []).filter((athlete) => athlete.attendance !== null).length : totalPresentes,
        ausentes,
        porcentajeAsistencia,
        categoriaStats,
      };
    },
  };

  const markAllPresentWithMensualidadUseCase = {
    execute: async ({ selectedDate, paymentTypes, todayAttendance }) => {
      const mensualidad = (paymentTypes || []).find((paymentType) => paymentType.nombre === 'mensualidad');
      if (!mensualidad) {
        throw new Error('No se encontrÃ³ el mÃ©todo de pago "mensualidad"');
      }

      const absentAthletes = (todayAttendance || []).filter((athlete) => athlete.attendance === null);
      for (const athlete of absentAthletes) {
        await registerAttendanceWithPaymentUseCase.execute({
          athleteId: athlete.id,
          selectedDate,
          paymentTypeId: mensualidad.id,
        });
      }

      return { updatedCount: absentAthletes.length };
    },
  };

  const getPaymentTypeDisplayUseCase = {
    execute: ({ paymentTypes, metodoPagoId }) => {
      const paymentType = (paymentTypes || []).find((type) => type.id === metodoPagoId);
      if (!paymentType) {
        return { key: 'unknown', label: 'N/A' };
      }

      switch (paymentType.nombre) {
        case 'pago_diario':
          return { key: 'pago_diario', label: 'Pago Diario' };
        case 'mensualidad':
          return { key: 'mensualidad', label: 'Mensualidad' };
        case 'tarjeta':
          return { key: 'tarjeta', label: 'Tarjeta' };
        default:
          return { key: paymentType.nombre, label: paymentType.nombre };
      }
    },
  };

  const getAthleteNamePartsUseCase = {
    execute: ({ athleteUser }) => {
      const nombreOriginal = athleteUser?.nombre?.trim() || '';
      const apellidoOriginal = athleteUser?.apellido?.trim() || '';
      const nombreParts = nombreOriginal.split(/\s+/).filter(Boolean);
      const apellidoParts = apellidoOriginal.split(/\s+/).filter(Boolean);
      const primerNombre = nombreParts[0] || '';
      const primerApellido = apellidoParts[0] || '';
      const segundoApellido = apellidoParts.slice(1).join(' ');
      const nombreCompleto = `${nombreOriginal} ${apellidoOriginal}`.trim();

      return {
        nombreOriginal,
        apellidoOriginal,
        primerNombre,
        primerApellido,
        segundoApellido,
        nombreCompleto,
      };
    },
  };

  const getHomonymKeyUseCase = {
    execute: ({ athleteUser }) => {
      const { primerNombre, primerApellido } = getAthleteNamePartsUseCase.execute({ athleteUser });
      if (!primerNombre && !primerApellido) return '';
      return `${primerNombre.toLowerCase()}|${primerApellido.toLowerCase()}`;
    },
  };

  const getCompactDisplayNameUseCase = {
    execute: ({ athleteUser, isHomonym = false }) => {
      const {
        nombreOriginal,
        primerNombre,
        primerApellido,
        segundoApellido,
        nombreCompleto,
      } = getAthleteNamePartsUseCase.execute({ athleteUser });

      const nombreBase = `${primerNombre || nombreOriginal} ${primerApellido}`.trim();

      if (!nombreBase) {
        return nombreCompleto || 'Sin nombre';
      }

      if (isHomonym) {
        if (segundoApellido) {
          return `${nombreBase} ${segundoApellido}`.trim();
        }

        return nombreCompleto || nombreBase;
      }

      return nombreBase;
    },
  };

  const getSearchNameBlobUseCase = {
    execute: ({ athleteUser }) => {
      const {
        nombreOriginal,
        apellidoOriginal,
        primerNombre,
        primerApellido,
        segundoApellido,
        nombreCompleto,
      } = getAthleteNamePartsUseCase.execute({ athleteUser });

      return [
        `${nombreOriginal} ${apellidoOriginal}`.trim(),
        `${primerNombre || nombreOriginal} ${primerApellido}`.trim(),
        `${primerNombre || nombreOriginal} ${primerApellido} ${segundoApellido}`.trim(),
        nombreCompleto,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    },
  };

  const getAthleteInitialsUseCase = {
    execute: ({ athleteUser }) => {
      const { primerNombre, primerApellido, nombreOriginal, apellidoOriginal } =
        getAthleteNamePartsUseCase.execute({ athleteUser });
      const first = (primerNombre || nombreOriginal || 'A').charAt(0);
      const last = (primerApellido || apellidoOriginal || 'A').charAt(0);
      return `${first}${last}`.toUpperCase();
    },
  };

  const buildHomonymsByCompactNameUseCase = {
    execute: ({ athletes }) => {
      const counts = {};
      (athletes || []).forEach((athlete) => {
        const key = getHomonymKeyUseCase.execute({ athleteUser: athlete?.users });
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    },
  };

  const buildDayAttendanceBreakdownUseCase = {
    execute: ({ dayAttendances }) => {
      const rows = dayAttendances || [];
      const iniciacion = rows.filter(
        (attendance) =>
          attendance.students?.categoria === 'iniciacion_hombres' ||
          attendance.students?.categoria === 'iniciacion_mujeres'
      );
      const iniciacionHombres = iniciacion.filter((attendance) => attendance.students?.categoria === 'iniciacion_hombres');
      const iniciacionMujeres = iniciacion.filter((attendance) => attendance.students?.categoria === 'iniciacion_mujeres');
      const perfHombres = rows.filter((attendance) => attendance.students?.categoria === 'perfeccionamiento_hombres');
      const perfMujeres = rows.filter(
        (attendance) =>
          attendance.students?.categoria === 'perfeccionamiento_mujeres' ||
          attendance.students?.categoria === 'master_mujeres'
      );

      return {
        iniciacion,
        iniciacionHombres,
        iniciacionMujeres,
        perfHombres,
        perfMujeres,
        total: rows.length,
      };
    },
  };

  const filterTodayAttendanceUseCase = {
    execute: ({ todayAttendance, selectedCategory, searchTerm, searchPredicate }) => {
      let filtered = todayAttendance || [];

      if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter((athlete) => athlete.categoria?.includes(selectedCategory));
      }

      if (searchTerm?.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter((athlete) => searchPredicate(athlete, searchLower));
      }

      return filtered;
    },
  };

  const filterTodayAttendanceByCategoryUseCase = {
    execute: ({ todayAttendance, category, searchTerm, searchPredicate }) => {
      let filtered = (todayAttendance || []).filter((athlete) => athlete.categoria === category);

      if (searchTerm?.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter((athlete) => searchPredicate(athlete, searchLower));
      }

      return filtered;
    },
  };

  const getCategoryStatsUseCase = {
    execute: ({ filteredAthletes }) => {
      const total = (filteredAthletes || []).length;
      const presentes = (filteredAthletes || []).filter((athlete) => athlete.attendance !== null).length;
      const ausentes = total - presentes;
      const porcentaje = total > 0 ? ((presentes / total) * 100).toFixed(1) : 0;

      return { total, presentes, ausentes, porcentaje };
    },
  };

  const buildExportSummaryUseCase = {
    execute: ({ asistenciasByDate, dateToExport, selectedDate, todayAttendance }) => {
      const exportFecha = dateToExport || selectedDate;
      const attendancesData = asistenciasByDate?.[exportFecha]
        ? asistenciasByDate[exportFecha].map((attendance) => ({
          ...attendance.students,
          attendance: { metodo_pago_id: attendance.metodo_pago_id },
        }))
        : (todayAttendance || []).filter((athlete) => athlete.attendance !== null);

      return {
        exportFecha,
        formattedDate: formatDate(exportFecha),
        totalAttendances: attendancesData.length,
        attendancesData,
      };
    },
  };

  return {
    loadAthletesUseCase,
    loadAttendanceDataUseCase,
    loadTodayAttendanceUseCase,
    listPaymentTypesUseCase,
    registerAttendanceWithPaymentUseCase,
    removeAttendanceUseCase,
    toggleAttendanceUseCase,
    clearAttendanceForDateUseCase,
    getDefaultDatesUseCase,
    calculateStatsUseCase,
    markAllPresentWithMensualidadUseCase,
    filterTodayAttendanceUseCase,
    filterTodayAttendanceByCategoryUseCase,
    getCategoryStatsUseCase,
    buildExportSummaryUseCase,
    getPaymentTypeDisplayUseCase,
    getAthleteNamePartsUseCase,
    getHomonymKeyUseCase,
    getCompactDisplayNameUseCase,
    getSearchNameBlobUseCase,
    getAthleteInitialsUseCase,
    buildHomonymsByCompactNameUseCase,
    buildDayAttendanceBreakdownUseCase,
  };
};
