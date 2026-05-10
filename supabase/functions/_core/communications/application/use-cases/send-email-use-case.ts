import { CommunicationsCoreError, type SendEmailInput } from '../../domain/communications-error.ts';
import { ResendCommunicationsGateway } from '../../infrastructure/resend-communications-gateway.ts';

export class SendEmailUseCase {
  constructor(private readonly gateway: ResendCommunicationsGateway) {}

  async execute(input: SendEmailInput) {
    if (!input.to || !input.subject || !input.html) {
      throw new CommunicationsCoreError(
        400,
        'MISSING_FIELDS',
        'Missing required fields: to, subject, html',
      );
    }

    const result = await this.gateway.sendEmail(input);

    return {
      success: true,
      code: 'EMAIL_SENT',
      message: 'Email sent successfully',
      messageId: result?.id || null,
      details: null,
    };
  }
}
