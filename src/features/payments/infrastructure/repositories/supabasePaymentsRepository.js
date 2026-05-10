import { supabase } from '../../../../config/supabase';
import { PaymentsError } from '../../domain/paymentsError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

export class SupabasePaymentsRepository {
  async listAthletes() {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users(id, nombre, apellido, email)
      `)
      .order('users(apellido)', { ascending: true });

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error al cargar atletas para pagos'), error);
    }

    return data || [];
  }

  async listPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(
          id,
          categoria,
          user:users(id, nombre, apellido, email, telefono)
        )
      `)
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error al cargar pagos'), error);
    }

    return data || [];
  }

  async createPayment(payload) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error al crear pago'), error);
    }

    return data;
  }

  async updatePayment(paymentId, payload) {
    const { error } = await supabase
      .from('payments')
      .update(payload)
      .eq('id', paymentId);

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error al actualizar pago'), error);
    }
  }

  async softDeletePayment(paymentId, deletedAt) {
    const { error } = await supabase
      .from('payments')
      .update({ deleted_at: deletedAt })
      .eq('id', paymentId);

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error eliminando pago'), error);
    }
  }

  async getAthleteByStudentId(studentId) {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        categoria,
        users!inner(
          id,
          email,
          nombre,
          apellido,
          telefono
        )
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      throw new PaymentsError(normalizeError(error, 'No se pudo obtener el atleta para notificaciones'), error);
    }

    return data;
  }
}
