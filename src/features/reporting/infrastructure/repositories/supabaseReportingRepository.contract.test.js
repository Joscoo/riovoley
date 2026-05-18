jest.mock('../../../../config/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

const { supabase } = require('../../../../config/supabase');
const { ReportingError } = require('../../domain/reportingErrors');
const { SupabaseReportingRepository } = require('./supabaseReportingRepository');

describe('SupabaseReportingRepository Edge Function contract', () => {
  const buildRepository = () =>
    new SupabaseReportingRepository({
      fileDownloadGateway: {
        downloadFromSignedUrl: jest.fn(),
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateReport mapea envelope success/code/message/details/data', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        code: 'REPORT_GENERATED',
        message: 'Reporte generado correctamente',
        details: null,
        data: {
          run_id: 'run-1',
          status: 'completed',
          artifact_url: 'https://signed.test/report.pdf',
          cached: false,
        },
      },
      error: null,
    });

    const repository = buildRepository();
    const result = await repository.generateReport({
      reportCode: 'attendance_daily',
      periodStart: '2026-05-18',
      periodEnd: '2026-05-18',
      trigger: 'manual',
      observations: '',
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'generate-report',
      expect.objectContaining({
        body: expect.objectContaining({
          report_code: 'attendance_daily',
          period_start: '2026-05-18',
          period_end: '2026-05-18',
        }),
      }),
    );

    expect(result).toMatchObject({
      success: true,
      code: 'REPORT_GENERATED',
      message: 'Reporte generado correctamente',
      details: null,
      run_id: 'run-1',
      status: 'completed',
      artifact_url: 'https://signed.test/report.pdf',
      cached: false,
    });
  });

  it('generateScheduledReports acepta respuesta parcial y conserva success=false', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        success: false,
        code: 'SCHEDULED_REPORTS_PARTIAL',
        message: 'Reportes programados con errores parciales',
        details: null,
        data: {
          processed: 1,
          failures: 1,
          results: [{ report_code: 'attendance_daily' }],
          errors: [{ report_code: 'attendance_daily', message: 'fail' }],
        },
      },
      error: null,
    });

    const repository = buildRepository();
    const result = await repository.generateScheduledReports({ targetDate: '2026-05-18' });

    expect(result).toMatchObject({
      success: false,
      code: 'SCHEDULED_REPORTS_PARTIAL',
      processed: 1,
      failures: 1,
    });
    expect(Array.isArray(result.results)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('deleteRun lanza ReportingError cuando envelope success=false', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: {
        success: false,
        code: 'REPORT_RUN_DELETE_FAILED',
        message: 'No se pudo eliminar',
        details: null,
        data: null,
      },
      error: null,
    });

    const repository = buildRepository();

    await expect(repository.deleteRun('run-1')).rejects.toBeInstanceOf(ReportingError);
    await expect(repository.deleteRun('run-1')).rejects.toMatchObject({
      code: 'REPOSITORY_ERROR',
      message: 'No se pudo eliminar',
    });
  });
});
