import { getEcuadorISOString } from '../../../../utils/dateUtils';
import { getEcuadorDate, getEcuadorDateTime } from '../../../../utils/dateUtils';

const toNullableFloat = (value) => (value ? Number.parseFloat(value) : null);
const toNullableInt = (value) => (value ? Number.parseInt(value, 10) : null);

const buildTestPayload = (formData) => ({
  student_id: formData.student_id,
  estatura: toNullableFloat(formData.estatura),
  peso: toNullableFloat(formData.peso),
  brazo_extend_inicial: toNullableFloat(formData.brazo_extend_inicial),
  brazo_extend_sin_impulso: toNullableFloat(formData.brazo_extend_sin_impulso),
  brazo_extend_con_impulso: toNullableFloat(formData.brazo_extend_con_impulso),
  fuerza_explosiva_salto_largo: toNullableFloat(formData.fuerza_explosiva_salto_largo),
  envergadura_brazos_extendidos_lateral: toNullableFloat(formData.envergadura_brazos_extendidos_lateral),
  fuerza_abdomen: toNullableInt(formData.fuerza_abdomen),
  fuerza_brazos: toNullableInt(formData.fuerza_brazos),
  fuerza_piernas: toNullableInt(formData.fuerza_piernas),
  elevaciones_barra: toNullableInt(formData.elevaciones_barra),
  observaciones: formData.observaciones || null,
  fecha_test: formData.fecha_test,
  modified_at: getEcuadorISOString(),
});

const normalizeText = (value = '') => value.toString().toLowerCase();

const getAthleteAgeAtDate = (birthStr, testDate) => {
  if (!birthStr) return null;

  const birth = new Date(birthStr);
  if (Number.isNaN(birth.getTime())) return null;

  let age = testDate.getFullYear() - birth.getFullYear();
  const birthdayThisYear = new Date(testDate.getFullYear(), birth.getMonth(), birth.getDate());
  if (testDate < birthdayThisYear) {
    age -= 1;
  }
  return age;
};

