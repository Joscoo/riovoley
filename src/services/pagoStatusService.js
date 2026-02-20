// Servicio para manejo automático de estados de pagos
import { getEcuadorDate, getEcuadorDateTime } from '../utils/dateUtils';

export class PagoStatusService {
  
  /**
   * Calcula el estado automático de un pago basado en fechas
   * @param {Object} pago - Datos del pago
   * @returns {string} Estado calculado
   */
  static calcularEstado(pago) {
    // Usar fecha de Ecuador para cálculos
    const hoy = getEcuadorDateTime();
    hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones
    
    console.log('🔍 Calculando estado para pago:', {
      id: pago.id,
      fecha_inicio: pago.fecha_inicio,
      fecha_fin: pago.fecha_fin,
      hoy: getEcuadorDate()
    });
    
    // Si no tiene fecha de fin, no se puede determinar vencimiento
    if (!pago.fecha_fin) {
      console.log('⚠️ Sin fecha fin - Estado: activo por defecto');
      return 'activo';
    }
    
    const fechaFin = new Date(pago.fecha_fin);
    fechaFin.setHours(0, 0, 0, 0);
    
    // Calcular diferencia en días
    const diferenciaMs = fechaFin.getTime() - hoy.getTime();
    const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    
    console.log(`📅 Días restantes: ${diferenciaDias} (fecha fin: ${pago.fecha_fin})`);
    
    // Determinar estado basado SOLO en días restantes hasta fecha fin
    let estado;
    if (diferenciaDias < 0) {
      estado = 'vencido';
    } else if (diferenciaDias <= 5) {
      estado = 'proximo_a_vencer';
    } else {
      estado = 'activo';
    }
    
    console.log(`🎯 Estado calculado: ${estado}`);
    return estado;
  }
  
  /**
   * Obtiene información detallada del estado de un pago
   * @param {Object} pago - Datos del pago
   * @returns {Object} Información del estado
   */
  static getStatusInfo(pago) {
    const estado = this.calcularEstado(pago);
    const hoy = getEcuadorDateTime();
    hoy.setHours(0, 0, 0, 0);
    
    let diasRestantes = 0;
    if (pago.fecha_fin) {
      const fechaFin = new Date(pago.fecha_fin);
      fechaFin.setHours(0, 0, 0, 0);
      const diferenciaMs = fechaFin.getTime() - hoy.getTime();
      diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    }
    
    return this.buildStatusInfo(estado, pago, diasRestantes);
  }
  
