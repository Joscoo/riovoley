import { supabase } from '../../../../config/supabase';
import { PaymentsError } from '../../domain/paymentsError';

const normalizeError = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const SORTABLE_FIELDS = {
  monto: 'monto',
  estado: 'estado',
  fecha_inicio: 'fecha_inicio',
  fecha_pago: 'fecha_pago',
  membership_type: 'membership_type_id',
};

const resolveSortDirection = (direction) => (direction === 'desc' ? false : true);

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

  async listMembershipTypes() {
    const { data, error } = await supabase
      .from('membership_types')
      .select('id, code, nombre, detalle, costo, active')
      .eq('active', true)
      .order('costo', { ascending: false });

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error al cargar tipos de mensualidad'), error);
    }

    return data || [];
  }

  async listPayments({ query } = {}) {
    let request = supabase
      .from('payments')
      .select(`
        *,
        student:students(
          id,
          categoria,
          user:users(id, nombre, apellido, email, telefono)
        )
      `)
      .is('deleted_at', null);

    const filters = query?.filters || {};
    const sort = query?.sort || {};

    if (filters.fecha_inicio) {
      request = request.gte('fecha_inicio', filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      request = request.lte('fecha_fin', filters.fecha_fin);
    }

    if (filters.estado) {
      request = request.eq('estado', filters.estado);
    }

    if (filters.atleta) {
      request = request.eq('student_id', filters.atleta);
    }

    if (filters.membership_type) {
      request = request.eq('membership_type_id', filters.membership_type);
    }

    const backendSortField = SORTABLE_FIELDS[sort.field];
    if (backendSortField && sort.direction && sort.direction !== 'none') {
      request = request.order(backendSortField, { ascending: resolveSortDirection(sort.direction) });
    } else {
      request = request.order('fecha_inicio', { ascending: false });
    }

    const { data, error } = await request;

    if (error) {
      throw new PaymentsError(normalizeError(error, 'Error al cargar pagos'), error);
    }

    return data || [];
  }

  async createPayment(payload) {
    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select('*')
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

  async getPaymentPeriodPreview({ studentId, fechaPago }) {
    const safeDate = fechaPago || new Date().toISOString().slice(0, 10);
    return {
      studentId,
      fecha_pago: safeDate,
    };
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
