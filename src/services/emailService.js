// src/services/emailService.js
import { supabase } from '../config/supabase.js';

/**
 * Servicio para envío de correos electrónicos
 */
export class EmailService {
  
  /**
   * Envía credenciales de acceso por correo electrónico
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.email - Correo electrónico
   * @param {string} userData.full_name - Nombre completo
   * @param {string} userData.password - Contraseña temporal
   * @returns {Promise} - Resultado del envío
   */
  static async sendCredentials(userData) {
    try {
      const { email, full_name, nombre, apellido, password } = userData;
      
      // Construir el nombre completo con fallbacks
      const displayName = full_name || `${nombre || ''} ${apellido || ''}`.trim() || 'Usuario';
      
      console.log('[EMAIL] Datos recibidos para email:', { email, full_name, nombre, apellido, displayName });
      
      // Template del correo
      const emailHTML = this.generateCredentialsEmailTemplate({
        name: displayName,
        email: email,
        password: password
      });
      
      // Enviar usando Supabase Edge Functions
      console.log('Enviando correo a:', email);
      
      console.log('🔍 Intentando enviar correo a:', email);
      console.log('[EMAIL] Datos del correo:', { 
        to: email, 
        subject: '🏐 Bienvenido al Club Riovoley - Credenciales de Acceso',
        htmlLength: emailHTML.length
      });
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: '🏐 Bienvenido al Club Riovoley - Credenciales de Acceso',
          html: emailHTML
        }
      });
      
      console.log('📡 Respuesta completa de Edge Function:', { data, error });
      
      if (error) {
        console.error('[ERROR] Error de Supabase Functions:', error);
        console.error('[ERROR] Tipo de error:', error.constructor.name);
        console.error('[ERROR] Mensaje completo:', error.message);
        
        // Si es un FunctionsHttpError, intentamos obtener más detalles
        if (error.context) {
          console.error('[ERROR] Contexto del error:', error.context);
        }
        
        // Fallback: mostrar la información al administrador
        this.showCredentialsModal(userData);
        return { success: false, error: error.message };
      }
      
      // Verificar si la respuesta de la Edge Function indica éxito
      if (data && data.success) {
        console.log('[SUCCESS] Correo enviado exitosamente:', data);
        return { success: true, data };
      } else {
        console.error('❌ Edge Function devolvió error:', data);
        this.showCredentialsModal(userData);
        return { success: false, error: data?.error || 'Error desconocido en el envío' };
      }
    } catch (error) {
      console.error('Error en servicio de email:', error);
      // Fallback: mostrar la información al administrador
      this.showCredentialsModal(userData);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía confirmación de pago por correo electrónico
   * @param {Object} paymentData - Datos del pago
   * @param {string} paymentData.email - Correo electrónico del atleta
   * @param {string} paymentData.nombre - Nombre del atleta
   * @param {string} paymentData.apellido - Apellido del atleta
   * @param {number} paymentData.monto - Monto del pago
   * @param {string} paymentData.fecha_inicio - Fecha de inicio del período
   * @param {string} paymentData.fecha_fin - Fecha de fin del período
   * @param {string} paymentData.fecha_pago - Fecha del pago
   * @param {string} paymentData.estado - Estado del pago
   * @returns {Promise} - Resultado del envío
   */
  static async sendPaymentConfirmation(paymentData) {
    try {
      const { email, nombre, apellido, monto, fecha_inicio, fecha_fin, fecha_pago, estado } = paymentData;
      
      // Construir el nombre completo con fallbacks
      const displayName = `${nombre || ''} ${apellido || ''}`.trim() || 'Usuario';
      
      console.log('📧 Preparando email de confirmación de pago para:', email);
      
      // Template del correo
      const emailHTML = this.generatePaymentConfirmationTemplate({
        name: displayName,
        monto: monto,
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin,
        fecha_pago: fecha_pago,
        estado: estado
      });
      
      // Enviar usando Supabase Edge Functions
      console.log('� Enviando confirmación de pago a:', email);
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: '🏐 Confirmación de Pago - Club Riovoley',
          html: emailHTML
        }
      });
      
      console.log('📡 Respuesta completa de Edge Function para pago:', { data, error });
      
      if (error) {
        console.error('❌ Error de Supabase Functions:', error);
        return { success: false, error: error.message };
      }
      
      // Verificar si la respuesta de la Edge Function indica éxito
      if (data && data.success) {
        console.log('✅ Confirmación de pago enviada exitosamente:', data);
        return { success: true, data };
      } else {
        console.error('❌ Error en Edge Function para confirmación de pago:', data);
        return { success: false, error: data?.error || 'Error desconocido en el envío' };
      }
    } catch (error) {
      console.error('❌ Error en servicio de email para confirmación de pago:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Genera el template HTML del correo de credenciales
   * @param {Object} data - Datos para el template
   * @returns {string} - HTML del correo
   */
  static generateCredentialsEmailTemplate(data) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Riovoley</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .content {
                padding: 30px;
            }
            .credentials-box {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }
            .credential-item {
                margin: 10px 0;
                font-size: 16px;
            }
            .credential-label {
                font-weight: 600;
                color: #495057;
            }
            .credential-value {
                font-family: 'Courier New', monospace;
                background: #e9ecef;
                padding: 5px 10px;
                border-radius: 4px;
                color: #212529;
                word-break: break-all;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .steps {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .step {
                margin: 8px 0;
                padding-left: 20px;
                position: relative;
            }
            .step::before {
                content: "→";
                position: absolute;
                left: 0;
                color: #667eea;
                font-weight: bold;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #dee2e6;
                font-size: 14px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏐 Bienvenido a Riovoley</h1>
                <p>Tus credenciales de acceso están listas</p>
            </div>
            
            <div class="content">
                <h2>¡Hola ${data.name}!</h2>
                
                <p>Te damos la bienvenida a <strong>Riovoley</strong>. Tu cuenta ha sido creada exitosamente y ya puedes acceder a nuestra plataforma.</p>
                
                <div class="credentials-box">
                    <h3>📝 Tus credenciales de acceso:</h3>
                    
                    <div class="credential-item">
                        <div class="credential-label">Usuario/Email:</div>
                        <div class="credential-value">${data.email}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Contraseña temporal:</div>
                        <div class="credential-value">${data.password}</div>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Esta es una contraseña temporal. Por motivos de seguridad, deberás cambiarla en tu primer inicio de sesión.
                </div>
                
                <div class="steps">
                    <h3>🚀 Primeros pasos:</h3>
                    <div class="step">Accede a la plataforma con tus credenciales</div>
                    <div class="step">Cambia tu contraseña por una personal y segura</div>
                    <div class="step">Completa tu perfil si es necesario</div>
                    <div class="step">¡Comienza a disfrutar de todos los servicios!</div>
                </div>
                
                <p><strong>Enlace de acceso:</strong><br>
                <a href="${window.location.origin}" style="color: #667eea; text-decoration: none; font-weight: 600;">
                    ${window.location.origin}
                </a></p>
                
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo administrativo.</p>
                
                <p>¡Nos vemos en la cancha! 🏐</p>
            </div>
            
            <div class="footer">
                <p><strong>Club Riovoley</strong></p>
                <p>📧 Email: riovoleyrbb@gmail.com | 📞 Teléfono: 0963840728</p>
                <p>🌐 Web: riovoley.vercel.app</p>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: #6c757d;">
                    Este correo fue enviado automáticamente. Por favor, no respondas a este mensaje.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  
  /**
   * Muestra modal con credenciales cuando falla el envío de correo
   * @param {Object} userData - Datos del usuario
   */
  static showCredentialsModal(userData) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      ">
        <h3 style="color: #667eea; margin-bottom: 20px;">📧 No se pudo enviar el correo</h3>
        <p><strong>Credenciales del usuario:</strong></p>
        <div style="
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: left;
        ">
          <p><strong>Usuario:</strong> ${userData.email}</p>
          <p><strong>Contraseña:</strong> <code style="background: #e9ecef; padding: 2px 8px; border-radius: 4px;">${userData.password}</code></p>
        </div>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
          Por favor, comunica estas credenciales al usuario manualmente.
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Entendido</button>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  /**
   * Envía correo de restablecimiento de contraseña
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} - Resultado del envío
   */
  static async sendPasswordReset(userData) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error enviando reset de contraseña:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Genera el template HTML del correo de confirmación de pago
   * @param {Object} data - Datos para el template
   * @returns {string} - HTML del correo
   */
  static generatePaymentConfirmationTemplate(data) {
    const formatDate = (dateStr) => {
      if (!dateStr) return 'No especificada';
      try {
        return new Date(dateStr).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
      } catch (error) {
        return dateStr;
      }
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const getEstadoBadge = (estado) => {
      const badges = {
        'pagado': { color: '#28a745', text: '✅ PAGADO' },
        'pendiente': { color: '#ffc107', text: '⏳ PENDIENTE' },
        'vencido': { color: '#dc3545', text: '❌ VENCIDO' },
        'cancelado': { color: '#6c757d', text: '🚫 CANCELADO' }
      };
      
      const badge = badges[estado] || { color: '#007bff', text: estado?.toUpperCase() || 'DESCONOCIDO' };
      
      return `
        <span style="
          background: ${badge.color};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">
          ${badge.text}
        </span>
      `;
    };

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Pago - Riovoley</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 2rem;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2rem;
                font-weight: 700;
            }
            .header p {
                margin: 0.5rem 0 0;
                opacity: 0.9;
                font-size: 1.1rem;
            }
            .content {
                padding: 2rem;
            }
            .content h2 {
                color: #1e3c72;
                margin: 0 0 1rem;
                font-size: 1.5rem;
            }
            .payment-details {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 12px;
                padding: 1.5rem;
                margin: 1.5rem 0;
                border-left: 5px solid #1e3c72;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #495057;
                font-size: 0.95rem;
            }
            .detail-value {
                font-weight: 500;
                color: #212529;
                text-align: right;
            }
            .monto-destacado {
                font-size: 1.25rem;
                font-weight: 700;
                color: #28a745;
            }
            .periodo-box {
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
                text-align: center;
                border: 2px solid #2196f3;
            }
            .periodo-title {
                font-weight: 600;
                color: #1565c0;
                margin-bottom: 0.5rem;
                font-size: 1rem;
            }
            .periodo-dates {
                font-size: 1.1rem;
                font-weight: 500;
                color: #0d47a1;
            }
            .status-badge {
                text-align: center;
                margin: 1.5rem 0;
            }
            .footer {
                background: #f8f9fa;
                padding: 1.5rem;
                text-align: center;
                border-top: 1px solid #e0e0e0;
            }
            .footer p {
                margin: 0.5rem 0;
                color: #6c757d;
                font-size: 0.9rem;
            }
            .club-info {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 1rem;
                text-align: center;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                .header, .content {
                    padding: 1.5rem;
                }
                .detail-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.25rem;
                }
                .detail-value {
                    text-align: left;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏐 Riovoley</h1>
                <p>Confirmación de Pago</p>
            </div>
            
            <div class="content">
                <h2>¡Hola ${data.name}!</h2>
                
                <p>Te confirmamos que hemos registrado tu pago correctamente. A continuación encontrarás los detalles:</p>
                
                <div class="payment-details">
                    <div class="detail-row">
                        <span class="detail-label">💰 Monto:</span>
                        <span class="detail-value monto-destacado">${formatCurrency(data.monto)}</span>
                    </div>
                    
                    ${data.fecha_pago ? `
                    <div class="detail-row">
                        <span class="detail-label">📅 Fecha de Pago:</span>
                        <span class="detail-value">${formatDate(data.fecha_pago)}</span>
                    </div>
                    ` : ''}
                </div>

                ${data.fecha_inicio || data.fecha_fin ? `
                <div class="periodo-box">
                    <div class="periodo-title">📋 Período Cubierto</div>
                    <div class="periodo-dates">
                        ${data.fecha_inicio ? `<strong>Desde:</strong> ${formatDate(data.fecha_inicio)}` : ''}
                        ${data.fecha_inicio && data.fecha_fin ? '<br>' : ''}
                        ${data.fecha_fin ? `<strong>Hasta:</strong> ${formatDate(data.fecha_fin)}` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="status-badge">
                    ${getEstadoBadge(data.estado)}
                </div>
                
                <p>Si tienes alguna pregunta sobre este pago o necesitas una factura, no dudes en contactarnos.</p>
                
                <p><strong>¡Gracias por ser parte del Club Riovoley!</strong> 🏐</p>
            </div>
            
            <div class="footer">
                <p><strong>Club Riovoley</strong></p>
                <p>📧 Email: riovoleyrbb@gmail.com | 📞 Teléfono: 0963840728</p>
                <p>🌐 Web: riovoley.vercel.app</p>
            </div>
            
            <div class="club-info">
                <p style="margin: 0; font-size: 0.8rem; opacity: 0.8;">
                    Este es un email automático, por favor no responder directamente.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}