  /**
   * Construye la información de estado
   * @param {string} estado - Estado calculado
   * @param {Object} pago - Datos del pago
   * @param {number} diasRestantes - Días restantes
   * @returns {Object} Información del estado
   */
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
      estaProximoAVencer: estado === 'proximo_a_vencer'
    };
  }
  
  /**
   * Obtiene información para estado activo
   */
  static getActivoInfo(pago, diasRestantes) {
    if (diasRestantes > 5) {
      return { mensaje: `${diasRestantes} días restantes` };
    }
    return { mensaje: 'Activo' };
  }
  
  /**
   * Obtiene mensaje para próximo a vencer
   */
  static getProximoVencerMensaje(diasRestantes) {
    if (diasRestantes > 0) {
      const plural = diasRestantes === 1 ? '' : 's';
      return `Vence en ${diasRestantes} día${plural}`;
    }
    return 'Vence hoy';
  }
  
  /**
   * Obtiene mensaje para vencido
   */
  static getVencidoMensaje(diasRestantes) {
    const diasVencidos = Math.abs(diasRestantes);
    if (diasVencidos === 0) {
      return 'Vencido hoy';
    }
    const plural = diasVencidos === 1 ? '' : 's';
    return `Vencido hace ${diasVencidos} día${plural}`;
  }
  
  /**
   * Actualiza automáticamente el estado de un pago en la base de datos
   * @param {Object} supabase - Cliente de Supabase
   * @param {Object} pago - Datos del pago
   * @returns {Promise<Object>} Resultado de la actualización
   */
  static async actualizarEstadoEnBD(supabase, pago) {
    const nuevoEstado = this.calcularEstado(pago);
    
    // Solo actualizar si el estado cambió
    if (pago.estado !== nuevoEstado) {
      try {
        const { error } = await supabase
          .from('payments')
          .update({ estado: nuevoEstado })
          .eq('id', pago.id);
          
        if (error) throw error;
        
        console.log(`✅ Estado actualizado para pago ${pago.id}: ${pago.estado} → ${nuevoEstado}`);
        return { success: true, estadoAnterior: pago.estado, estadoNuevo: nuevoEstado };
      } catch (error) {
        console.error(`❌ Error actualizando estado del pago ${pago.id}:`, error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: true, sinCambios: true };
  }
  
  /**
   * Actualiza todos los pagos que necesiten cambio de estado
   * @param {Object} supabase - Cliente de Supabase
   * @returns {Promise<Object>} Resumen de actualizaciones
   */
  static async actualizarTodosLosEstados(supabase) {
    try {
      // Obtener todos los pagos que no están marcados como pagados
      const { data: pagos, error } = await supabase
        .from('payments')
        .select('*')
        .is('fecha_pago', null); // Solo pagos sin fecha de pago
        
      if (error) throw error;
      
      const resultados = {
        total: pagos.length,
        actualizados: 0,
        errores: 0,
        cambios: []
      };
      
      for (const pago of pagos) {
        const resultado = await this.actualizarEstadoEnBD(supabase, pago);
        
        if (resultado.success && !resultado.sinCambios) {
          resultados.actualizados++;
          resultados.cambios.push({
            id: pago.id,
            estadoAnterior: resultado.estadoAnterior,
            estadoNuevo: resultado.estadoNuevo
          });
        } else if (!resultado.success) {
          resultados.errores++;
        }
      }
      
      console.log(`📊 Actualización masiva completada: ${resultados.actualizados} actualizados, ${resultados.errores} errores`);
      return resultados;
      
    } catch (error) {
      console.error('❌ Error en actualización masiva:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Obtiene pagos que requieren notificación (próximos a vencer o vencidos)
   * @param {Array} pagos - Lista de pagos
   * @returns {Object} Pagos categorizados por tipo de notificación
   */
  static getPagosParaNotificar(pagos) {
    const proximosAVencer = [];
    const vencidos = [];
    const vencenHoy = [];
    
    for (const pago of pagos) {
      const statusInfo = this.getStatusInfo(pago);
      
      if (statusInfo.estaVencido) {
        vencidos.push({ ...pago, statusInfo });
      } else if (statusInfo.estaProximoAVencer) {
        if (statusInfo.diasRestantes === 0) {
          vencenHoy.push({ ...pago, statusInfo });
        } else {
          proximosAVencer.push({ ...pago, statusInfo });
        }
      }
    }
    
    return {
      proximosAVencer,
      vencidos,
      vencenHoy,
      totalParaNotificar: proximosAVencer.length + vencidos.length + vencenHoy.length
    };
  }
  
  /**
   * Configuración de días para alertas
   */
  static get CONFIGURACION() {
    return {
      DIAS_ALERTA: 5, // Días antes del vencimiento para marcar como "próximo a vencer"
      HORA_VERIFICACION: 9, // Hora del día para ejecutar verificaciones automáticas (9 AM)
      INTERVALO_VERIFICACION: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
    };
  }
  
  /**
   * Estados posibles de los pagos
   */
  static get ESTADOS() {
    return {
      ACTIVO: 'activo',
      PROXIMO_A_VENCER: 'proximo_a_vencer',
      VENCIDO: 'vencido'
    };
  }
  
  /**
   * Obtiene descripción legible de un estado
   * @param {string} estado - Estado del pago
   * @returns {string} Descripción del estado
   */
  static getEstadoDescripcion(estado) {
    const descripciones = {
      'activo': 'Activo',
      'proximo_a_vencer': 'Próximo a Vencer',
      'vencido': 'Vencido'
    };
    
    return descripciones[estado] || 'Estado Desconocido';
  }
}

export default PagoStatusService;