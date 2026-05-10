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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new CommunicationsCoreError(
        502,
        'SEND_EMAIL_FAILED',
        `Resend API error: ${response.status} - ${errorData}`,
        { status: response.status, body: errorData },
      );
    }

    return await response.json();
  }
}
