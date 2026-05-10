import { supabase } from '../../../../config/supabase';
import { PhysicalTestsError } from '../../domain/physicalTestsError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabasePhysicalTestsRepository {
  async listAthletes() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users!inner(
          id,
          nombre,
          apellido
        )
      `);

    if (error) {
      throw new PhysicalTestsError(normalizeError(error, 'Error cargando atletas'), error);
    }

    return data || [];
  }

  async listTests({ atletaId, fechaDesde, fechaHasta }) {
    let query = supabase
      .from('physical_tests')
      .select(`
        *,
        students!inner(
          id,
          categoria,
          users!inner(
            nombre,
            apellido
          )
        )
      `)
      .order('fecha_test', { ascending: false });

    if (atletaId) {
      query = query.eq('student_id', atletaId);
    }

    if (fechaDesde) {
      query = query.gte('fecha_test', fechaDesde);
    }

    if (fechaHasta) {
      query = query.lte('fecha_test', fechaHasta);
    }

    const { data, error } = await query;
    if (error) {
      throw new PhysicalTestsError(normalizeError(error, 'Error cargando tests fisicos'), error);
    }

    return data || [];
  }

  async createTest(payload) {
    const { error } = await supabase
      .from('physical_tests')
      .insert(payload);

    if (error) {
      throw new PhysicalTestsError(normalizeError(error, 'Error creando test fisico'), error);
    }
  }

  async updateTest(testId, payload) {
    const { data, error } = await supabase
      .from('physical_tests')
      .update(payload)
      .eq('id', testId)
      .select();

    if (error) {
      throw new PhysicalTestsError(normalizeError(error, 'Error actualizando test fisico'), error);
    }

    return data || [];
  }

  async deleteTest(testId) {
    const { error } = await supabase
      .from('physical_tests')
      .delete()
      .eq('id', testId);

    if (error) {
      throw new PhysicalTestsError(normalizeError(error, 'Error eliminando test fisico'), error);
    }
  }
}
