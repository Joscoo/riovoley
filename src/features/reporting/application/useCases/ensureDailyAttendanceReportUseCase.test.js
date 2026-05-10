import { createEnsureDailyAttendanceReportUseCase } from './ensureDailyAttendanceReportUseCase';

describe('ensureDailyAttendanceReportUseCase', () => {
  it('retorna signedUrl y fileName cuando el reporte se genera', async () => {
    const repository = {
      listRuns: jest.fn(),
      generateScheduledReports: jest.fn(),
      downloadFromSignedUrl: jest.fn(),
      deleteRun: jest.fn(),
      generateReport: jest.fn().mockResolvedValue({
        run_id: 'run-1',
        artifact_url: 'https://signed-url/report.pdf',
      }),
      getDownloadUrlByRunId: jest.fn(),
    };

    const useCase = createEnsureDailyAttendanceReportUseCase(repository);
    const result = await useCase.execute({ date: '2026-05-01', observations: 'ok' });

    expect(result.ok).toBe(true);
    expect(result.data.run_id).toBe('run-1');
    expect(result.data.signedUrl).toBe('https://signed-url/report.pdf');
    expect(result.data.fileName).toBe('reporte-asistencia-2026-05-01.pdf');
  });

  it('falla cuando date no viene informado', async () => {
    const repository = {
      listRuns: jest.fn(),
      generateScheduledReports: jest.fn(),
      downloadFromSignedUrl: jest.fn(),
      deleteRun: jest.fn(),
      generateReport: jest.fn(),
      getDownloadUrlByRunId: jest.fn(),
    };

    const useCase = createEnsureDailyAttendanceReportUseCase(repository);
    const result = await useCase.execute({ date: '' });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('INVALID_ARGUMENT');
  });
});
