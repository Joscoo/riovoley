import type { GenerateReportInput } from '../../domain/reporting-types.ts';
import { LegacyReportingGateway } from '../../infrastructure/legacy-reporting-gateway.ts';

export class GenerateReportRunUseCase {
  constructor(private readonly gateway: LegacyReportingGateway) {}

  async execute(input: GenerateReportInput) {
    return this.gateway.generateReport(input);
  }
}
