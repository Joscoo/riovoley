// Servicio para WhatsApp Business API (Meta Cloud API)
class WhatsAppBusinessService {
  baseURL = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID;
  }

  async sendTemplateMessage(to, templateName, parameters = {}) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('Configuracion de WhatsApp Business incompleta. Verifica las variables de entorno.');
      }

      const cleanPhone = this.formatPhoneNumber(to);
      const messageData = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es_AR' },
          components: this.buildTemplateComponents(parameters),
        },
      };

      const response = await fetch(`${this.baseURL}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Error enviando mensaje de WhatsApp');
      }

      return {
        success: true,
        messageId: result.messages[0].id,
        status: 'sent',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendPaymentConfirmation(pagoData, phoneNumber) {
    return this.sendTemplateMessage(phoneNumber, 'confirmacion_pago', {
      nombre: pagoData.estudiante_nombre,
      monto: pagoData.monto.toString(),
      fecha: new Date(pagoData.fecha_pago).toLocaleDateString('es-AR'),
      referencia: pagoData.id.toString(),
      concepto: pagoData.concepto || 'Mensualidad Club de Voley',
    });
  }

  async sendPaymentReminder(userData, deudaData) {
    return this.sendTemplateMessage(userData.telefono, 'recordatorio_pago', {
      nombre: userData.nombre,
      monto: deudaData.monto.toString(),
      fecha_vencimiento: new Date(deudaData.fechaVencimiento).toLocaleDateString('es-AR'),
      concepto: deudaData.concepto,
    });
  }

  async sendCredentials(userData, password) {
    return this.sendTemplateMessage(userData.telefono, 'credenciales_acceso', {
      nombre: `${userData.nombre} ${userData.apellido}`,
      email: userData.email,
      password,
    });
  }

  buildTemplateComponents(parameters) {
    const components = [];
    if (parameters.header) {
      components.push({
        type: 'header',
        parameters: [{ type: 'text', text: parameters.header }],
      });
    }

    const bodyParameters = this.buildBodyParameters(parameters);
    if (bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters,
      });
    }
    return components;
  }

  buildBodyParameters(parameters) {
    const bodyParameters = [];
    const parameterOrder = ['nombre', 'monto', 'fecha', 'referencia', 'concepto', 'fecha_vencimiento'];

    for (const key of parameterOrder) {
      if (parameters[key]) {
        let value = parameters[key];
        if (key === 'monto') value = `$${parameters[key]}`;
        if (key === 'referencia') value = `#${parameters[key]}`;
        bodyParameters.push({ type: 'text', text: value });
      }
    }

    return bodyParameters;
  }

  formatPhoneNumber(phone) {
    let cleanPhone = phone.replaceAll(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length === 10) {
      cleanPhone = '54' + cleanPhone;
    }
    if (cleanPhone.length === 12 && cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
      cleanPhone = '549' + cleanPhone.substring(2);
    }
    return cleanPhone;
  }

  validateConfiguration() {
    const issues = [];
    if (!this.accessToken) issues.push('REACT_APP_WHATSAPP_ACCESS_TOKEN no configurado');
    if (!this.phoneNumberId) issues.push('REACT_APP_WHATSAPP_PHONE_NUMBER_ID no configurado');
    if (!this.businessAccountId) issues.push('REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID no configurado');
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  async getMessageStatus(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/${messageId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return await response.json();
    } catch (error) {
      return { error: error.message };
    }
  }

  static get TEMPLATES() {
    return {
      CONFIRMACION_PAGO: 'confirmacion_pago',
      RECORDATORIO_PAGO: 'recordatorio_pago',
      CREDENCIALES_ACCESO: 'credenciales_acceso',
      BIENVENIDA: 'bienvenida_club',
      SUSPENSION_CUENTA: 'suspension_cuenta',
      REACTIVACION_CUENTA: 'reactivacion_cuenta',
    };
  }

  static get NUMEROS_CLUB() {
    return {
      ADMINISTRACION: process.env.REACT_APP_CLUB_ADMIN_PHONE,
      ENTRENADORES: process.env.REACT_APP_CLUB_COACH_PHONE,
      EMERGENCIAS: process.env.REACT_APP_CLUB_EMERGENCY_PHONE,
    };
  }
}

export default WhatsAppBusinessService;
