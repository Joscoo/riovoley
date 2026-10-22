import { supabase } from '../../../../config/supabase';
import { APP_BASE_URL, APP_LOGIN_URL, AUTH_RESET_PASSWORD_REDIRECT_URL } from '../../../../config/appUrls';
import { escapeHtml } from '../../../../shared/lib/escapeHtml';
import { readFunctionError } from '../../../../shared/infrastructure/http/functionError';

const generateCredentialsEmailTemplate = ({ name, email, password, isResend }) => `
  <!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a Riovoley</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #dbeafe;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0;">Bienvenido a Riovoley</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="margin-top: 0;">Hola ${escapeHtml(name)}</h2>
        <p>${isResend ? 'Se ha generado una nueva contraseña temporal. La contraseña anterior dejó de funcionar.' : 'Tu cuenta ha sido creada exitosamente.'}</p>
        <div style="background: #f1f5f9; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 0;"><strong>Contraseña temporal:</strong> <code>${escapeHtml(password)}</code></p>
        </div>
        <p><strong>Importante:</strong> cambia tu Contraseña en tu primer inicio de Sesión.</p>
        <p><a href="${APP_LOGIN_URL}" style="color: #1e3a8a; font-weight: bold;">${APP_LOGIN_URL}</a></p>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 13px; color: #475569;">
        <p style="margin: 0;">Club Riovoley - ${APP_BASE_URL}</p>
      </div>
    </div>
  </body>
  </html>
`;

const formatDate = (dateStr) => {
  if (!dateStr) return 'No especificada';
  try {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10));
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateStr;
  }
};

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(amount);

const generatePaymentConfirmationTemplate = ({ name, monto, fecha_inicio, fecha_fin, fecha_pago, estado }) => `
  <!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmacion de Pago - Riovoley</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; background: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #dbeafe;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0;">Confirmacion de Pago</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="margin-top: 0;">Hola ${name}</h2>
        <p>Hemos registrado tu pago correctamente.</p>
        <div style="background: #f1f5f9; border-left: 4px solid #1e3a8a; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 6px;"><strong>Monto:</strong> ${formatCurrency(monto)}</p>
          <p style="margin: 0 0 6px;"><strong>Fecha de pago:</strong> ${formatDate(fecha_pago)}</p>
          <p style="margin: 0 0 6px;"><strong>Periodo:</strong> ${formatDate(fecha_inicio)} - ${formatDate(fecha_fin)}</p>
          <p style="margin: 0;"><strong>Estado:</strong> ${(estado || 'desconocido').toUpperCase()}</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 13px; color: #475569;">
        <p style="margin: 0;">Club Riovoley - ${APP_BASE_URL}</p>
      </div>
    </div>
  </body>
  </html>
`;

const invokeSendEmail = async ({ to, subject, html }) => {
  return supabase.functions.invoke('send-email', {
    body: { to, subject, html }
  });
};

export class SupabaseCommunicationsRepository {
  async sendCredentials(userData) {
    try {
      const { email: rawEmail, full_name, nombre, apellido, password } = userData || {};
      const email = rawEmail?.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || typeof password !== 'string' || !password) {
        return { success: false, error: 'Se necesitan un email válido y la contraseña temporal para enviar credenciales.' };
      }
      const displayName = full_name || `${nombre || ''} ${apellido || ''}`.trim() || 'Usuario';
      const html = generateCredentialsEmailTemplate({
        name: displayName,
        email,
        password,
        isResend: userData.isResend === true,
      });

      const { data, error } = await invokeSendEmail({
        to: email,
        subject: userData.isResend ? 'Tus credenciales de acceso - Riovoley' : 'Bienvenido al Club Riovoley - Credenciales de Acceso',
        html
      });

      if (error || !data?.success) {
        const failure = await readFunctionError(error, data, 'El servicio no confirmó el envío del correo.');
        return { success: false, error: failure.message, code: failure.code };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPaymentConfirmation(paymentData) {
    try {
      const { email, nombre, apellido, monto, fecha_inicio, fecha_fin, fecha_pago, estado } = paymentData;
      const displayName = `${nombre || ''} ${apellido || ''}`.trim() || 'Usuario';
      const html = generatePaymentConfirmationTemplate({
        name: displayName,
        monto,
        fecha_inicio,
        fecha_fin,
        fecha_pago,
        estado
      });

      const { data, error } = await invokeSendEmail({
        to: email,
        subject: 'Confirmacion de Pago - Club Riovoley',
        html
      });

      if (error || !data?.success) {
        const failure = await readFunctionError(error, data, 'El servicio no confirmó el envío del correo.');
        return { success: false, error: failure.message, code: failure.code };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPasswordReset(userData) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userData.email.trim(), {
        redirectTo: AUTH_RESET_PASSWORD_REDIRECT_URL
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
