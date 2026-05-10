import { SupabaseAttendanceRepository } from '../infrastructure/repositories/supabaseAttendanceRepository';

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

export const createAttendanceService = (repository = new SupabaseAttendanceRepository()) => {
  const loadAthletes = async () => {
    const athletes = await repository.listAthletesWithRole();
    return athletes.filter((athlete) => athlete.users?.role === 'estudiante');
  };

  const loadAttendanceData = async ({ filters, athletes: currentAthletes }) => {
    const athletes = currentAthletes?.length > 0 ? currentAthletes : await loadAthletes();
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
  };

  const loadTodayAttendance = async ({ selectedDate, athletes }) => {
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
  };

  const listPaymentTypes = () => repository.listPaymentTypes();

  const registerAttendanceWithPayment = async ({ athleteId, selectedDate, paymentTypeId }) => {
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
  };

  const removeAttendance = async ({ athleteId, selectedDate }) => {
    await repository.deleteAttendanceByStudentAndDate(athleteId, selectedDate);
  };

  const toggleAttendance = async ({ athleteId, selectedDate, isCurrentlyPresent }) => {
    if (isCurrentlyPresent) {
      await repository.deleteAttendanceByStudentAndDate(athleteId, selectedDate);
      return;
    }

    await repository.createAttendance({
      student_id: athleteId,
      fecha: selectedDate,
    });
  };

  const clearAttendanceForDate = async ({ selectedDate }) => {
    await repository.deleteAttendancesByDate(selectedDate);
  };

  return {
    loadAthletes,
    loadAttendanceData,
    loadTodayAttendance,
    listPaymentTypes,
    registerAttendanceWithPayment,
    removeAttendance,
    toggleAttendance,
    clearAttendanceForDate,
  };
};
