import { supabase } from '../../../../config/supabase';
import { repositoryError } from '../../domain/reportingErrors';
import { REPORT_BUCKET } from '../../domain/reportingPolicies';

const normalizeErrorMessage = (error, fallback) => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
};

const getArtifactsByRunIds = async (runIds) => {
  if (!Array.isArray(runIds) || runIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('report_artifacts')
    .select('run_id, format, storage_bucket, storage_path, file_size, checksum, created_at')
    .in('run_id', runIds)
    .eq('format', 'pdf');

  if (error) {
    throw repositoryError(normalizeErrorMessage(error, 'No se pudieron consultar artefactos de reportes'), error);
  }

  return data || [];
};

const createSignedUrl = async (bucket, path) => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);

  if (error) {
    throw repositoryError(normalizeErrorMessage(error, 'No se pudo crear URL firmada para descargar reporte'), error);
  }

  return data?.signedUrl || null;
};

export class SupabaseReportingRepository {
  constructor({ fileDownloadGateway }) {
    this.fileDownloadGateway = fileDownloadGateway;
  }

  async listRuns({ reportCode, dateFrom, dateTo, status, limit }) {
    let query = supabase
      .from('report_runs')
      .select('id, report_code, period_start, period_end, trigger, status, summary_json, error_message, created_at, finished_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reportCode) query = query.eq('report_code', reportCode);
    if (dateFrom) query = query.gte('period_start', dateFrom);
    if (dateTo) query = query.lte('period_end', dateTo);
    if (status) query = query.eq('status', status);

    const { data: runs, error } = await query;
    if (error) {
      throw repositoryError(normalizeErrorMessage(error, 'No se pudieron consultar ejecuciones de reportes'), error);
    }

    const runList = runs || [];
    const artifacts = await getArtifactsByRunIds(runList.map((run) => run.id));
    const artifactByRunId = new Map(artifacts.map((artifact) => [artifact.run_id, artifact]));

    return runList.map((run) => ({
      ...run,
      artifact: artifactByRunId.get(run.id) || null,
    }));
  }

  async generateReport({ reportCode, periodStart, periodEnd, trigger, observations }) {
    const { data, error } = await supabase.functions.invoke('generate-report', {
      body: {
        report_code: reportCode,
        period_start: periodStart,
        period_end: periodEnd,
        trigger,
        observations,
      },
    });

    if (error) {
      throw repositoryError(normalizeErrorMessage(error, 'No se pudo generar el reporte'), error);
    }

    if (!data?.success) {
      throw repositoryError(data?.message || 'No se pudo generar el reporte', data);
    }

    return data;
  }

  async generateScheduledReports({ targetDate } = {}) {
    const { data, error } = await supabase.functions.invoke('generate-scheduled-reports', {
      body: {
        target_date: targetDate,
      },
    });

    if (error) {
      throw repositoryError(normalizeErrorMessage(error, 'No se pudieron generar reportes programados'), error);
    }

    if (!data?.success && data?.code !== 'SCHEDULED_REPORTS_PARTIAL') {
      throw repositoryError(data?.message || 'No se pudieron generar reportes programados', data);
    }

    return data;
  }

  async getDownloadUrlByRunId(runId) {
    const { data: artifact, error } = await supabase
      .from('report_artifacts')
      .select('storage_bucket, storage_path')
      .eq('run_id', runId)
      .eq('format', 'pdf')
      .maybeSingle();

    if (error) {
      throw repositoryError(normalizeErrorMessage(error, 'No se pudo consultar el artefacto del reporte'), error);
    }

    if (!artifact?.storage_path) return null;
    return createSignedUrl(artifact.storage_bucket || REPORT_BUCKET, artifact.storage_path);
  }

  async downloadFromSignedUrl(signedUrl, fileName) {
    return this.fileDownloadGateway.downloadFromSignedUrl(signedUrl, fileName);
  }

  async deleteRun(runId) {
    const { data, error } = await supabase.functions.invoke('delete-report-run', {
      body: { run_id: runId },
    });

    if (error) {
      throw repositoryError(normalizeErrorMessage(error, 'No se pudo eliminar el reporte persistido'), error);
    }

    if (!data?.success) {
      throw repositoryError(data?.message || 'No se pudo eliminar el reporte persistido', data);
    }

    return data;
  }
}
