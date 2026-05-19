import { supabase } from '../../../../config/supabase';
import { AthletesError } from '../../domain/athletesError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabaseAthletesRepository {
  async listAthletes({ query } = {}) {
    let request = supabase.from('students').select(`
        id,
        user_id,
        categoria,
        fecha_nacimiento,
        users!inner(
          id,
          email,
          nombre,
          apellido,
          telefono,
          role,
          created_at
        )
      `);

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (filters.categoria) {
      request = request.eq('categoria', filters.categoria);
    }

    if (sort.field === 'categoria' && sort.direction && sort.direction !== 'none') {
      request = request.order('categoria', { ascending: sort.direction === 'asc' });
    } else if (sort.field === 'fecha_nacimiento' && sort.direction && sort.direction !== 'none') {
      request = request.order('fecha_nacimiento', { ascending: sort.direction === 'asc' });
    }

    const { data, error } = await request;

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error cargando atletas'), error);
    }

    return data || [];
  }

  async updateUser(userId, payload) {
    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId);

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error actualizando usuario del atleta'), error);
    }
  }

  async updateStudent(studentId, payload) {
    const { error } = await supabase
      .from('students')
      .update(payload)
      .eq('id', studentId);

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error actualizando atleta'), error);
    }
  }

  async deleteStudent(studentId) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error eliminando estudiante'), error);
    }
  }

  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error eliminando usuario'), error);
    }
  }

  async listStudentUserIds() {
    const { data, error } = await supabase
      .from('students')
      .select('user_id');

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error cargando usuarios enlazados a estudiantes'), error);
    }

    return data || [];
  }

  async listStudentRoleUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, apellido')
      .eq('role', 'estudiante');

    if (error) {
      throw new AthletesError(normalizeError(error, 'Error cargando usuarios estudiante'), error);
    }

    return data || [];
  }
}
