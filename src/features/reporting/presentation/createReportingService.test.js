process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

const { createReportingService } = require('./createReportingService');
const { ReportingError } = require('../domain/reportingErrors');

describe('createReportingService', () => {
  const buildRepository = () => ({
    listRuns: jest.fn(),
    generateReport: jest.fn(),
    generateScheduledReports: jest.fn(),
    getDownloadUrlByRunId: jest.fn(),
    downloadFromSignedUrl: jest.fn(),
    deleteRun: jest.fn(),
  });

  it('listRuns delega parametros y hace unwrap de result ok', async () => {
    const repository = buildRepository();
    repository.listRuns.mockResolvedValue([{ id: 'run-1' }]);

    const service = createReportingService(repository);
    const result = await service.listRuns({ reportCode: 'attendance_daily' });

    expect(repository.listRuns).toHaveBeenCalledWith({
      reportCode: 'attendance_daily',
      dateFrom: null,
      dateTo: null,
      status: null,
      limit: 60,
    });
    expect(result).toEqual([{ id: 'run-1' }]);
  });

  it('generateReport propaga error funcional cuando result ok=false', async () => {
    const repository = buildRepository();
    const domainError = new Error('report failed');
    repository.generateReport.mockRejectedValue(domainError);

    const service = createReportingService(repository);

    await expect(
      service.generateReport({
        reportCode: 'attendance_daily',
        periodStart: '2026-05-17',
        periodEnd: '2026-05-17',
      })
    ).rejects.toBeInstanceOf(ReportingError);
    await expect(
      service.generateReport({
        reportCode: 'attendance_daily',
        periodStart: '2026-05-17',
        periodEnd: '2026-05-17',
      })
    ).rejects.toMatchObject({ message: 'report failed' });
  });
});
