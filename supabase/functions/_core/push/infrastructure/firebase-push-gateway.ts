import { GoogleAuth } from 'npm:google-auth-library@9';

interface PushTarget {
  id: number;
  device_token: string;
  user_id: string;
}

interface PushMessage {
  title: string;
  body: string;
  route?: string;
  type: string;
  channelId?: string;
  priority?: 'normal' | 'high';
  data?: Record<string, unknown>;
}

export class FirebasePushGateway {
  private readonly projectId = Deno.env.get('FCM_PROJECT_ID') || '';
  private readonly clientEmail = Deno.env.get('FCM_CLIENT_EMAIL') || '';
  private readonly privateKey = (Deno.env.get('FCM_PRIVATE_KEY') || '').replace(/\\n/g, '\n');

  private async getAccessToken() {
    try {
      const auth = new GoogleAuth({
        credentials: {
          project_id: this.projectId,
          client_email: this.clientEmail,
          private_key: this.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });

      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error('No se pudo obtener access token para Firebase Cloud Messaging.');
      }

      return accessToken;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`No se pudo autenticar contra Firebase Cloud Messaging: ${reason}`);
    }
  }

  validateConfiguration() {
    if (!this.projectId || !this.clientEmail || !this.privateKey) {
      throw new Error('Configuración FCM incompleta. Verifica FCM_PROJECT_ID, FCM_CLIENT_EMAIL y FCM_PRIVATE_KEY.');
    }
  }

  async sendToDevices(targets: PushTarget[], message: PushMessage) {
    this.validateConfiguration();

    if (!targets.length) {
      return { sent: 0, failed: 0, invalidTokenIds: [] as number[] };
    }

    const accessToken = await this.getAccessToken();
    const invalidTokenIds: number[] = [];
    let sent = 0;
    let failed = 0;
    const failures: Array<{ targetId: number; status: number; response: string }> = [];

    for (const target of targets) {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: target.device_token,
            notification: {
              title: message.title,
              body: message.body,
            },
            android: {
              priority: message.priority === 'high' ? 'HIGH' : 'NORMAL',
              notification: {
                channel_id: message.channelId || 'announcements',
                sound: 'default',
              },
            },
            data: Object.entries({
              type: message.type,
              route: message.route || '/',
              channel_id: message.channelId || 'announcements',
              ...(message.data || {}),
            }).reduce<Record<string, string>>((accumulator, [key, value]) => {
              accumulator[key] = String(value ?? '');
              return accumulator;
            }, {}),
          },
        }),
      });

      if (response.ok) {
        sent += 1;
        continue;
      }

      failed += 1;
      const responseBody = await response.text();
      failures.push({
        targetId: target.id,
        status: response.status,
        response: responseBody.slice(0, 500),
      });

      if (
        response.status === 404 ||
        responseBody.includes('UNREGISTERED') ||
        responseBody.includes('registration-token-not-registered')
      ) {
        invalidTokenIds.push(target.id);
      }
    }

    if (sent === 0 && failed > 0 && invalidTokenIds.length !== failed) {
      const firstFailure = failures[0];
      throw new Error(
        `Firebase rechazó el envío push (${firstFailure.status}): ${firstFailure.response}`,
      );
    }

    return { sent, failed, invalidTokenIds, failures };
  }
}
