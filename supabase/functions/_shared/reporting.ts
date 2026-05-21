import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const CATEGORY_LABELS: Record<string, string> = {
  iniciacion_hombres: 'Iniciacion Hombres',
  iniciacion_mujeres: 'Iniciacion Mujeres',
  perfeccionamiento_hombres: 'Perfeccionamiento Hombres',
  perfeccionamiento_mujeres: 'Perfeccionamiento Mujeres',
  master_mujeres: 'Master Mujeres',
};

const ALLOWED_ROLES = new Set(['admin', 'administrador', 'entrenador']);

export type TriggerType = 'manual' | 'scheduled';

export interface GenerateReportInput {
  reportCode: string;
  periodStart: string;
  periodEnd: string;
  triggerType: TriggerType;
  requestedBy?: string | null;
  observations?: string;
}

interface AttendanceRow {
  attendance_id: string;
  date: string;
  student_id: string;
  student_name: string;
  category: string;
  category_label: string;
  payment_method_id: number | null;
  payment_method_name: string;
  monthly_payment_status: 'activa' | 'vencida' | 'sin_registrar';
  monthly_payment_label: string;
  schedule_id: string | null;
}

interface Snapshot {
  meta: {
    report_code: string;
    source_kind: string;
    period_start: string;
    period_end: string;
    timezone: string;
    version: number;
    generated_at: string;
  };
  rows: AttendanceRow[];
  totals: Record<string, number>;
  filters_applied: Record<string, unknown>;
}

interface BuildSnapshotResult {
  snapshot: Snapshot;
  summary: Record<string, unknown>;
}

interface PaymentRow {
  student_id: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

const MONTHLY_STATUS_LABELS: Record<AttendanceRow['monthly_payment_status'], string> = {
  activa: 'Mensualidad Activa',
  vencida: 'Mensualidad Vencida',
  sin_registrar: 'Mensualidad Sin Registrar',
};

const resolveMonthlyStatusForDate = (payments: PaymentRow[], targetDate: string): AttendanceRow['monthly_payment_status'] => {
  if (!payments || payments.length === 0) {
    return 'sin_registrar';
  }

  const hasActive = payments.some((payment) => {
    if (!payment.fecha_inicio) return false;
    if (payment.fecha_inicio > targetDate) return false;
    if (!payment.fecha_fin) return true;
    return payment.fecha_fin >= targetDate;
  });

  if (hasActive) {
    return 'activa';
  }

  const hasExpiredPayment = payments.some((payment) => (
    Boolean(payment.fecha_fin) && payment.fecha_fin! < targetDate
  ));

  if (hasExpiredPayment) {
    return 'vencida';
  }

  return 'sin_registrar';
};

const createServiceClient = () => createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const createAuthClient = (authorization: string) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      Authorization: authorization,
    },
  },
});

export const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVALID_UUID_TOKENS = new Set(['undefined', 'null', 'nan']);

const normalizeUuidOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (INVALID_UUID_TOKENS.has(trimmed.toLowerCase())) return null;
  return UUID_V4_REGEX.test(trimmed) ? trimmed : null;
};

export const addDays = (dateStr: string, days: number) => {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const getDateInTimezone = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new HttpError(500, 'TIMEZONE_PARSE_FAILED', `No se pudo obtener fecha para zona horaria ${timezone}`);
  }

  return `${year}-${month}-${day}`;
};

export const getUserRoleFromToken = async (authorization: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authorization Bearer requerido');
  }

  if (!SUPABASE_ANON_KEY) {
    throw new HttpError(500, 'MISSING_ANON_KEY', 'SUPABASE_ANON_KEY no configurado en Edge Function');
  }

  const authClient = createAuthClient(authorization);
  const serviceClient = createServiceClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new HttpError(401, 'AUTH_INVALID', 'Sesion invalida o expirada', userError);
  }

  const { data: dbUser, error: dbUserError } = await serviceClient
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (dbUserError) {
    throw new HttpError(500, 'ROLE_QUERY_FAILED', 'No se pudo verificar el rol del usuario', dbUserError);
  }

  if (!dbUser || !ALLOWED_ROLES.has(String(dbUser.role || '').toLowerCase())) {
    throw new HttpError(403, 'ROLE_NOT_ALLOWED', 'No tienes permisos para generar o consultar reportes');
  }

  const normalizedUserId = normalizeUuidOrNull(dbUser.id);
  if (!normalizedUserId) {
    throw new HttpError(500, 'ACTOR_USER_ID_INVALID', 'No se pudo validar el identificador del usuario autenticado');
  }

  return {
    userId: normalizedUserId,
    role: String(dbUser.role || '').toLowerCase(),
  };
};

