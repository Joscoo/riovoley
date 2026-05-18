import { calcularDiferenciaDias, getEcuadorDate } from '../../../utils/dateUtils';

export class PagoStatusService {
  static calcularEstado(pago) {
    const hoy = getEcuadorDate();
    if (!pago.fecha_fin) return 'activo';

    const diferenciaDias = calcularDiferenciaDias(pago.fecha_fin, hoy);
    if (diferenciaDias < 0) return 'vencido';
    if (diferenciaDias <= 5) return 'proximo_a_vencer';
    return 'activo';
  }

  static getStatusInfo(pago) {
    const estado = this.calcularEstado(pago);
    const hoy = getEcuadorDate();

    let diasRestantes = 0;
    if (pago.fecha_fin) {
      diasRestantes = calcularDiferenciaDias(pago.fecha_fin, hoy);
    }

    return this.buildStatusInfo(estado, pago, diasRestantes);
  }

  static buildStatusInfo(estado, pago, diasRestantes) {
    let mensaje = '';
    let color = '';
    const icono = '';

    switch (estado) {
      case 'activo': {
        const info = this.getActivoInfo(pago, diasRestantes);
        mensaje = info.mensaje;
        color = '#28a745';
        break;
      }
      case 'proximo_a_vencer': {
        mensaje = this.getProximoVencerMensaje(diasRestantes);
        color = '#ffc107';
        break;
      }
      case 'vencido': {
        mensaje = this.getVencidoMensaje(diasRestantes);
        color = '#dc3545';
        break;
      }
      default:
        mensaje = 'Estado desconocido';
        color = '#6c757d';
    }

    return {
      estado,
      diasRestantes,
      mensaje,
      color,
      icono,
      estaVencido: estado === 'vencido',
      estaProximoAVencer: estado === 'proximo_a_vencer',
    };
  }

  static getActivoInfo(_pago, diasRestantes) {
    if (diasRestantes > 5) {
      return { mensaje: `${diasRestantes} dias restantes` };
    }
    return { mensaje: 'Activo' };
  }

  static getProximoVencerMensaje(diasRestantes) {
    if (diasRestantes > 0) {
      const plural = diasRestantes === 1 ? '' : 's';
      return `Vence en ${diasRestantes} dia${plural}`;
    }
    return 'Vence hoy';
  }

  static getVencidoMensaje(diasRestantes) {
    const diasVencidos = Math.abs(diasRestantes);
    if (diasVencidos === 0) return 'Vencido hoy';
    const plural = diasVencidos === 1 ? '' : 's';
    return `Vencido hace ${diasVencidos} dia${plural}`;
  }

  static async actualizarEstadoEnBD(supabase, pago) {
    const nuevoEstado = this.calcularEstado(pago);
    if (pago.estado !== nuevoEstado) {
      try {
        const { error } = await supabase.from('payments').update({ estado: nuevoEstado }).eq('id', pago.id);
        if (error) throw error;
        return { success: true, estadoAnterior: pago.estado, estadoNuevo: nuevoEstado };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true, sinCambios: true };
  }

  static async actualizarTodosLosEstados(supabase) {
    try {
      const { data: pagos, error } = await supabase.from('payments').select('*').is('deleted_at', null);
      if (error) throw error;

      const resultados = { total: pagos.length, actualizados: 0, errores: 0, cambios: [] };
      for (const pago of pagos) {
        const resultado = await this.actualizarEstadoEnBD(supabase, pago);
        if (resultado.success && !resultado.sinCambios) {
          resultados.actualizados++;
          resultados.cambios.push({
            id: pago.id,
            estadoAnterior: resultado.estadoAnterior,
            estadoNuevo: resultado.estadoNuevo,
          });
        } else if (!resultado.success) {
          resultados.errores++;
        }
      }

      return resultados;
    } catch (error) {
      return { success: false, error: error.message, total: 0, actualizados: 0, errores: 1 };
    }
  }

  static getPagosParaNotificar(pagos) {
    const proximosAVencer = [];
    const vencidos = [];
    const vencenHoy = [];

    for (const pago of pagos) {
      const statusInfo = this.getStatusInfo(pago);
      if (statusInfo.estaVencido) {
        vencidos.push({ ...pago, statusInfo });
      } else if (statusInfo.estaProximoAVencer) {
        if (statusInfo.diasRestantes === 0) vencenHoy.push({ ...pago, statusInfo });
        else proximosAVencer.push({ ...pago, statusInfo });
      }
    }

    return {
      proximosAVencer,
      vencidos,
      vencenHoy,
      totalParaNotificar: proximosAVencer.length + vencidos.length + vencenHoy.length,
    };
  }

  static get CONFIGURACION() {
    return {
      DIAS_ALERTA: 5,
      HORA_VERIFICACION: 9,
      INTERVALO_VERIFICACION: 24 * 60 * 60 * 1000,
    };
  }

  static get ESTADOS() {
    return {
      ACTIVO: 'activo',
      PROXIMO_A_VENCER: 'proximo_a_vencer',
      VENCIDO: 'vencido',
    };
  }

  static getEstadoDescripcion(estado) {
    const descripciones = {
      activo: 'Activo',
      proximo_a_vencer: 'Proximo a Vencer',
      vencido: 'Vencido',
    };
    return descripciones[estado] || 'Estado Desconocido';
  }
}

export default PagoStatusService;
