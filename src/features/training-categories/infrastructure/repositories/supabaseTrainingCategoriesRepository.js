import { supabase } from '../../../../config/supabase';
import { TrainingCategoriesError } from '../../domain/trainingCategoriesError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseTrainingCategoriesRepository {
  async listTrainingCategories({ query } = {}) {
    let request = supabase
      .from('training_categories')
      .select('*');

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (typeof filters.for_schedules === 'boolean') {
      request = request.eq('for_schedules', filters.for_schedules);
    }

    if (typeof filters.for_students === 'boolean') {
      request = request.eq('for_students', filters.for_students);
    }

    if (typeof filters.is_active === 'boolean') {
      request = request.eq('is_active', filters.is_active);
    }

    if (Array.isArray(filters.codes) && filters.codes.length > 0) {
      request = request.in('code', filters.codes);
    }

    if (sort.field && sort.direction && sort.direction !== 'none') {
      const allowedSortField = ['code', 'label', 'created_at', 'updated_at'].includes(sort.field)
        ? sort.field
        : 'label';
      request = request.order(allowedSortField, { ascending: sort.direction === 'asc' });
    } else {
      request = request
        .order('label', { ascending: true })
        .order('code', { ascending: true });
    }

    const { data, error } = await request;
    if (error) {
      throw new TrainingCategoriesError(normalizeError(error, 'Error cargando categorias de entrenamiento'), error);
    }

    return data || [];
  }

  async createTrainingCategory(payload) {
    const { error } = await supabase
      .from('training_categories')
      .insert(payload);

    if (error) {
      throw new TrainingCategoriesError(normalizeError(error, 'Error creando categoria de entrenamiento'), error);
    }
  }

  async updateTrainingCategory(code, payload) {
    const { error } = await supabase
      .from('training_categories')
      .update(payload)
      .eq('code', code);

    if (error) {
      throw new TrainingCategoriesError(normalizeError(error, 'Error actualizando categoria de entrenamiento'), error);
    }
  }

  async deleteTrainingCategory(code) {
    const { count: schedulesCount, error: schedulesError } = await supabase
      .from('schedules')
      .select('*', { count: 'exact', head: true })
      .eq('categoria', code);

    if (schedulesError) {
      throw new TrainingCategoriesError(
        normalizeError(schedulesError, 'Error validando uso de categoria en horarios'),
        schedulesError
      );
    }

    if ((schedulesCount || 0) > 0) {
      throw new TrainingCategoriesError(
        `No se puede eliminar la categoria ${code} porque tiene horarios asociados.`
      );
    }

    const { count: studentsCount, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('categoria', code);

    if (studentsError) {
      throw new TrainingCategoriesError(
        normalizeError(studentsError, 'Error validando uso de categoria en estudiantes'),
        studentsError
      );
    }

    if ((studentsCount || 0) > 0) {
      throw new TrainingCategoriesError(
        `No se puede eliminar la categoria ${code} porque tiene estudiantes asociados.`
      );
    }

    const { error } = await supabase
      .from('training_categories')
      .delete()
      .eq('code', code);

    if (error) {
      throw new TrainingCategoriesError(normalizeError(error, 'Error eliminando categoria de entrenamiento'), error);
    }
  }
}
