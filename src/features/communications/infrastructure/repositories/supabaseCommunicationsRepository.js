import { supabase } from '../../../../config/supabase';
import { APP_BASE_URL, APP_LOGIN_URL, APP_RESET_PASSWORD_URL } from '../../../../config/appUrls';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (value, maxLength = 160) =>
  String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLength);

const sanitizeEmail = (value) => sanitizeText(value, 120).toLowerCase();

const escapeHtml = (value) =>
  sanitizeText(value, 320)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const resolveCommunicationsError = (context, error, data) => {
  const raw = error?.message || data?.message || data?.error || '';
  const lowered = String(raw).toLowerCase();

  if (context === 'password-reset') {
    if (lowered.includes('rate limit') || lowered.includes('too many requests')) {
      return 'Demasiados intentos. Intenta nuevamente en unos minutos.';
    }
    return 'No se pudo enviar el enlace de recuperacion.';
  }

  if (context === 'credentials') {
    return 'No se pudo enviar el correo de credenciales. Verifica el canal de comunicacion manual.';
  }

  return 'No se pudo completar el envio de comunicacion.';
};

const buildModalTextRow = (label, value, { code = false } = {}) => {
  const row = document.createElement('p');
  row.style.margin = '0 0 10px';

  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;
  row.appendChild(strong);

  if (code) {
    const codeNode = document.createElement('code');
    codeNode.style.background = '#e9ecef';
    codeNode.style.padding = '2px 8px';
    codeNode.style.borderRadius = '4px';
    codeNode.textContent = sanitizeText(value, 128);
    row.appendChild(codeNode);
  } else {
    const valueNode = document.createTextNode(sanitizeText(value, 160));
    row.appendChild(valueNode);
  }

  return row;
};

const showCredentialsModal = (userData) => {
  if (typeof document === 'undefined') {
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 100%',
    'height: 100%',
    'background: rgba(0,0,0,0.8)',
    'display: flex',
    'justify-content: center',
    'align-items: center',
    'z-index: 10000',
  ].join(';');

  const card = document.createElement('div');
  card.style.cssText = [
    'background: white',
    'padding: 30px',
    'border-radius: 15px',
    'max-width: 500px',
    'width: 90%',
    'text-align: center',
    'box-shadow: 0 20px 40px rgba(0,0,0,0.2)',
  ].join(';');

  const title = document.createElement('h3');
  title.style.cssText = 'color: #1e3a8a; margin-bottom: 20px;';
  title.textContent = 'No se pudo enviar el correo';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'Credenciales del usuario:';

  const credentialsBox = document.createElement('div');
  credentialsBox.style.cssText = [
    'background: #f8f9fa',
    'padding: 20px',
    'border-radius: 8px',
    'margin: 15px 0',
    'text-align: left',
  ].join(';');

  credentialsBox.appendChild(buildModalTextRow('Usuario', userData?.email));
  credentialsBox.appendChild(buildModalTextRow('Contrasena', userData?.password, { code: true }));

  const note = document.createElement('p');
  note.style.cssText = 'font-size: 14px; color: #666; margin-bottom: 20px;';
  note.textContent = 'Comunica estas credenciales al usuario de forma manual y segura.';

  const button = document.createElement('button');
  button.type = 'button';
  button.style.cssText = [
    'background: #1e3a8a',
    'color: white',
    'border: none',
    'padding: 10px 20px',
    'border-radius: 8px',
    'cursor: pointer',
    'font-weight: 600',
  ].join(';');
  button.textContent = 'Entendido';
  button.addEventListener('click', () => modal.remove());

  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(credentialsBox);
  card.appendChild(note);
  card.appendChild(button);

  modal.appendChild(card);
  document.body.appendChild(modal);
};

const generateCredentialsEmailTemplate = ({ name, email, password }) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const safeLoginUrl = escapeHtml(APP_LOGIN_URL);
  const safeBaseUrl = escapeHtml(APP_BASE_URL);

  return `
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
        <h2 style="margin-top: 0;">Hola ${safeName}</h2>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <div style="background: #f1f5f9; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="margin: 0;"><strong>Contrasena temporal:</strong> <code>${safePassword}</code></p>
        </div>
        <p><strong>Importante:</strong> cambia tu contrasena en tu primer inicio de sesion.</p>
        <p><a href="${safeLoginUrl}" style="color: #1e3a8a; font-weight: bold;">${safeLoginUrl}</a></p>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 13px; color: #475569;">
        <p style="margin: 0;">Club Riovoley - ${safeBaseUrl}</p>
      </div>
    </div>
  </body>
  </html>
`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No especificada';
  try {
    const [year, month, day] = String(dateStr).split('T')[0].split('-');
    const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10));
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (_error) {
    return 'No especificada';
  }
};