const buildAttendanceSnapshot = async (
  serviceClient: ReturnType<typeof createServiceClient>,
  reportCode: string,
  sourceKind: string,
  periodStart: string,
  periodEnd: string,
  timezone: string,
  observations?: string,
): Promise<BuildSnapshotResult> => {
  const { data: attendanceRows, error: attendanceError } = await serviceClient
    .from('attendances')
    .select('id, student_id, fecha, metodo_pago_id, schedule_id')
    .gte('fecha', periodStart)
    .lte('fecha', periodEnd)
    .order('fecha', { ascending: true });

  if (attendanceError) {
    throw new HttpError(500, 'ATTENDANCE_QUERY_FAILED', 'No se pudo consultar asistencias', attendanceError);
  }

  const studentIds = [...new Set(
    (attendanceRows || [])
      .map((row) => normalizeUuidOrNull(row.student_id))
      .filter((value): value is string => Boolean(value)),
  )];
  const paymentTypeIds = [...new Set(
    (attendanceRows || [])
      .map((row) => Number(row.metodo_pago_id))
      .filter((value) => Number.isInteger(value) && value > 0),
  )];

  const studentsById = new Map<string, { categoria: string | null; nombre: string; apellido: string }>();
  if (studentIds.length > 0) {
    const { data: studentsRows, error: studentsError } = await serviceClient
      .from('students')
      .select('id, categoria, users(nombre, apellido)')
      .in('id', studentIds);

    if (studentsError) {
      throw new HttpError(500, 'STUDENTS_QUERY_FAILED', 'No se pudo consultar estudiantes', studentsError);
    }

    for (const row of studentsRows || []) {
      const firstName = row?.users?.nombre || '';
      const lastName = row?.users?.apellido || '';
      studentsById.set(row.id, {
        categoria: row.categoria || null,
        nombre: firstName,
        apellido: lastName,
      });
    }
  }

  const paymentById = new Map<number, string>();
  if (paymentTypeIds.length > 0) {
    const { data: paymentTypesRows, error: paymentTypesError } = await serviceClient
      .from('payment_types')
      .select('id, nombre')
      .in('id', paymentTypeIds);

    if (paymentTypesError) {
      throw new HttpError(500, 'PAYMENT_TYPES_QUERY_FAILED', 'No se pudo consultar metodos de pago', paymentTypesError);
    }

    for (const row of paymentTypesRows || []) {
      paymentById.set(row.id, row.nombre || 'N/A');
    }
  }

  const paymentsByStudent = new Map<string, PaymentRow[]>();
  if (studentIds.length > 0) {
    const { data: paymentsRows, error: paymentsError } = await serviceClient
      .from('payments')
      .select('student_id, fecha_inicio, fecha_fin')
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .order('fecha_inicio', { ascending: false });

    if (paymentsError) {
      throw new HttpError(500, 'PAYMENTS_QUERY_FAILED', 'No se pudo consultar mensualidades', paymentsError);
    }

    for (const row of paymentsRows || []) {
      const currentRows = paymentsByStudent.get(row.student_id) || [];
      currentRows.push({
        student_id: row.student_id,
        fecha_inicio: row.fecha_inicio || null,
        fecha_fin: row.fecha_fin || null,
      });
      paymentsByStudent.set(row.student_id, currentRows);
    }
  }

  const rows: AttendanceRow[] = (attendanceRows || [])
    .map((row) => {
    const normalizedStudentId = normalizeUuidOrNull(row.student_id);
    if (!normalizedStudentId) return null;

    const student = studentsById.get(normalizedStudentId) || {
      categoria: null,
      nombre: '',
      apellido: '',
    };

    const fullName = `${student.nombre} ${student.apellido}`.trim() || 'Sin nombre';
    const category = student.categoria || 'sin_categoria';
    const paymentMethodId = Number(row.metodo_pago_id);
    const paymentNameRaw = Number.isInteger(paymentMethodId) && paymentMethodId > 0
      ? paymentById.get(paymentMethodId)
      : null;
    const monthlyStatus = resolveMonthlyStatusForDate(
      paymentsByStudent.get(normalizedStudentId) || [],
      row.fecha,
    );

    return {
      attendance_id: row.id,
      date: row.fecha,
      student_id: normalizedStudentId,
      student_name: fullName,
      category,
      category_label: CATEGORY_LABELS[category] || category.replaceAll('_', ' '),
      payment_method_id: Number.isInteger(paymentMethodId) && paymentMethodId > 0 ? paymentMethodId : null,
      payment_method_name: paymentNameRaw ? paymentNameRaw.replaceAll('_', ' ') : 'N/A',
      monthly_payment_status: monthlyStatus,
      monthly_payment_label: MONTHLY_STATUS_LABELS[monthlyStatus],
      schedule_id: row.schedule_id || null,
    };
  })
    .filter((row): row is AttendanceRow => Boolean(row));

  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.student_name.localeCompare(b.student_name);
  });

  const totals = {
    total: rows.length,
    iniciacion: rows.filter((item) => item.category === 'iniciacion_hombres' || item.category === 'iniciacion_mujeres').length,
    perfeccionamiento_hombres: rows.filter((item) => item.category === 'perfeccionamiento_hombres').length,
    perfeccionamiento_mujeres: rows.filter((item) => item.category === 'perfeccionamiento_mujeres' || item.category === 'master_mujeres').length,
  };

  const snapshot: Snapshot = {
    meta: {
      report_code: reportCode,
      source_kind: sourceKind,
      period_start: periodStart,
      period_end: periodEnd,
      timezone,
      version: 1,
      generated_at: new Date().toISOString(),
    },
    rows,
    totals,
    filters_applied: {
      period_start: periodStart,
      period_end: periodEnd,
      observations: observations || null,
    },
  };

  return {
    snapshot,
    summary: {
      report_code: reportCode,
      period_start: periodStart,
      period_end: periodEnd,
      total_rows: rows.length,
      totals,
    },
  };
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN_X = 34;
const PAGE_MIN_Y = 48;
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN_X * 2);

