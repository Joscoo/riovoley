import { LegacyReportingGateway } from '../../infrastructure/legacy-reporting-gateway.ts';

export class DeleteReportRunUseCase {
  constructor(private readonly gateway: LegacyReportingGateway) {}

  async execute(runId: string) {
    return this.gateway.deleteRun({ runId });
  }
}