const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
};

const generatePaymentConfirmationTemplate = ({ name, monto, fecha_inicio, fecha_fin, fecha_pago, estado }) => {
  const safeName = escapeHtml(name);
  const safeStatus = escapeHtml((estado || 'desconocido').toUpperCase());
  const safeBaseUrl = escapeHtml(APP_BASE_URL);

  return `
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
        <h2 style="margin-top: 0;">Hola ${safeName}</h2>
        <p>Hemos registrado tu pago correctamente.</p>
        <div style="background: #f1f5f9; border-left: 4px solid #1e3a8a; padding: 16px; border-radius: 8px;">
          <p style="margin: 0 0 6px;"><strong>Monto:</strong> ${formatCurrency(monto)}</p>
          <p style="margin: 0 0 6px;"><strong>Fecha de pago:</strong> ${formatDate(fecha_pago)}</p>
          <p style="margin: 0 0 6px;"><strong>Periodo:</strong> ${formatDate(fecha_inicio)} - ${formatDate(fecha_fin)}</p>
          <p style="margin: 0;"><strong>Estado:</strong> ${safeStatus}</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 13px; color: #475569;">
        <p style="margin: 0;">Club Riovoley - ${safeBaseUrl}</p>
      </div>
    </div>
  </body>
  </html>
`;
};

const invokeSendEmail = async ({ to, subject, html }) => {
  return supabase.functions.invoke('send-email', {
    body: { to, subject, html },
  });
};

export class SupabaseCommunicationsRepository {
  async sendCredentials(userData) {
    try {
      const { email, full_name, nombre, apellido, password } = userData;
      const safeEmail = sanitizeEmail(email);

      if (!EMAIL_REGEX.test(safeEmail)) {
        return { success: false, error: 'El email proporcionado no es valido.' };
      }

      const displayName = sanitizeText(full_name || `${nombre || ''} ${apellido || ''}`, 120) || 'Usuario';
      const safePassword = sanitizeText(password, 128);
      const html = generateCredentialsEmailTemplate({
        name: displayName,
        email: safeEmail,
        password: safePassword,
      });

      const { data, error } = await invokeSendEmail({
        to: safeEmail,
        subject: 'Bienvenido al Club Riovoley - Credenciales de Acceso',
        html,
      });

      if (error || !data?.success) {
        showCredentialsModal({ email: safeEmail, password: safePassword });
        return { success: false, error: resolveCommunicationsError('credentials', error, data) };
      }

      return { success: true, data };
    } catch (error) {
      showCredentialsModal({ email: userData?.email, password: userData?.password });
      return { success: false, error: resolveCommunicationsError('credentials', error) };
    }
  }

  async sendPaymentConfirmation(paymentData) {
    try {
      const { email, nombre, apellido, monto, fecha_inicio, fecha_fin, fecha_pago, estado } = paymentData;
      const safeEmail = sanitizeEmail(email);

      if (!EMAIL_REGEX.test(safeEmail)) {
        return { success: false, error: 'El email proporcionado no es valido.' };
      }

      const displayName = sanitizeText(`${nombre || ''} ${apellido || ''}`, 120) || 'Usuario';
      const html = generatePaymentConfirmationTemplate({
        name: displayName,
        monto,
        fecha_inicio,
        fecha_fin,
        fecha_pago,
        estado,
      });

      const { data, error } = await invokeSendEmail({
        to: safeEmail,
        subject: 'Confirmacion de Pago - Club Riovoley',
        html,
      });

      if (error || !data?.success) {
        return { success: false, error: resolveCommunicationsError('payment', error, data) };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: resolveCommunicationsError('payment', error) };
    }
  }

  async sendPasswordReset(userData) {
    try {
      const safeEmail = sanitizeEmail(userData?.email);
      if (!EMAIL_REGEX.test(safeEmail)) {
        return { success: false, error: 'El email proporcionado no es valido.' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(safeEmail, {
        redirectTo: APP_RESET_PASSWORD_URL,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: resolveCommunicationsError('password-reset', error) };
    }
  }
}