const COLORS = {
  navy: rgb(0.07, 0.19, 0.44),
  blue: rgb(0.12, 0.35, 0.73),
  lightBlue: rgb(0.93, 0.96, 1),
  gold: rgb(0.98, 0.75, 0.18),
  grayBorder: rgb(0.86, 0.89, 0.93),
  grayText: rgb(0.32, 0.35, 0.4),
  rowAlt: rgb(0.98, 0.99, 1),
  white: rgb(1, 1, 1),
};

const formatDateLabel = (isoDate: string) => {
  if (!isoDate || !isoDate.includes('-')) return isoDate;
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const splitTextByWidth = (
  text: string,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size: number,
  maxWidth: number,
) => {
  const safeText = String(text || '').trim();
  if (!safeText) return ['-'];

  const words = safeText.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) lines.push(current.trim());
    current = '';
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) pushCurrent();

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      continue;
    }

    let segment = '';
    for (const char of word) {
      const test = `${segment}${char}`;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        segment = test;
      } else {
        if (segment) lines.push(segment);
        segment = char;
      }
    }
    if (segment) current = segment;
  }

  pushCurrent();
  return lines.length > 0 ? lines : ['-'];
};

const renderAttendancePdf = async (snapshot: Snapshot, observations?: string) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSizeBody = 9;
  const lineHeight = 10;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let isFirstPage = true;
  let y = PAGE_HEIGHT - 120;

  const drawHeader = () => {
    if (isFirstPage) {
      page.drawRectangle({
        x: 0,
        y: PAGE_HEIGHT - 112,
        width: PAGE_WIDTH,
        height: 112,
        color: COLORS.navy,
      });

      page.drawText('RIOVOLEY - REPORTE DE ASISTENCIAS', {
        x: PAGE_MARGIN_X,
        y: PAGE_HEIGHT - 56,
        size: 18,
        font: fontBold,
        color: COLORS.white,
      });

      page.drawText(`Periodo: ${formatDateLabel(snapshot.meta.period_start)} al ${formatDateLabel(snapshot.meta.period_end)}`, {
        x: PAGE_MARGIN_X,
        y: PAGE_HEIGHT - 78,
        size: 10,
        font,
        color: COLORS.white,
      });

      page.drawText(`Generado: ${snapshot.meta.generated_at}`, {
        x: PAGE_MARGIN_X,
        y: PAGE_HEIGHT - 94,
        size: 9,
        font,
        color: COLORS.white,
      });

      y = PAGE_HEIGHT - 132;
      isFirstPage = false;
      return;
    }

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 52,
      width: PAGE_WIDTH,
      height: 52,
      color: COLORS.lightBlue,
    });

    page.drawText('RIOVOLEY - REPORTE DE ASISTENCIAS (CONTINUACION)', {
      x: PAGE_MARGIN_X,
      y: PAGE_HEIGHT - 30,
      size: 11,
      font: fontBold,
      color: COLORS.navy,
    });

    y = PAGE_HEIGHT - 72;
  };

  const ensureSpace = (requiredHeight: number) => {
    if (y - requiredHeight >= PAGE_MIN_Y) return;
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader();
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(28);
    page.drawRectangle({
      x: PAGE_MARGIN_X,
      y: y - 20,
      width: CONTENT_WIDTH,
      height: 20,
      color: COLORS.blue,
    });
    page.drawText(title, {
      x: PAGE_MARGIN_X + 8,
      y: y - 14,
      size: 10,
      font: fontBold,
      color: COLORS.white,
    });
    y -= 24;
  };

  const drawSummaryCards = () => {
    const cards = [
      { label: 'Total Asistencias', value: String(snapshot.totals.total ?? 0) },
      { label: 'Iniciacion', value: String(snapshot.totals.iniciacion ?? 0) },
      { label: 'Perf. Hombres', value: String(snapshot.totals.perfeccionamiento_hombres ?? 0) },
      { label: 'Perf. Mujeres', value: String(snapshot.totals.perfeccionamiento_mujeres ?? 0) },
    ];

    const gap = 10;
    const cardWidth = (CONTENT_WIDTH - gap) / 2;
    const cardHeight = 48;

    ensureSpace((cardHeight * 2) + gap + 12);

    let cardY = y;
    for (let rowIndex = 0; rowIndex < 2; rowIndex += 1) {
      for (let colIndex = 0; colIndex < 2; colIndex += 1) {
        const cardIndex = rowIndex * 2 + colIndex;
        const card = cards[cardIndex];
        const cardX = PAGE_MARGIN_X + ((cardWidth + gap) * colIndex);

        page.drawRectangle({
          x: cardX,
          y: cardY - cardHeight,
          width: cardWidth,
          height: cardHeight,
          color: COLORS.white,
          borderColor: COLORS.grayBorder,
          borderWidth: 1,
        });

        page.drawRectangle({
          x: cardX,
          y: cardY - 8,
          width: cardWidth,
          height: 8,
          color: COLORS.gold,
        });

        page.drawText(card.label, {
          x: cardX + 10,
          y: cardY - 24,
          size: 9,
          font,
          color: COLORS.grayText,
        });
        page.drawText(card.value, {
          x: cardX + 10,
          y: cardY - 40,
          size: 16,
          font: fontBold,
          color: COLORS.navy,
        });
      }
      cardY -= cardHeight + gap;
    }

    y = cardY - 6;
  };

  const drawTable = (
    headers: string[],
    colWidths: number[],
    rawRows: string[][],
    emptyLabel: string,
  ) => {
    const emptyRow = Array.from({ length: headers.length }, (_, index) => (index === 0 ? emptyLabel : ''));
    const tableRows = rawRows.length > 0 ? rawRows : [emptyRow];
    const headerHeight = 20;
    const rowPaddingY = 4;

    const drawHeaderRow = () => {
      ensureSpace(headerHeight + 2);
      page.drawRectangle({
        x: PAGE_MARGIN_X,
        y: y - headerHeight,
        width: CONTENT_WIDTH,
        height: headerHeight,
        color: COLORS.lightBlue,
        borderColor: COLORS.grayBorder,
        borderWidth: 1,
      });

      let x = PAGE_MARGIN_X;
      for (let i = 0; i < headers.length; i += 1) {
        const textY = y - 14;
        page.drawText(headers[i], {
          x: x + 6,
          y: textY,
          size: 8,
          font: fontBold,
          color: COLORS.navy,
        });

        if (i < headers.length - 1) {
          page.drawRectangle({
            x: x + colWidths[i],
            y: y - headerHeight,
            width: 1,
            height: headerHeight,
            color: COLORS.grayBorder,
          });
        }
        x += colWidths[i];
      }

      y -= headerHeight;
    };

    drawHeaderRow();

    for (let rowIndex = 0; rowIndex < tableRows.length; rowIndex += 1) {
      const row = tableRows[rowIndex];

      const wrappedByCell = row.map((cell, cellIndex) => (
        splitTextByWidth(cell, font, fontSizeBody, Math.max(20, colWidths[cellIndex] - 12))
      ));
      const maxLines = Math.max(...wrappedByCell.map((lines) => lines.length));
      const rowHeight = (maxLines * lineHeight) + (rowPaddingY * 2);

      if (y - rowHeight < PAGE_MIN_Y) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        drawHeader();
        drawHeaderRow();
      }

      page.drawRectangle({
        x: PAGE_MARGIN_X,
        y: y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: rowIndex % 2 === 0 ? COLORS.white : COLORS.rowAlt,
        borderColor: COLORS.grayBorder,
        borderWidth: 1,
      });

      let x = PAGE_MARGIN_X;
      for (let cellIndex = 0; cellIndex < row.length; cellIndex += 1) {
        const lines = wrappedByCell[cellIndex];
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
          page.drawText(lines[lineIndex], {
            x: x + 6,
            y: y - rowPaddingY - 8 - (lineIndex * lineHeight),
            size: fontSizeBody,
            font,
            color: rgb(0.1, 0.1, 0.12),
          });
        }

        if (cellIndex < row.length - 1) {
          page.drawRectangle({
            x: x + colWidths[cellIndex],
            y: y - rowHeight,
            width: 1,
            height: rowHeight,
            color: COLORS.grayBorder,
          });
        }
        x += colWidths[cellIndex];
      }

      y -= rowHeight;
    }
    y -= 8;
  };

  const drawObservationsSection = (rawObservations: string) => {
    const normalizedText = rawObservations
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    if (!normalizedText) return;

    const boxPaddingX = 10;
    const boxPaddingY = 10;
    const lineSpacing = 12;
    const textSize = 9;
    const textWidth = CONTENT_WIDTH - (boxPaddingX * 2);
    const boxHeaderHeight = 18;
    const observationRows: Array<{ text: string; offsetX: number; isBlank: boolean }> = [];
    const sourceLines = normalizedText.split('\n');
    let previousWasBlank = false;

    for (let sourceIndex = 0; sourceIndex < sourceLines.length; sourceIndex += 1) {
      const line = sourceLines[sourceIndex];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (previousWasBlank) continue;
        observationRows.push({ text: '', offsetX: 0, isBlank: true });
        previousWasBlank = true;
        continue;
      }

      previousWasBlank = false;

      const bulletMatch = trimmedLine.match(/^([-*])\s+(.+)$/);
      const numberedMatch = trimmedLine.match(/^(\d+[.)])\s+(.+)$/);

      let prefix = '';
      let content = trimmedLine;

      if (bulletMatch) {
        prefix = '- ';
        content = bulletMatch[2];
      } else if (numberedMatch) {
        prefix = `${numberedMatch[1]} `;
        content = numberedMatch[2];
      }

      const prefixWidth = prefix ? font.widthOfTextAtSize(prefix, textSize) : 0;
      const wrappedLines = splitTextByWidth(content, font, textSize, Math.max(24, textWidth - prefixWidth));

      for (let index = 0; index < wrappedLines.length; index += 1) {
        const wrappedLine = wrappedLines[index];
        if (index === 0) {
          observationRows.push({
            text: `${prefix}${wrappedLine}`,
            offsetX: 0,
            isBlank: false,
          });
        } else {
          observationRows.push({
            text: wrappedLine,
            offsetX: prefixWidth,
            isBlank: false,
          });
        }
      }
    }

    if (observationRows.length === 0) observationRows.push({ text: '-', offsetX: 0, isBlank: false });

    let cursor = 0;
    let isContinuation = false;

    while (cursor < observationRows.length) {
      ensureSpace(72);

      const availableHeight = y - PAGE_MIN_Y;
      const usableHeight = Math.max(0, availableHeight - boxHeaderHeight - (boxPaddingY * 2));
      const maxLinesPerChunk = Math.max(1, Math.floor(usableHeight / lineSpacing));
      const chunk = observationRows.slice(cursor, cursor + maxLinesPerChunk);
      const boxHeight = boxHeaderHeight + (boxPaddingY * 2) + (chunk.length * lineSpacing);

      page.drawRectangle({
        x: PAGE_MARGIN_X,
        y: y - boxHeight,
        width: CONTENT_WIDTH,
        height: boxHeight,
        color: COLORS.white,
        borderColor: COLORS.grayBorder,
        borderWidth: 1,
      });

      page.drawRectangle({
        x: PAGE_MARGIN_X,
        y: y - boxHeaderHeight,
        width: CONTENT_WIDTH,
        height: boxHeaderHeight,
        color: COLORS.lightBlue,
      });

      const sectionLabel = isContinuation ? 'Notas registradas (continuacion)' : 'Notas registradas';
      page.drawText(sectionLabel, {
        x: PAGE_MARGIN_X + boxPaddingX,
        y: y - 12,
        size: 8.5,
        font: fontBold,
        color: COLORS.navy,
      });

      for (let index = 0; index < chunk.length; index += 1) {
        const row = chunk[index];
        if (row.isBlank) continue;
        page.drawText(row.text, {
          x: PAGE_MARGIN_X + boxPaddingX + row.offsetX,
          y: y - boxHeaderHeight - boxPaddingY - 8 - (index * lineSpacing),
          size: textSize,
          font,
          color: rgb(0.12, 0.14, 0.18),
        });
      }

      y -= boxHeight + 8;
      cursor += chunk.length;
      isContinuation = true;
    }
  };

  drawHeader();
  drawSummaryCards();

  const iniciacionRows = snapshot.rows.filter((item) => (
    item.category === 'iniciacion_hombres' || item.category === 'iniciacion_mujeres'
  ));
  const perfHombresRows = snapshot.rows.filter((item) => item.category === 'perfeccionamiento_hombres');
  const perfMujeresRows = snapshot.rows.filter((item) => (
    item.category === 'perfeccionamiento_mujeres' || item.category === 'master_mujeres'
  ));

  const toTableRows = (rows: AttendanceRow[]) => rows.map((row, index) => ([
      String(index + 1),
      row.student_name,
      row.payment_method_name || 'N/A',
      row.monthly_payment_label,
    ]));

  drawSectionTitle('1. INICIACION');
  drawTable(
    ['#', 'Atleta', 'Metodo de Pago', 'Estado Mensualidad'],
    [32, 255, 120, 120],
    toTableRows(iniciacionRows),
    'Sin asistencias',
  );

  drawSectionTitle('2. PERFECCIONAMIENTO - HOMBRES');
  drawTable(
    ['#', 'Atleta', 'Metodo de Pago', 'Estado Mensualidad'],
    [32, 255, 120, 120],
    toTableRows(perfHombresRows),
    'Sin asistencias',
  );

  drawSectionTitle('3. PERFECCIONAMIENTO - MUJERES');
  drawTable(
    ['#', 'Atleta', 'Metodo de Pago', 'Estado Mensualidad'],
    [32, 255, 120, 120],
    toTableRows(perfMujeresRows),
    'Sin asistencias',
  );

  if (observations?.trim()) {
    drawSectionTitle('OBSERVACIONES');
    drawObservationsSection(observations);
  }

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  pages.forEach((pdfPage, pageIndex) => {
    pdfPage.drawText(`Pagina ${pageIndex + 1} de ${totalPages}`, {
      x: PAGE_WIDTH - 110,
      y: 22,
      size: 8,
      font,
      color: COLORS.grayText,
    });
  });

  return await pdfDoc.save();
};

