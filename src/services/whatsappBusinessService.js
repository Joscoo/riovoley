// Servicio para WhatsApp Business API (Meta Cloud API)
class WhatsAppBusinessService {
  // Configuración estática de la API
  baseURL = 'https://graph.facebook.com/v18.0';
  
  constructor() {
    // Configuración de WhatsApp Business API
    this.accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID;
  }

  /**
   * Envía un mensaje usando plantilla aprobada de WhatsApp Business
   * @param {string} to - Número de teléfono destino (formato: 5491123456789)
   * @param {string} templateName - Nombre de la plantilla aprobada
   * @param {Object} parameters - Parámetros para la plantilla
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendTemplateMessage(to, templateName, parameters = {}) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('Configuración de WhatsApp Business incompleta. Verifica las variables de entorno.');
      }

      const cleanPhone = this.formatPhoneNumber(to);
      
      const messageData = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "es_AR" // Español Argentina
          },
          components: this.buildTemplateComponents(parameters)
        }
      };

      const response = await fetch(`${this.baseURL}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Error enviando mensaje de WhatsApp');
      }

      console.log('✅ Mensaje de WhatsApp Business enviado:', result);
      return {
        success: true,
        messageId: result.messages[0].id,
        status: 'sent'
      };

    } catch (error) {
      console.error('❌ Error enviando WhatsApp Business:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envía mensaje de confirmación de pago
   * @param {Object} pagoData - Datos del pago
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendPaymentConfirmation(pagoData, phoneNumber) {
    return await this.sendTemplateMessage(
      phoneNumber,
      'confirmacion_pago', // Nombre de plantilla que debes crear en Meta Business
      {
        nombre: pagoData.estudiante_nombre,
        monto: pagoData.monto.toString(),
        fecha: new Date(pagoData.fecha_pago).toLocaleDateString('es-AR'),
        referencia: pagoData.id.toString(),
        concepto: pagoData.concepto || 'Mensualidad Club de Voley'
      }
    );
  }

  /**
   * Envía recordatorio de pago vencido
   * @param {Object} userData - Datos del usuario
   * @param {Object} deudaData - Datos de la deuda
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendPaymentReminder(userData, deudaData) {
    return await this.sendTemplateMessage(
      userData.telefono,
      'recordatorio_pago', // Nombre de plantilla para recordatorios
      {
        nombre: userData.nombre,
        monto: deudaData.monto.toString(),
        fecha_vencimiento: new Date(deudaData.fechaVencimiento).toLocaleDateString('es-AR'),
        concepto: deudaData.concepto
      }
    );
  }

  /**
   * Construye los componentes de la plantilla
   * @param {Object} parameters - Parámetros de la plantilla
   * @returns {Array} Componentes formateados
   */
  buildTemplateComponents(parameters) {
    const components = [];

    // Header component (si la plantilla tiene header con parámetros)
    if (parameters.header) {
      components.push({
        type: "header",
        parameters: [{ type: "text", text: parameters.header }]
      });
    }

    // Body component con parámetros
    const bodyParameters = this.buildBodyParameters(parameters);
    if (bodyParameters.length > 0) {
      components.push({
        type: "body",
        parameters: bodyParameters
      });
    }

    return components;
  }

  /**
   * Construye parámetros del cuerpo del mensaje
   * @param {Object} parameters - Parámetros originales
   * @returns {Array} Parámetros formateados
   */
  buildBodyParameters(parameters) {
    const bodyParameters = [];
    const parameterOrder = ['nombre', 'monto', 'fecha', 'referencia', 'concepto', 'fecha_vencimiento'];
    
    for (const key of parameterOrder) {
      if (parameters[key]) {
        let value = parameters[key];
        if (key === 'monto') {
          value = `$${parameters[key]}`;
        } else if (key === 'referencia') {
          value = `#${parameters[key]}`;
        }
        bodyParameters.push({ type: "text", text: value });
      }
    }
    
    return bodyParameters;
  }

  /**
   * Formatea número de teléfono para WhatsApp Business API
   * @param {string} phone - Número a formatear
   * @returns {string} Número formateado
   */
  formatPhoneNumber(phone) {
    // Remover todos los caracteres no numéricos
    let cleanPhone = phone.replaceAll(/\D/g, '');
    
    // Si empieza con 0, removerlo (números locales argentinos)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
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
   * Valida configuración de WhatsApp Business
   * @returns {Object} Estado de la configuración
   */
  validateConfiguration() {
    const issues = [];
    
    if (!this.accessToken) {
      issues.push('REACT_APP_WHATSAPP_ACCESS_TOKEN no configurado');
    }
    
    if (!this.phoneNumberId) {
      issues.push('REACT_APP_WHATSAPP_PHONE_NUMBER_ID no configurado');
    }
    
    if (!this.businessAccountId) {
      issues.push('REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID no configurado');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Obtiene el estado de un mensaje enviado
   * @param {string} messageId - ID del mensaje
   * @returns {Promise<Object>} Estado del mensaje
   */
  async getMessageStatus(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error obteniendo estado del mensaje:', error);
      return { error: error.message };
    }
  }

  /**
   * Lista de plantillas disponibles (deben crearse en Meta Business Manager)
   */
  static get TEMPLATES() {
    return {
      CONFIRMACION_PAGO: 'confirmacion_pago',
      RECORDATORIO_PAGO: 'recordatorio_pago',
      BIENVENIDA: 'bienvenida_club',
      SUSPENSION_CUENTA: 'suspension_cuenta',
      REACTIVACION_CUENTA: 'reactivacion_cuenta'
    };
  }

  /**
   * Configuración de números importantes del club
   */
  static get NUMEROS_CLUB() {
    return {
      ADMINISTRACION: process.env.REACT_APP_CLUB_ADMIN_PHONE,
      ENTRENADORES: process.env.REACT_APP_CLUB_COACH_PHONE,
      EMERGENCIAS: process.env.REACT_APP_CLUB_EMERGENCY_PHONE
    };
  }
}

export default WhatsAppBusinessService;