export const createPhysicalTestsUseCases = (repository, deps = {}) => {
  const nowDate = deps.getEcuadorDate || getEcuadorDate;
  const nowDateTime = deps.getEcuadorDateTime || getEcuadorDateTime;

  const loadAtletasUseCase = {
    execute: async () => {
      const athletes = await repository.listAthletes();
      return (athletes || []).map((student) => ({
        ...student,
        full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim(),
      }));
    },
  };

  const loadTestsUseCase = {
    execute: async ({ filters }) => {
      const testsData = await repository.listTests({
        atletaId: filters.atletaId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        sort: {
          field: filters.sortField || 'fecha_test',
          direction: filters.sortDirection || 'desc',
        },
      });

      const testsWithAtletaNames = (testsData || []).map((test) => ({
        ...test,
        atleta_name: `${test.students?.users?.nombre || ''} ${test.students?.users?.apellido || ''}`.trim(),
      }));

      if (!filters.search) {
        return testsWithAtletaNames;
      }

      const searchLower = normalizeText(filters.search);
      return testsWithAtletaNames.filter((test) =>
        normalizeText(test.atleta_name).includes(searchLower) ||
        normalizeText(test.observaciones).includes(searchLower));
    },
  };

  const createTestUseCase = {
    execute: async ({ formData }) => repository.createTest(buildTestPayload(formData)),
  };

  const updateTestUseCase = {
    execute: async ({ testId, formData }) => repository.updateTest(testId, buildTestPayload(formData)),
  };

  const deleteTestUseCase = {
    execute: async ({ testId }) => repository.deleteTest(testId),
  };

  const buildInitialFormUseCase = {
    execute: () => ({
      student_id: '',
      estatura: '',
      peso: '',
      brazo_extend_inicial: '',
      brazo_extend_sin_impulso: '',
      brazo_extend_con_impulso: '',
      fuerza_explosiva_salto_largo: '',
      envergadura_brazos_extendidos_lateral: '',
      fuerza_abdomen: '',
      fuerza_brazos: '',
      fuerza_piernas: '',
      elevaciones_barra: '',
      observaciones: '',
      fecha_test: nowDate(),
    }),
  };

  const buildFormFromTestUseCase = {
    execute: ({ test }) => ({
      student_id: test?.student_id || '',
      estatura: test?.estatura || '',
      peso: test?.peso || '',
      brazo_extend_inicial: test?.brazo_extend_inicial || '',
      brazo_extend_sin_impulso: test?.brazo_extend_sin_impulso || '',
      brazo_extend_con_impulso: test?.brazo_extend_con_impulso || '',
      fuerza_explosiva_salto_largo: test?.fuerza_explosiva_salto_largo || '',
      envergadura_brazos_extendidos_lateral: test?.envergadura_brazos_extendidos_lateral || '',
      fuerza_abdomen: test?.fuerza_abdomen || '',
      fuerza_brazos: test?.fuerza_brazos || '',
      fuerza_piernas: test?.fuerza_piernas || '',
      elevaciones_barra: test?.elevaciones_barra || '',
      observaciones: test?.observaciones || '',
      fecha_test: test?.fecha_test || nowDate(),
    }),
  };

  const validateTestFormUseCase = {
    execute: ({ formData, athletes }) => {
      if (!formData.student_id) {
        return { ok: false, errorMessage: 'Error: Debe seleccionar un atleta' };
      }

      if (!formData.fecha_test) {
        return { ok: false, errorMessage: 'Error: La fecha del test es requerida' };
      }

      const testDate = new Date(formData.fecha_test);
      if (Number.isNaN(testDate.getTime())) {
        return { ok: false, errorMessage: 'Error: La fecha del test no es valida' };
      }

      const today = nowDateTime();
      today.setHours(23, 59, 59, 999);
      if (testDate > today) {
        return { ok: false, errorMessage: 'Error: La fecha del test no puede ser futura' };
      }

      const selectedAthlete = (athletes || []).find((athlete) => athlete.id === formData.student_id);
      if (selectedAthlete) {
        const birthStr = selectedAthlete.fecha_nacimiento || selectedAthlete.users?.fecha_nacimiento || selectedAthlete.users?.birthday;
        const athleteAge = getAthleteAgeAtDate(birthStr, testDate);
        if (athleteAge !== null && athleteAge < 5) {
          return { ok: false, errorMessage: 'Error: El atleta debe tener al menos 5 años en la fecha del test' };
        }
      }

      const measurements = [
        formData.estatura,
        formData.peso,
        formData.brazo_extend_inicial,
        formData.brazo_extend_sin_impulso,
        formData.brazo_extend_con_impulso,
        formData.fuerza_explosiva_salto_largo,
        formData.envergadura_brazos_extendidos_lateral
      ];
      if (!measurements.some((measurement) => measurement && String(measurement).trim() !== '')) {
        return { ok: false, errorMessage: 'Error: Debe ingresar al menos una medición física' };
      }

      if (formData.estatura && (Number.parseFloat(formData.estatura) < 0.8 || Number.parseFloat(formData.estatura) > 3)) {
        return { ok: false, errorMessage: 'Error: La estatura debe estar entre 0.8m y 3.0m' };
      }

      if (formData.peso && (Number.parseFloat(formData.peso) < 15 || Number.parseFloat(formData.peso) > 300)) {
        return { ok: false, errorMessage: 'Error: El peso debe estar entre 15kg y 300kg' };
      }

      if (formData.fuerza_explosiva_salto_largo && Number.parseFloat(formData.fuerza_explosiva_salto_largo) > 10) {
        return { ok: false, errorMessage: 'Error: El salto largo no puede ser mayor a 10 metros' };
      }

      if (formData.fuerza_abdomen && (Number.parseInt(formData.fuerza_abdomen, 10) < 0 || Number.parseInt(formData.fuerza_abdomen, 10) > 400)) {
        return { ok: false, errorMessage: 'Error: Fuerza abdomen debe estar entre 0 y 400 repeticiones' };
      }

      if (formData.fuerza_brazos && (Number.parseInt(formData.fuerza_brazos, 10) < 0 || Number.parseInt(formData.fuerza_brazos, 10) > 400)) {
        return { ok: false, errorMessage: 'Error: Fuerza brazos debe estar entre 0 y 400 repeticiones' };
      }

      if (formData.fuerza_piernas && (Number.parseInt(formData.fuerza_piernas, 10) < 0 || Number.parseInt(formData.fuerza_piernas, 10) > 600)) {
        return { ok: false, errorMessage: 'Error: Fuerza piernas debe estar entre 0 y 600 repeticiones' };
      }

      if (formData.elevaciones_barra && (Number.parseInt(formData.elevaciones_barra, 10) < 0 || Number.parseInt(formData.elevaciones_barra, 10) > 300)) {
        return { ok: false, errorMessage: 'Error: Elevaciones en barra debe estar entre 0 y 300 repeticiones' };
      }

      return { ok: true };
    },
  };

  const calculateStatsUseCase = {
    execute: ({ athletes, tests }) => {
      const now = nowDateTime();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const athletesWithTestInMonth = new Set();
      (tests || []).forEach((test) => {
        const testDate = new Date(test.fecha_test);
        if (!Number.isNaN(testDate.getTime()) && testDate >= firstDayOfMonth && testDate <= lastDayOfMonth) {
          athletesWithTestInMonth.add(test.student_id);
        }
      });

      const pendingAthletes = (athletes || []).filter((athlete) => !athletesWithTestInMonth.has(athlete.id));

      const testsByAthlete = {};
      (tests || []).forEach((test) => {
        if (!testsByAthlete[test.student_id]) {
          testsByAthlete[test.student_id] = 0;
        }
        testsByAthlete[test.student_id] += 1;
      });

      const totalTests = Object.values(testsByAthlete).reduce((sum, count) => sum + count, 0);
      const average = (athletes || []).length > 0 ? (totalTests / athletes.length).toFixed(1) : 0;

      const pendingByCategory = {};
      pendingAthletes.forEach((athlete) => {
        const category = athlete.categoria || 'sin_categoria';
        if (!pendingByCategory[category]) {
          pendingByCategory[category] = [];
        }
        pendingByCategory[category].push(athlete);
      });

      return {
        stats: {
          totalAtletas: (athletes || []).length,
          conTestEsteMes: athletesWithTestInMonth.size,
          sinTestEsteMes: pendingAthletes.length,
          promedioTestsPorAtleta: average
        },
        pendingAthletes,
        pendingByCategory,
      };
    },
  };

  return {
    loadAtletasUseCase,
    loadTestsUseCase,
    createTestUseCase,
    updateTestUseCase,
    deleteTestUseCase,
    buildInitialFormUseCase,
    buildFormFromTestUseCase,
    validateTestFormUseCase,
    calculateStatsUseCase,
  };
};