const computeSha256Hex = async (bytes: Uint8Array) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const buildStoragePath = (reportCode: string, periodStart: string, periodEnd: string, runId: string) => {
  const year = periodStart.slice(0, 4);
  const month = periodStart.slice(5, 7);
  return `reports/${reportCode}/${year}/${month}/${reportCode}_${periodStart}_${periodEnd}_${runId}.pdf`;
};

const fetchDefinition = async (serviceClient: ReturnType<typeof createServiceClient>, reportCode: string) => {
  const { data, error } = await serviceClient
    .from('report_definitions')
    .select('code, name, description, renderer, source_kind, schedule_time, timezone, is_active')
    .eq('code', reportCode)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'REPORT_DEFINITION_QUERY_FAILED', 'No se pudo consultar la definicion del reporte', error);
  }

  if (!data) {
    throw new HttpError(404, 'REPORT_DEFINITION_NOT_FOUND', `No existe una definicion activa para ${reportCode}`);
  }

  if (!data.is_active) {
    throw new HttpError(409, 'REPORT_DEFINITION_INACTIVE', `La definicion ${reportCode} esta inactiva`);
  }

  return data;
};

const getExistingRun = async (
  serviceClient: ReturnType<typeof createServiceClient>,
  reportCode: string,
  periodStart: string,
  periodEnd: string,
  triggerType: TriggerType,
) => {
  const { data, error } = await serviceClient
    .from('report_runs')
    .select('id, status, created_at, finished_at')
    .eq('report_code', reportCode)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('trigger', triggerType)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, 'REPORT_RUN_QUERY_FAILED', 'No se pudo consultar ejecuciones previas', error);
  }

  return data;
};

