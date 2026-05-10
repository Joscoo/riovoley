export interface GenerateReportInput {
  reportCode: string;
  periodStart: string;
  periodEnd: string;
  triggerType: 'manual' | 'scheduled';
  requestedBy?: string | null;
  observations?: string;
}

export interface DeleteReportInput {
  runId: string;
}

export interface GenerateScheduledInput {
  authorization: string;
  targetDate?: string;
}
