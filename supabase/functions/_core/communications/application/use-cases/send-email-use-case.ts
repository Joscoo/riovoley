import { CommunicationsCoreError, type SendEmailInput } from '../../domain/communications-error.ts';
import type { ResendCommunicationsGateway } from '../../infrastructure/resend-communications-gateway.ts';
import type { SupabaseAuthAdminGateway } from '../../../auth-admin/infrastructure/supabase-auth-admin-gateway.ts';

export class SendEmailUseCase {
  constructor(private readonly gateway: ResendCommunicationsGateway, private readonly authGateway: SupabaseAuthAdminGateway) {}

  async execute(input: SendEmailInput, authorization: string) {
    await this.authGateway.requireActor(authorization);
    if (typeof input.to !== 'string' || typeof input.subject !== 'string' || typeof input.html !== 'string'
      || !input.to.trim() || !input.subject.trim() || !input.html.trim()) {
      throw new CommunicationsCoreError(
        400,
        'MISSING_FIELDS',
        'Missing required fields: to, subject, html',
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to.trim()) || /[\r\n]/.test(input.subject)) {
      throw new CommunicationsCoreError(400, 'INVALID_RECIPIENT', 'El destinatario o el asunto del correo no son válidos.');
    }

    const result = await this.gateway.sendEmail({ ...input, to: input.to.trim() });
    if (!result?.id) throw new CommunicationsCoreError(502, 'INVALID_PROVIDER_RESPONSE', 'No se confirmó el envío del correo.');

    return {
      success: true,
      code: 'EMAIL_SENT',
      message: 'El proveedor aceptó el correo para su envío.',
      deliveryStatus: 'accepted',
      messageId: result?.id || null,
      details: null,
    };
  }
}