const getArtifactUrl = async (
  serviceClient: ReturnType<typeof createServiceClient>,
  runId: string,
): Promise<string | null> => {
  const { data: artifact, error: artifactError } = await serviceClient
    .from('report_artifacts')
    .select('storage_bucket, storage_path')
    .eq('run_id', runId)
    .eq('format', 'pdf')
    .maybeSingle();

  if (artifactError || !artifact) {
    return null;
  }

  const { data: signedUrlData, error: signedUrlError } = await serviceClient
    .storage
    .from(artifact.storage_bucket)
    .createSignedUrl(artifact.storage_path, 60 * 60);

  if (signedUrlError) {
    return null;
  }

  return signedUrlData?.signedUrl || null;
};

const ensurePendingRun = async (
  serviceClient: ReturnType<typeof createServiceClient>,
  input: GenerateReportInput,
) => {
  const existing = await getExistingRun(serviceClient, input.reportCode, input.periodStart, input.periodEnd, input.triggerType);

  if (existing) {
    return {
      runId: existing.id as string,
      existingStatus: existing.status as string,
      wasExisting: true,
    };
  }

  const normalizedRequestedBy = normalizeUuidOrNull(input.requestedBy);

  const { data: inserted, error: insertError } = await serviceClient
    .from('report_runs')
    .insert({
      report_code: input.reportCode,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      trigger: input.triggerType,
      status: 'pending',
      requested_by: normalizedRequestedBy,
    })
    .select('id, status')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      const current = await getExistingRun(serviceClient, input.reportCode, input.periodStart, input.periodEnd, input.triggerType);
      if (current) {
        return {
          runId: current.id as string,
          existingStatus: current.status as string,
          wasExisting: true,
        };
      }
    }
    throw new HttpError(500, 'REPORT_RUN_INSERT_FAILED', 'No se pudo crear la ejecucion de reporte', insertError);
  }

  return {
    runId: inserted.id as string,
    existingStatus: inserted.status as string,
    wasExisting: false,
  };
};

