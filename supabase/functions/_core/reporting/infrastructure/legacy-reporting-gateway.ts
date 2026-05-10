import {
  HttpError,
  deleteReportRun,
  generateReportRun,
  getUserRoleFromToken,
  listSchedulableDefinitions,
  resolveSchedulePeriodDate,
  type TriggerType,
} from '../../../_shared/reporting.ts';
import type { DeleteReportInput, GenerateReportInput, GenerateScheduledInput } from '../domain/reporting-types.ts';

const isServiceTokenInvocation = (authorization: string) => {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!serviceKey || !authorization?.startsWith('Bearer ')) {
    return false;
  }

  const token = authorization.replace('Bearer ', '').trim();
  return token.length > 0 && token === serviceKey;
};

export class LegacyReportingGateway {
  static HttpError = HttpError;

  async generateReport(input: GenerateReportInput) {
    return generateReportRun(input);
  }

  async deleteRun(input: DeleteReportInput) {
    return deleteReportRun(input.runId);
  }

  async requireActor(authorization: string) {
    return getUserRoleFromToken(authorization);
  }

  async listSchedulableDefinitions() {
    return listSchedulableDefinitions();
  }

  resolveSchedulePeriodDate(timezone: string, targetDate?: string) {
    return resolveSchedulePeriodDate(timezone, targetDate);
  }

  isServiceTokenInvocation(authorization: string) {
    return isServiceTokenInvocation(authorization);
  }

  asTriggerType(value: unknown): TriggerType {
    if (value === 'scheduled') return 'scheduled';
    return 'manual';
  }

  async prepareScheduledActor(input: GenerateScheduledInput) {
    if (this.isServiceTokenInvocation(input.authorization)) {
      return null;
    }
    const actor = await this.requireActor(input.authorization);
    return actor.userId;
  }
}
