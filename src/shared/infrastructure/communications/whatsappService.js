// Servicio para envio de mensajes de WhatsApp
export class WhatsAppService {
  /**
   * Envia un mensaje de WhatsApp usando WhatsApp Web
   * @param {string} phoneNumber
   * @param {string} message
   */
  static sendMessage(phoneNumber, message) {
    const cleanPhone = phoneNumber.replaceAll(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Plantilla de mensaje para confirmacion de pago
   * @param {Object} pagoData
   * @returns {string}
   */
  static crearMensajePago(pagoData) {
    const fecha = new Date(pagoData.fecha_pago).toLocaleDateString('es-AR');

    return `RIO VOLEY - Confirmacion de Pago

Hola ${pagoData.estudiante_nombre}

Tu pago ha sido registrado exitosamente:

Monto: $${pagoData.monto}
Fecha: ${fecha}
Concepto: ${pagoData.concepto}
Referencia: #${pagoData.id}

${pagoData.observaciones ? `Observaciones: ${pagoData.observaciones}` : ''}

Gracias por tu pago.
Cualquier consulta, no dudes en contactarnos.

Equipo Rio Voley`;
  }

  /**
   * Plantilla de mensaje para recordatorio de pago
   * @param {Object} datos
   * @returns {string}
   */
  static crearMensajeRecordatorio(datos) {
    return `RIO VOLEY - Recordatorio de Pago

Hola ${datos.nombre}

Te recordamos que tienes un pago pendiente:

Monto: $${datos.monto}
Vencimiento: ${datos.fechaVencimiento}
Concepto: ${datos.concepto}

Para realizar el pago, puedes:
- Transferencia bancaria
- Efectivo en el club
- Mercado Pago

Gracias por tu atencion.

Equipo Rio Voley`;
  }

  /**
   * Valida formato de numero de telefono argentino
   * @param {string} phone
   * @returns {boolean}
   */
  static validarTelefono(phone) {
    const cleanPhone = phone.replaceAll(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return false;
    }
    if (cleanPhone.length > 10 && !cleanPhone.startsWith('54')) {
      return false;
    }
    return true;
  }

  /**
   * Formatea numero de telefono argentino para WhatsApp
   * @param {string} phone
   * @returns {string}
   */
  static formatearTelefono(phone) {
    let cleanPhone = phone.replaceAll(/\D/g, '');

    if (cleanPhone.length === 10) {
      cleanPhone = '54' + cleanPhone;
    }

    if (cleanPhone.length === 12 && cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
      cleanPhone = '549' + cleanPhone.substring(2);
    }

    return cleanPhone;
  }

  static get NUMEROS_CLUB() {
    return {
      ADMINISTRACION: '5491123456789',
      ENTRENADORES: '5491123456790',
      EMERGENCIAS: '5491123456791',
    };
  }
}

export default WhatsAppService;
