// Servicio para envío de mensajes de WhatsApp
export class WhatsAppService {
  
  /**
   * Envía un mensaje de WhatsApp usando WhatsApp Web
   * @param {string} phoneNumber - Número de teléfono (formato: 5491234567890)
   * @param {string} message - Mensaje a enviar
   */
  static sendMessage(phoneNumber, message) {
    // Limpiar número de teléfono (solo números)
    const cleanPhone = phoneNumber.replaceAll(/\D/g, '');
    
    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // URL de WhatsApp Web
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Plantilla de mensaje para confirmación de pago
   * @param {Object} pagoData - Datos del pago
   * @returns {string} Mensaje formateado
   */
  static crearMensajePago(pagoData) {
    const fecha = new Date(pagoData.fecha_pago).toLocaleDateString('es-AR');
    
    return `🏐 *RIO VOLEY - Confirmación de Pago*

¡Hola ${pagoData.estudiante_nombre}! 👋

✅ Tu pago ha sido registrado exitosamente:

💰 *Monto:* $${pagoData.monto}
📅 *Fecha:* ${fecha}
📋 *Concepto:* ${pagoData.concepto}
🆔 *Referencia:* #${pagoData.id}

${pagoData.observaciones ? `📝 *Observaciones:* ${pagoData.observaciones}` : ''}

¡Gracias por tu pago! 🙌
Cualquier consulta, no dudes en contactarnos.

*Equipo Rio Voley* 🏐`;
  }

  /**
   * Plantilla de mensaje para recordatorio de pago
   * @param {Object} datos - Datos del estudiante y deuda
   * @returns {string} Mensaje formateado
   */
  static crearMensajeRecordatorio(datos) {
    return `🏐 *RIO VOLEY - Recordatorio de Pago*

¡Hola ${datos.nombre}! 👋

📋 Te recordamos que tienes un pago pendiente:

💰 *Monto:* $${datos.monto}
📅 *Vencimiento:* ${datos.fechaVencimiento}
📋 *Concepto:* ${datos.concepto}

Para realizar el pago, puedes:
• 💳 Transferencia bancaria
• 💰 Efectivo en el club
• 📱 Mercado Pago

¡Gracias por tu atención! 🙌

*Equipo Rio Voley* 🏐`;
  }

  /**
   * Valida formato de número de teléfono argentino
   * @param {string} phone - Número a validar
   * @returns {boolean} True si es válido
   */
  static validarTelefono(phone) {
    // Formato argentino: +54 9 11 xxxx-xxxx
    const cleanPhone = phone.replaceAll(/\D/g, '');
    
    // Debe tener entre 10 y 13 dígitos
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return false;
    }
    
    // Si tiene código de país, debe empezar con 54
    if (cleanPhone.length > 10 && !cleanPhone.startsWith('54')) {
      return false;
    }
    
    return true;
  }

  /**
   * Formatea número de teléfono argentino para WhatsApp
   * @param {string} phone - Número a formatear
   * @returns {string} Número formateado
   */
  static formatearTelefono(phone) {
    let cleanPhone = phone.replaceAll(/\D/g, '');
    
    // Si no tiene código de país, agregar Argentina (54)
    if (cleanPhone.length === 10) {
      cleanPhone = '54' + cleanPhone;
    }
    
    // Si no tiene código de área móvil (9), agregarlo
    if (cleanPhone.length === 12 && cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
      cleanPhone = '549' + cleanPhone.substring(2);
    }
    
    return cleanPhone;
  }

  /**
   * Configuración de números importantes del club
   */
  static get NUMEROS_CLUB() {
    return {
      ADMINISTRACION: '5491123456789', // Cambiar por número real
      ENTRENADORES: '5491123456790',   // Cambiar por número real
      EMERGENCIAS: '5491123456791'     // Cambiar por número real
    };
  }
}

export default WhatsAppService;