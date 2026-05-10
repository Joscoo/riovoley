import { getEcuadorISOString } from '../../../utils/dateUtils';
import { SupabasePhysicalTestsRepository } from '../infrastructure/repositories/supabasePhysicalTestsRepository';

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

export const createPhysicalTestsService = (repository = new SupabasePhysicalTestsRepository()) => {
  const loadAtletas = async () => {
    const athletes = await repository.listAthletes();
    return (athletes || []).map((student) => ({
      ...student,
      full_name: `${student.users?.nombre || ''} ${student.users?.apellido || ''}`.trim(),
    }));
  };

  const loadTests = async ({ filters }) => {
    const testsData = await repository.listTests({
      atletaId: filters.atletaId,
      fechaDesde: filters.fechaDesde,
      fechaHasta: filters.fechaHasta,
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
  };

  const createTest = async ({ formData }) => {
    await repository.createTest(buildTestPayload(formData));
  };

  const updateTest = async ({ testId, formData }) => {
    return repository.updateTest(testId, buildTestPayload(formData));
  };

  const deleteTest = async ({ testId }) => {
    await repository.deleteTest(testId);
  };

  return {
    loadAtletas,
    loadTests,
    createTest,
    updateTest,
    deleteTest,
  };
};