export const generateReportRun = async (input: GenerateReportInput) => {
  if (!input.reportCode) {
    throw new HttpError(400, 'MISSING_REPORT_CODE', 'report_code es obligatorio');
  }

  if (!isIsoDate(input.periodStart) || !isIsoDate(input.periodEnd)) {
    throw new HttpError(400, 'INVALID_PERIOD', 'period_start y period_end deben tener formato YYYY-MM-DD');
  }

  if (input.periodStart > input.periodEnd) {
    throw new HttpError(400, 'INVALID_PERIOD_RANGE', 'period_end no puede ser menor que period_start');
  }

  if (input.triggerType !== 'manual' && input.triggerType !== 'scheduled') {
    throw new HttpError(400, 'INVALID_TRIGGER', 'trigger debe ser manual o scheduled');
  }

  const serviceClient = createServiceClient();
  const definition = await fetchDefinition(serviceClient, input.reportCode);

  const { runId, existingStatus, wasExisting } = await ensurePendingRun(serviceClient, input);

  if (wasExisting && existingStatus === 'ready') {
    const artifactUrl = await getArtifactUrl(serviceClient, runId);
    return {
      run_id: runId,
      status: 'ready',
      artifact_url: artifactUrl,
      cached: true,
    };
  }

  if (wasExisting && existingStatus === 'running') {
    return {
      run_id: runId,
      status: 'running',
      artifact_url: null,
      cached: true,
    };
  }

  await serviceClient
    .from('report_runs')
    .update({ status: 'running', error_message: null })
    .eq('id', runId);

  try {
    if (definition.source_kind !== 'attendances_daily') {
      throw new HttpError(400, 'SOURCE_KIND_NOT_IMPLEMENTED', `source_kind no soportado en V1: ${definition.source_kind}`);
    }

    const { snapshot, summary } = await buildAttendanceSnapshot(
      serviceClient,
      definition.code,
      definition.source_kind,
      input.periodStart,
      input.periodEnd,
      definition.timezone || 'America/Guayaquil',
      input.observations,
    );

    const pdfBytes = await renderAttendancePdf(snapshot, input.observations);
    const checksum = await computeSha256Hex(pdfBytes);
    const storagePath = buildStoragePath(input.reportCode, input.periodStart, input.periodEnd, runId);

    const { error: uploadError } = await serviceClient.storage
      .from('reports')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new HttpError(500, 'REPORT_UPLOAD_FAILED', 'No se pudo subir el PDF del reporte', uploadError);
    }

    const { error: artifactError } = await serviceClient
      .from('report_artifacts')
      .upsert(
        {
          run_id: runId,
          format: 'pdf',
          storage_bucket: 'reports',
          storage_path: storagePath,
          file_size: pdfBytes.byteLength,
          checksum,
        },
        {
          onConflict: 'run_id,format',
          ignoreDuplicates: false,
        },
      );

    if (artifactError) {
      throw new HttpError(500, 'REPORT_ARTIFACT_INSERT_FAILED', 'No se pudo registrar el artefacto del reporte', artifactError);
    }

    const { error: readyError } = await serviceClient
      .from('report_runs')
      .update({
        status: 'ready',
        snapshot_json: snapshot,
        summary_json: summary,
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (readyError) {
      throw new HttpError(500, 'REPORT_RUN_FINALIZE_FAILED', 'No se pudo actualizar el estado final del reporte', readyError);
    }

    const artifactUrl = await getArtifactUrl(serviceClient, runId);

    return {
      run_id: runId,
      status: 'ready',
      artifact_url: artifactUrl,
      cached: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';

    await serviceClient
      .from('report_runs')
      .update({
        status: 'failed',
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId);

    throw error;
  }
};

export const deleteReportRun = async (runId: string) => {
  if (!runId || !UUID_V4_REGEX.test(runId)) {
    throw new HttpError(400, 'INVALID_RUN_ID', 'run_id debe ser un UUID valido');
  }

  const serviceClient = createServiceClient();

  const { data: run, error: runError } = await serviceClient
    .from('report_runs')
    .select('id, report_code, period_start, period_end, status')
    .eq('id', runId)
    .maybeSingle();

  if (runError) {
    throw new HttpError(500, 'REPORT_RUN_QUERY_FAILED', 'No se pudo consultar el reporte a eliminar', runError);
  }

  if (!run) {
    throw new HttpError(404, 'REPORT_RUN_NOT_FOUND', 'No existe el reporte persistido solicitado');
  }

  const { data: artifacts, error: artifactsError } = await serviceClient
    .from('report_artifacts')
    .select('storage_bucket, storage_path, format')
    .eq('run_id', runId);

  if (artifactsError) {
    throw new HttpError(500, 'REPORT_ARTIFACT_QUERY_FAILED', 'No se pudo consultar artefactos del reporte', artifactsError);
  }

  let storageObjectsDeleted = 0;
  for (const artifact of artifacts || []) {
    if (!artifact?.storage_bucket || !artifact?.storage_path) {
      continue;
    }

    const { error: storageError } = await serviceClient.storage
      .from(artifact.storage_bucket)
      .remove([artifact.storage_path]);

    if (storageError) {
      throw new HttpError(
        500,
        'REPORT_STORAGE_DELETE_FAILED',
        'No se pudo eliminar el archivo del reporte en storage',
        storageError,
      );
    }

    storageObjectsDeleted += 1;
  }

  const { error: deleteRunError } = await serviceClient
    .from('report_runs')
    .delete()
    .eq('id', runId);

  if (deleteRunError) {
    throw new HttpError(500, 'REPORT_RUN_DELETE_FAILED', 'No se pudo eliminar el reporte persistido', deleteRunError);
  }

  return {
    run_id: runId,
    report_code: run.report_code,
    period_start: run.period_start,
    period_end: run.period_end,
    status: run.status,
    artifacts_found: (artifacts || []).length,
    storage_objects_deleted: storageObjectsDeleted,
  };
};

export const listSchedulableDefinitions = async () => {
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from('report_definitions')
    .select('code, timezone, schedule_time, is_active')
    .eq('is_active', true)
    .not('schedule_time', 'is', null);

  if (error) {
    throw new HttpError(500, 'REPORT_DEFINITIONS_LIST_FAILED', 'No se pudo listar definiciones programables', error);
  }

  return data || [];
};

export const resolveSchedulePeriodDate = (timezone: string, targetDate?: string) => {
  if (targetDate) {
    if (!isIsoDate(targetDate)) {
      throw new HttpError(400, 'INVALID_TARGET_DATE', 'target_date debe tener formato YYYY-MM-DD');
    }
    return targetDate;
  }

  const nowTzDate = getDateInTimezone(new Date(), timezone || 'America/Guayaquil');
  return addDays(nowTzDate, -1);
};
