import { CommunicationsCoreError, type SendEmailInput } from '../domain/communications-error.ts';

export class ResendCommunicationsGateway {
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor() {
    this.apiKey = Deno.env.get('RESEND_API_KEY') || '';
    this.fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@riovoley.com';

    if (!this.apiKey) {
      throw new CommunicationsCoreError(500, 'MISSING_ENV', 'RESEND_API_KEY environment variable is not set');
    }
  }

  async sendEmail(input: SendEmailInput) {
    const emailData: Record<string, unknown> = {
      from: this.fromEmail,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    };

    if (Array.isArray(input.attachments) && input.attachments.length > 0) {
      emailData.attachments = input.attachments;
    }

    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
        throw new CommunicationsCoreError(504, 'EMAIL_PROVIDER_TIMEOUT', 'El servicio de correo tardó demasiado en responder. No se confirmó el envío.');
      }
      throw new CommunicationsCoreError(503, 'EMAIL_PROVIDER_UNAVAILABLE', 'No se pudo conectar con el servicio de correo. Intenta nuevamente más tarde.');
    }

    let result: { id?: string; message?: string; name?: string };
    try {
      result = await response.json();
    } catch (_error) {
      throw new CommunicationsCoreError(502, 'INVALID_PROVIDER_RESPONSE', 'El proveedor de correo devolvió una respuesta inválida.');
    }

    if (!response.ok) {
      const providerMessage = result?.message || '';
      if (response.status === 403 && /domain.*(not verified|verify)|verify.*domain/i.test(providerMessage)) {
        throw new CommunicationsCoreError(502, 'EMAIL_DOMAIN_NOT_VERIFIED', 'El dominio remitente no está verificado en Resend. El administrador debe verificarlo antes de enviar correos.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new CommunicationsCoreError(502, 'EMAIL_PROVIDER_AUTH', 'La clave de Resend no es válida o no tiene permisos para el remitente configurado.');
      }
      if (response.status === 429) {
        throw new CommunicationsCoreError(429, 'EMAIL_RATE_LIMIT', 'Se alcanzó el límite de envíos del proveedor. Espera unos minutos.');
      }
      throw new CommunicationsCoreError(
        response.status >= 500 ? 503 : 502,
        'SEND_EMAIL_FAILED',
        response.status >= 500 ? 'El proveedor de correo no está disponible temporalmente.' : 'El proveedor rechazó el correo. Revisa el destinatario y el remitente configurados.',
        { providerStatus: response.status, providerCode: result?.name || null },
      );
    }

    if (!result || typeof result.id !== 'string' || !result.id.trim()) {
      throw new CommunicationsCoreError(502, 'INVALID_PROVIDER_RESPONSE', 'El proveedor no confirmó un identificador para el correo.');
    }
    return { id: result.id };
  }
}
