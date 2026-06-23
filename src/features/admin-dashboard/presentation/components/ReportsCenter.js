import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaCalendarAlt,
  FaChartLine,
  FaDownload,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilePdf,
  FaUsers,
  FaTrash,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { adminDashboardService } from '../../adminDashboardService';
import { reportingService } from '../../../reporting';
import { userManagementService } from '../../../user-management';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  ExportButtonGroup,
  Input,
  KpiTile,
  LoadingSpinner,
  SectionHeader,
  Select,
  TabNav,
} from '../../../../shared/ui';
import { cn } from '../../../../lib/cn';

const RUNS_PAGE_SIZE = 8;
const DETAIL_PAGE_SIZE = 8;
const REPORT_TYPE_OPTIONS = [
  { code: 'attendance_daily', label: 'Asistencias diarias' },
  { code: 'financial_monthly_summary', label: 'Resumen financiero' },
  { code: 'student_roster_snapshot', label: 'Padron estudiantil' },
];
const CATEGORY_LABELS = {
  iniciacion_hombres: 'Iniciacion Hombres',
  iniciacion_mujeres: 'Iniciacion Mujeres',
  perfeccionamiento_hombres: 'Perfeccionamiento Hombres',
  perfeccionamiento_mujeres: 'Perfeccionamiento Mujeres',
  master_mujeres: 'Master Mujeres',
};
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

// ── Surface style constants ───────────────────────────────────────────────
const actionGroupClass = 'rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.52),rgba(2,6,23,0.9))] p-4';
const sectionLeadClass = 'mb-4 rounded-2xl border border-rv-gold/15 bg-[linear-gradient(135deg,rgba(249,178,51,0.08),rgba(15,23,42,0.12)_58%,rgba(46,49,146,0.18))] px-4 py-3 text-sm text-slate-200';

const REPORTS_TABS = [
  { id: 'operacion', label: 'Operacion', helper: 'PDF rapido, persistencia y exportes inmediatos', icon: FaDownload, guideId: 'reports-tab-operacion' },
  { id: 'finanzas', label: 'Finanzas', helper: 'Resumen, tendencia, riesgo y cartera vencida', icon: FaChartLine, guideId: 'reports-tab-finanzas' },
  { id: 'padron', label: 'Padron', helper: 'Busqueda y exportacion de estudiantes', icon: FaUsers, guideId: 'reports-tab-padron' },
  { id: 'historial', label: 'Historial', helper: 'Reportes persistidos y trazabilidad', icon: FaCalendarAlt, guideId: 'reports-tab-historial' },
];

// ── Utility helpers ───────────────────────────────────────────────────────
const downloadTextFile = ({ content, fileName, mimeType = 'text/plain;charset=utf-8;' }) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadExcelFile = ({ html, fileName }) => {
  const blob = new Blob([`\ufeff${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const toCsvValue = (value) => {
  const raw = value == null ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
};

const buildCsv = (headers, rows) => [
  headers.map(toCsvValue).join(','),
  ...rows.map((row) => row.map(toCsvValue).join(',')),
].join('\n');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const buildExcelTable = ({ title, headers, rows }) => `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { color: #0f172a; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #e2e8f0; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
  </html>
`;

const paginateItems = (items, page, pageSize = RUNS_PAGE_SIZE) => {
  const safeItems = Array.isArray(items) ? items : [];
  const totalPages = Math.max(1, Math.ceil(safeItems.length / pageSize));
  const safePage = Math.min(Math.max(page || 1, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    items: safeItems.slice(start, start + pageSize),
  };
};

// ── Sub-components ────────────────────────────────────────────────────────
const PanelHeader = ({ title, subtitle, icon, badge }) => (
  <div className="mb-5 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
    <div>
      {badge ? (
        <div className="mb-3 inline-flex w-fit items-center rounded-full border border-rv-gold/20 bg-rv-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rv-gold">
          {badge}
        </div>
      ) : null}
      <h3 className="text-xl font-black text-white">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">{subtitle}</p>
    </div>
    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-3 text-2xl text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      {icon}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────
const ReportsCenter = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [persistentPeriodStart, setPersistentPeriodStart] = useState(today.slice(0, 8) + '01');
  const [persistentPeriodEnd, setPersistentPeriodEnd] = useState(today);
  const [selectedRunReportCode, setSelectedRunReportCode] = useState('attendance_daily');
  const [selectedReportsTab, setSelectedReportsTab] = useState('operacion');
  const [loadingAttendanceReports, setLoadingAttendanceReports] = useState(true);
  const [attendanceRuns, setAttendanceRuns] = useState([]);
  const [runsPage, setRunsPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [trendPage, setTrendPage] = useState(1);
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [generatingAttendance, setGeneratingAttendance] = useState(false);
  const [generatingPersistentReportCode, setGeneratingPersistentReportCode] = useState('');
  const [downloadingRunId, setDownloadingRunId] = useState(null);
  const [deletingRunId, setDeletingRunId] = useState(null);
  const [loadingFinancialData, setLoadingFinancialData] = useState(true);
  const [financialReview, setFinancialReview] = useState({
    summary: {},
    overdueStudents: [],
    monthlyTrend: [],
  });
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentExporting, setStudentExporting] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentFilters, setStudentFilters] = useState({
    search: '',
    categoria: '',
    status: '',
  });

  // ── Data loading ──────────────────────────────────────────────────────
  const loadAttendanceRuns = useCallback(async () => {
    try {
      setLoadingAttendanceReports(true);
      const runs = await reportingService.listRuns({
        reportCode: selectedRunReportCode,
        limit: 80,
      });
      setAttendanceRuns(runs || []);
    } catch (error) {
      console.error('Error cargando reportes de asistencia:', error);
      setAttendanceRuns([]);
    } finally {
      setLoadingAttendanceReports(false);
    }
  }, [selectedRunReportCode]);

  const loadFinancialReview = useCallback(async () => {
    try {
      setLoadingFinancialData(true);
      const review = await adminDashboardService.loadFinancialReview();
      setFinancialReview(review || { summary: {}, overdueStudents: [], monthlyTrend: [] });
    } catch (error) {
      console.error('Error cargando data financiera para reportes:', error);
      setFinancialReview({ summary: {}, overdueStudents: [], monthlyTrend: [] });
    } finally {
      setLoadingFinancialData(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      setLoadingStudents(true);
      const loadedStudents = await userManagementService.listAthletes();
      setStudents(loadedStudents || []);
    } catch (error) {
      console.error('Error cargando estudiantes para reportes:', error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    loadAttendanceRuns();
  }, [loadAttendanceRuns]);

  useEffect(() => {
    loadFinancialReview();
    loadStudents();
  }, [loadFinancialReview, loadStudents]);

  useEffect(() => {
    const handleRefresh = () => {
      loadAttendanceRuns();
      loadFinancialReview();
      loadStudents();
    };

    window.addEventListener('riovoley:dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('riovoley:dashboard-refresh', handleRefresh);
  }, [loadAttendanceRuns, loadFinancialReview, loadStudents]);

  useEffect(() => {
    setRunsPage(1);
  }, [attendanceRuns]);

  // ── Memoized data ─────────────────────────────────────────────────────
  const paginatedRuns = useMemo(
    () => paginateItems(attendanceRuns, runsPage, RUNS_PAGE_SIZE),
    [attendanceRuns, runsPage]
  );

  const studentCategoryOptions = useMemo(
    () => Array.from(new Set((students || []).map((student) => student.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [students]
  );

  const filteredStudents = useMemo(
    () => userManagementService.filterAthletes({
      athletes: students,
      filters: {
        ...studentFilters,
        sortBy: 'apellido',
        sortOrder: 'asc',
      },
    }),
    [studentFilters, students]
  );

  useEffect(() => {
    setStudentPage(1);
  }, [filteredStudents.length]);

  useEffect(() => {
    setTrendPage(1);
  }, [financialReview.monthlyTrend]);

  useEffect(() => {
    setPortfolioPage(1);
  }, [financialReview.overdueStudents]);

  const paginatedStudents = useMemo(
    () => paginateItems(filteredStudents, studentPage, DETAIL_PAGE_SIZE),
    [filteredStudents, studentPage]
  );

  const paginatedTrend = useMemo(
    () => paginateItems(financialReview.monthlyTrend || [], trendPage, DETAIL_PAGE_SIZE),
    [financialReview.monthlyTrend, trendPage]
  );

  const paginatedPortfolio = useMemo(
    () => paginateItems(financialReview.overdueStudents || [], portfolioPage, DETAIL_PAGE_SIZE),
    [financialReview.overdueStudents, portfolioPage]
  );

  const financialSummaryRows = useMemo(() => {
    const summary = financialReview.summary || {};
    return [
      ['Ingreso total del mes', formatCurrency(summary.totalRevenue || 0)],
      ['Ingreso por mensualidades', formatCurrency(summary.monthlyMembershipRevenue || 0)],
      ['Ingreso por pago diario', formatCurrency(summary.dailyAttendanceRevenue || 0)],
      ['Atletas con deuda vencida', summary.overdueStudentsCount || 0],
      ['Mensualidades vencidas acumuladas', summary.overdueMonthlyFeesCount || 0],
      ['Deuda estimada total', formatCurrency(summary.estimatedDebtTotal || 0)],
      ['Cobertura mensual activa', summary.activeMonthlyCoverageCount || 0],
      ['Asistencias del mes', summary.currentMonthAttendancesCount || 0],
      ['Pagos diarios del mes', summary.currentMonthDailyPaymentsCount || 0],
    ];
  }, [financialReview.summary]);

  const financialHealthKpis = useMemo(() => {
    const summary = financialReview.summary || {};
    const totalRevenue = Number(summary.totalRevenue || 0);
    const dailyRevenue = Number(summary.dailyAttendanceRevenue || 0);
    const estimatedDebtTotal = Number(summary.estimatedDebtTotal || 0);
    const monthlyRevenue = Number(summary.monthlyMembershipRevenue || 0);
    const attendances = Number(summary.currentMonthAttendancesCount || 0);

    return {
      debtCoverageRatio: totalRevenue > 0 ? estimatedDebtTotal / totalRevenue : 0,
      dailyRevenueShare: totalRevenue > 0 ? (dailyRevenue / totalRevenue) * 100 : 0,
      averageTicketPerAttendance: attendances > 0 ? totalRevenue / attendances : 0,
      projectedDebtVsMembership: monthlyRevenue > 0 ? (estimatedDebtTotal / monthlyRevenue) * 100 : 0,
    };
  }, [financialReview.summary]);

  const financialCategoryBreakdown = useMemo(() => {
    const rows = financialReview.overdueStudents || [];
    const grouped = rows.reduce((accumulator, row) => {
      const key = row.category || 'sin_categoria';
      const current = accumulator.get(key) || {
        category: key,
        studentsCount: 0,
        overdueMonths: 0,
        estimatedDebt: 0,
        dailyRevenue: 0,
      };

      current.studentsCount += 1;
      current.overdueMonths += Number(row.overdueMonths || 0);
      current.estimatedDebt += Number(row.estimatedDebt || 0);
      current.dailyRevenue += Number(row.currentMonthDailyRevenue || 0);
      accumulator.set(key, current);
      return accumulator;
    }, new Map());

    return Array.from(grouped.values()).sort((left, right) => {
      if (right.estimatedDebt !== left.estimatedDebt) return right.estimatedDebt - left.estimatedDebt;
      return left.category.localeCompare(right.category, 'es');
    });
  }, [financialReview.overdueStudents]);

  const heroStats = useMemo(() => ([
    {
      label: 'Reportes persistidos',
      value: loadingAttendanceReports ? '...' : attendanceRuns.length,
      detail: 'ejecuciones disponibles',
    },
    {
      label: 'Estudiantes listados',
      value: loadingStudents ? '...' : filteredStudents.length,
      detail: 'segun filtros actuales',
    },
    {
      label: 'Deuda consolidada',
      value: loadingFinancialData ? '...' : formatCurrency(financialReview.summary?.estimatedDebtTotal || 0),
      detail: 'cartera vencida actual',
    },
  ]), [
    attendanceRuns.length,
    filteredStudents.length,
    financialReview.summary,
    loadingAttendanceReports,
    loadingFinancialData,
    loadingStudents,
  ]);

  const activeReportsTab = REPORTS_TABS.find((tab) => tab.id === selectedReportsTab) || REPORTS_TABS[0];

  // ── Export handlers ───────────────────────────────────────────────────
  const exportFinancialSummaryCsv = () => {
    const csv = buildCsv(
      ['Indicador', 'Valor'],
      financialSummaryRows
    );

    downloadTextFile({
      content: csv,
      fileName: `reporte_financiero_resumen_${today}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const exportFinancialSummaryExcel = () => {
    downloadExcelFile({
      fileName: `reporte_financiero_resumen_${today}.xls`,
      html: buildExcelTable({
        title: 'Resumen financiero RioVoley',
        headers: ['Indicador', 'Valor'],
        rows: financialSummaryRows,
      }),
    });
  };

  const exportFinancialTrendCsv = () => {
    const rows = (financialReview.monthlyTrend || []).map((row) => ([
      row.label,
      row.monthlyPaymentsTotal || 0,
      row.dailyPaymentsTotal || 0,
      row.combinedTotal || 0,
      row.dailyPaymentsCount || 0,
    ]));

    const csv = buildCsv(
      ['Mes', 'Mensualidades', 'Pago diario', 'Total combinado', 'Asistencias cobradas'],
      rows
    );

    downloadTextFile({
      content: csv,
      fileName: `reporte_financiero_tendencia_${today}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const exportFinancialTrendExcel = () => {
    const rows = (financialReview.monthlyTrend || []).map((row) => ([
      row.label,
      formatCurrency(row.monthlyPaymentsTotal || 0),
      formatCurrency(row.dailyPaymentsTotal || 0),
      formatCurrency(row.combinedTotal || 0),
      row.dailyPaymentsCount || 0,
    ]));

    downloadExcelFile({
      fileName: `reporte_financiero_tendencia_${today}.xls`,
      html: buildExcelTable({
        title: 'Tendencia financiera RioVoley',
        headers: ['Mes', 'Mensualidades', 'Pago diario', 'Total combinado', 'Asistencias cobradas'],
        rows,
      }),
    });
  };

  const exportOverduePortfolioCsv = () => {
    const rows = (financialReview.overdueStudents || []).map((row) => ([
      row.athleteName,
      row.studentId,
      row.category || '',
      row.lastPaymentDate || '',
      row.coverageEnd || '',
      row.overdueMonths || 0,
      row.estimatedDebt || 0,
      row.currentMonthAttendances || 0,
      row.currentMonthDailyPayments || 0,
      row.currentMonthDailyRevenue || 0,
    ]));

    const csv = buildCsv(
      ['Atleta', 'Student ID', 'Categoria', 'Ultimo pago', 'Cobertura fin', 'Meses vencidos', 'Deuda estimada', 'Asistencias mes', 'Pagos diarios', 'Ingreso diario'],
      rows
    );

    downloadTextFile({
      content: csv,
      fileName: `reporte_financiero_cartera_${today}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const exportOverduePortfolioExcel = () => {
    const rows = (financialReview.overdueStudents || []).map((row) => ([
      row.athleteName,
      row.studentId,
      CATEGORY_LABELS[row.category] || row.category || '',
      row.lastPaymentDate || '',
      row.coverageEnd || '',
      row.overdueMonths || 0,
      formatCurrency(row.estimatedDebt || 0),
      row.currentMonthAttendances || 0,
      row.currentMonthDailyPayments || 0,
      formatCurrency(row.currentMonthDailyRevenue || 0),
    ]));

    downloadExcelFile({
      fileName: `reporte_financiero_cartera_${today}.xls`,
      html: buildExcelTable({
        title: 'Cartera vencida RioVoley',
        headers: ['Atleta', 'Student ID', 'Categoria', 'Ultimo pago', 'Cobertura fin', 'Meses vencidos', 'Deuda estimada', 'Asistencias mes', 'Pagos diarios', 'Ingreso diario'],
        rows,
      }),
    });
  };

  const exportFinancialSummaryPdf = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Reporte Financiero - RioVoley', 14, 16);
    doc.setFontSize(10);
    doc.text(`Fecha de emision: ${today}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Indicador', 'Valor']],
      body: financialSummaryRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Mes', 'Mensualidades', 'Pago diario', 'Total combinado']],
      body: (financialReview.monthlyTrend || []).map((row) => ([
        row.label,
        formatCurrency(row.monthlyPaymentsTotal || 0),
        formatCurrency(row.dailyPaymentsTotal || 0),
        formatCurrency(row.combinedTotal || 0),
      ])),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 118, 110] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Atleta', 'Categoria', 'Cobertura fin', 'Meses vencidos', 'Deuda estimada']],
      body: (financialReview.overdueStudents || []).slice(0, 20).map((row) => ([
        row.athleteName,
        CATEGORY_LABELS[row.category] || row.category || '',
        row.coverageEnd || '',
        row.overdueMonths || 0,
        formatCurrency(row.estimatedDebt || 0),
      ])),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [190, 24, 93] },
    });

    doc.save(`reporte_financiero_${today}.pdf`);
  };

  const printFinancialSummary = () => {
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=720');
    if (!reportWindow) return;

    const trendRows = (financialReview.monthlyTrend || [])
      .map((row) => `
        <tr>
          <td>${row.label}</td>
          <td>${formatCurrency(row.monthlyPaymentsTotal || 0)}</td>
          <td>${formatCurrency(row.dailyPaymentsTotal || 0)}</td>
          <td>${formatCurrency(row.combinedTotal || 0)}</td>
        </tr>
      `)
      .join('');

    const overdueRows = (financialReview.overdueStudents || [])
      .slice(0, 12)
      .map((row) => `
        <tr>
          <td>${row.athleteName}</td>
          <td>${row.category || ''}</td>
          <td>${row.coverageEnd || ''}</td>
          <td>${row.overdueMonths || 0}</td>
          <td>${formatCurrency(row.estimatedDebt || 0)}</td>
        </tr>
      `)
      .join('');

    reportWindow.document.write(`
      <html>
        <head>
          <title>Reporte Financiero RioVoley</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1, h2 { margin-bottom: 8px; }
            p { margin: 0 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 24px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #e2e8f0; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            .label { font-size: 12px; color: #475569; text-transform: uppercase; }
            .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>Reporte Financiero RioVoley</h1>
          <p>Fecha de emision: ${today}</p>
          <div class="grid">
            ${financialSummaryRows.map(([label, value]) => `
              <div class="card">
                <div class="label">${label}</div>
                <div class="value">${value}</div>
              </div>
            `).join('')}
          </div>
          <h2>Tendencia financiera</h2>
          <table>
            <thead>
              <tr><th>Mes</th><th>Mensualidades</th><th>Pago diario</th><th>Total</th></tr>
            </thead>
            <tbody>${trendRows}</tbody>
          </table>
          <h2>Cartera vencida principal</h2>
          <table>
            <thead>
              <tr><th>Atleta</th><th>Categoria</th><th>Cobertura fin</th><th>Meses vencidos</th><th>Deuda estimada</th></tr>
            </thead>
            <tbody>${overdueRows}</tbody>
          </table>
        </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const buildStudentRows = () => filteredStudents.map((student) => ([
    student.id,
    student.full_name || `${student.nombre || ''} ${student.apellido || ''}`.trim(),
    student.nombre || '',
    student.apellido || '',
    student.email || '',
    student.telefono || '',
    CATEGORY_LABELS[student.categoria] || student.categoria || '',
    student.fecha_nacimiento || '',
    student.fecha_ingreso || '',
    student.suspended ? 'Suspendido' : 'Activo',
  ]));

  const exportStudentsCsv = async () => {
    try {
      setStudentExporting(true);
      const csv = buildCsv(
        ['Student ID', 'Nombre completo', 'Nombre', 'Apellido', 'Email', 'Telefono', 'Categoria', 'Fecha nacimiento', 'Fecha ingreso', 'Estado'],
        buildStudentRows()
      );

      downloadTextFile({
        content: csv,
        fileName: `estudiantes_riovoley_${today}.csv`,
        mimeType: 'text/csv;charset=utf-8;',
      });
    } finally {
      setStudentExporting(false);
    }
  };

  const exportStudentsExcel = async () => {
    try {
      setStudentExporting(true);
      downloadExcelFile({
        fileName: `estudiantes_riovoley_${today}.xls`,
        html: buildExcelTable({
          title: 'Estudiantes RioVoley',
          headers: ['Student ID', 'Nombre completo', 'Nombre', 'Apellido', 'Email', 'Telefono', 'Categoria', 'Fecha nacimiento', 'Fecha ingreso', 'Estado'],
          rows: buildStudentRows(),
        }),
      });
    } finally {
      setStudentExporting(false);
    }
  };

  const exportStudentsPdf = async () => {
    try {
      setStudentExporting(true);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(16);
      doc.text('Listado de Estudiantes - RioVoley', 14, 16);
      doc.setFontSize(10);
      doc.text(`Fecha de emision: ${today}`, 14, 22);
      doc.text(`Total exportado: ${filteredStudents.length}`, 14, 28);

      autoTable(doc, {
        startY: 34,
        head: [['Nombre completo', 'Email', 'Telefono', 'Categoria', 'Ingreso', 'Estado']],
        body: filteredStudents.map((student) => ([
          student.full_name || `${student.nombre || ''} ${student.apellido || ''}`.trim(),
          student.email || '',
          student.telefono || '',
          CATEGORY_LABELS[student.categoria] || student.categoria || '',
          student.fecha_ingreso || '',
          student.suspended ? 'Suspendido' : 'Activo',
        ])),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] },
      });

      doc.save(`estudiantes_riovoley_${today}.pdf`);
    } finally {
      setStudentExporting(false);
    }
  };

  // ── Report actions ────────────────────────────────────────────────────
  const handleGenerateAttendanceReport = async () => {
    try {
      setGeneratingAttendance(true);
      const report = await reportingService.ensureDailyAttendanceReport({
        date: attendanceDate,
        observations: `Reporte solicitado desde modulo de reportes para ${attendanceDate}`,
      });

      await reportingService.downloadFromSignedUrl(report.signedUrl, report.fileName);
      await loadAttendanceRuns();
    } catch (error) {
      console.error('Error generando reporte de asistencia:', error);
    } finally {
      setGeneratingAttendance(false);
    }
  };

  const handleDownloadRun = async (run) => {
    try {
      setDownloadingRunId(run.id);
      const signedUrl = await reportingService.getDownloadUrlByRunId(run.id);
      if (!signedUrl) return;
      await reportingService.downloadFromSignedUrl(
        signedUrl,
        `${run.report_code || 'reporte'}-${run.period_start || run.created_at?.slice(0, 10) || run.id}.pdf`
      );
    } catch (error) {
      console.error('Error descargando reporte persistido:', error);
    } finally {
      setDownloadingRunId(null);
    }
  };

  const handleDeleteRun = async (runId) => {
    try {
      setDeletingRunId(runId);
      await reportingService.deleteRun(runId);
      await loadAttendanceRuns();
    } catch (error) {
      console.error('Error eliminando reporte persistido:', error);
    } finally {
      setDeletingRunId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <SectionHeader
        title="Modulo de Reportes"
        subtitle="Centro unico para reportes de asistencias, reportes financieros y exportes administrativos."
        icon={<FaFileAlt />}
      />

      {/* ── Hero Card ───────────────────────────────────────────────────── */}
      <Card>
        <div className="grid gap-5 desktop:grid-cols-[1.15fr_0.85fr] desktop:items-end">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-100">
              <FaFileAlt className="text-sky-300" />
              Centro operativo
            </div>
            <div>
              <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white mobile:text-4xl">
                Genera, exporta y audita reportes desde una sola vista con prioridad clara.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 mobile:text-base">
                La pantalla separa tres frentes: documentos inmediatos, exportes administrativos y trazabilidad de reportes ya persistidos para no mezclar acciones de trabajo con analisis.
              </p>
            </div>
            <div className="grid gap-3 mobile:grid-cols-3">
              {heroStats.map((item) => (
                <KpiTile
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  accent="slate"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className={actionGroupClass}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">Generacion inmediata</p>
              <p className="mt-2 text-2xl font-black text-white">Asistencia diaria</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Produce el PDF del dia o reutiliza el artefacto persistido para bajar tiempos de operacion.</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Flujo corto: fecha, generar y descargar.</p>
            </div>
            <div className={actionGroupClass}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200">Control y exportes</p>
              <p className="mt-2 text-2xl font-black text-white">Finanzas + padron</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Mantiene juntos los entregables mas usados por administracion sin sacrificar lectura ejecutiva.</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Lectura, exporte y trazabilidad en la misma linea visual.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <TabNav
        items={REPORTS_TABS}
        activeId={selectedReportsTab}
        onChange={setSelectedReportsTab}
      />

      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-4 py-3 text-sm text-slate-200">
        <span className="font-black text-white">{activeReportsTab.label}</span>
        <span className="ml-2">{activeReportsTab.helper}.</span>
      </div>

      {/* ── Tab: Operacion ──────────────────────────────────────────────── */}
      {selectedReportsTab === 'operacion' ? (
      <div className="grid gap-4 desktop:grid-cols-2">
        <Card>
          <PanelHeader
            title="Reporte PDF de Asistencia"
            subtitle="Genera o reutiliza el PDF persistido de asistencia diaria."
            icon={<FaFilePdf className="text-rv-gold" />}
            badge="Accion rapida"
          />
          <div className={sectionLeadClass}>
            Ideal para operacion diaria. Esta accion debe sentirse inmediata y quedar separada de los reportes historicos.
          </div>
          <div className="grid gap-3 mobile:grid-cols-[1fr_auto]">
            <input
              type="date"
              value={attendanceDate}
              onChange={(event) => setAttendanceDate(event.target.value)}
              className="min-h-[48px] rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            />
            <Button variant="primary" className="min-h-[48px]" onClick={handleGenerateAttendanceReport} disabled={generatingAttendance}>
              <FaDownload className="mr-2" />
              {generatingAttendance ? 'Generando...' : 'Descargar PDF'}
            </Button>
          </div>
        </Card>

        <Card>
          <PanelHeader
            title="Reportes Persistidos del Sistema"
            subtitle="Genera snapshots PDF persistidos de asistencia, finanzas y padron de estudiantes."
            icon={<FaFilePdf className="text-sky-300" />}
            badge="Persistencia"
          />
          <div className={sectionLeadClass}>
            Usa este bloque cuando necesitas dejar evidencia trazable y no solo descargar un documento puntual.
          </div>
          <div className="mb-3 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
            <input
              type="date"
              value={persistentPeriodStart}
              onChange={(event) => setPersistentPeriodStart(event.target.value)}
              className="min-h-[48px] rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            />
            <input
              type="date"
              value={persistentPeriodEnd}
              onChange={(event) => setPersistentPeriodEnd(event.target.value)}
              className="min-h-[48px] rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-rv-gold/70"
            />
            <Select
              value={selectedRunReportCode}
              onChange={(event) => setSelectedRunReportCode(event.target.value)}
              className="min-h-[48px] border-white/15 bg-black/35 text-white"
            >
              {REPORT_TYPE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-2 mobile:grid-cols-3">
            {REPORT_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.code}
                variant="secondary"
                className="justify-start"
                disabled={!persistentPeriodStart || !persistentPeriodEnd || generatingPersistentReportCode === option.code}
                onClick={async () => {
                  try {
                    setGeneratingPersistentReportCode(option.code);
                    const response = await reportingService.generateReport({
                      reportCode: option.code,
                      periodStart: persistentPeriodStart,
                      periodEnd: persistentPeriodEnd,
                      trigger: 'manual',
                      observations: `Reporte generado desde el modulo de reportes (${option.label})`,
                    });

                    if (response?.artifact_url) {
                      await reportingService.downloadFromSignedUrl(
                        response.artifact_url,
                        `${option.code}_${persistentPeriodStart}_${persistentPeriodEnd}.pdf`,
                      );
                    }

                    await loadAttendanceRuns();
                  } catch (error) {
                    console.error(`Error generando reporte persistido ${option.code}:`, error);
                  } finally {
                    setGeneratingPersistentReportCode('');
                  }
                }}
              >
                <FaFilePdf className="mr-2" />
                {generatingPersistentReportCode === option.code ? 'Generando...' : option.label}
              </Button>
            ))}
          </div>
        </Card>

      </div>
      ) : null}

      {/* ── Tab: Padron ─────────────────────────────────────────────────── */}
      {selectedReportsTab === 'padron' ? (
      <Card>
        <PanelHeader
          title="Exportacion de Estudiantes"
          subtitle="Descarga listados de estudiantes para necesidades administrativas y academicas de la escuela."
          icon={<FaUsers className="text-violet-300" />}
          badge="Padron"
        />

        <div className="mb-4 grid gap-3 mobile:grid-cols-2 desktop:grid-cols-[1.4fr_1fr_1fr]">
          <Input
            value={studentFilters.search}
            onChange={(event) => setStudentFilters((current) => ({ ...current, search: event.target.value }))}
            className="min-h-[48px] border-white/15 bg-black/35 text-white placeholder:text-slate-500"
            placeholder="Buscar por nombre, email o categoria..."
          />
          <Select
            value={studentFilters.categoria}
            onChange={(event) => setStudentFilters((current) => ({ ...current, categoria: event.target.value }))}
            className="min-h-[48px] border-white/15 bg-black/35 text-white"
          >
            <option value="">Todas las categorias</option>
            {studentCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category] || category}
              </option>
            ))}
          </Select>
          <Select
            value={studentFilters.status}
            onChange={(event) => setStudentFilters((current) => ({ ...current, status: event.target.value }))}
            className="min-h-[48px] border-white/15 bg-black/35 text-white"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
          </Select>
        </div>

        <div className="mb-4 grid gap-3 mobile:grid-cols-3">
          <KpiTile label="Total estudiantes" value={loadingStudents ? '...' : students.length} accent="slate" />
          <KpiTile label="Filtrados" value={loadingStudents ? '...' : filteredStudents.length} accent="slate" />
          <KpiTile label="Categorias activas" value={studentCategoryOptions.length} accent="slate" />
        </div>

        {loadingStudents ? (
          <LoadingSpinner message="Cargando estudiantes..." />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={<FaUsers />}
            title="Sin estudiantes para exportar"
            description="Ajusta los filtros o registra estudiantes para generar los listados."
          />
        ) : (
          <>
            <ExportButtonGroup
              columns={3}
              disabled={studentExporting}
              items={[
                { label: 'Estudiantes PDF', format: 'pdf', onClick: exportStudentsPdf },
                { label: 'Estudiantes CSV', format: 'csv', onClick: exportStudentsCsv },
                { label: 'Estudiantes Excel', format: 'excel', onClick: exportStudentsExcel },
              ]}
            />

            <div className="mt-4">
              <DataTable
                columns={[
                  { key: 'nombre', label: 'Nombre' },
                  { key: 'email', label: 'Email' },
                  { key: 'telefono', label: 'Telefono' },
                  { key: 'categoria', label: 'Categoria' },
                  { key: 'ingreso', label: 'Ingreso' },
                  { key: 'estado', label: 'Estado' },
                ]}
                rows={paginatedStudents.items}
                keyExtractor={(student) => student.id}
                renderRow={(student) => (
                  <>
                    <td className="px-4 py-4 font-semibold">{student.full_name || `${student.nombre || ''} ${student.apellido || ''}`.trim()}</td>
                    <td className="px-4 py-4 text-slate-300">{student.email || '--'}</td>
                    <td className="px-4 py-4 text-slate-300">{student.telefono || '--'}</td>
                    <td className="px-4 py-4 text-slate-300">{CATEGORY_LABELS[student.categoria] || student.categoria || '--'}</td>
                    <td className="px-4 py-4 text-slate-300">{student.fecha_ingreso || '--'}</td>
                    <td className="px-4 py-4 text-slate-200">{student.suspended ? 'Suspendido' : 'Activo'}</td>
                  </>
                )}
                minWidth="920px"
                page={paginatedStudents.page}
                totalPages={paginatedStudents.totalPages}
                onPageChange={setStudentPage}
              />
            </div>
          </>
        )}
      </Card>
      ) : null}

      {/* ── Tab: Historial ──────────────────────────────────────────────── */}
      {selectedReportsTab === 'historial' ? (
      <div className="grid gap-4">
        <Card>
          <PanelHeader
            title="Historial de Reportes Persistidos"
            subtitle="Consulta, descarga o elimina PDFs persistidos del tipo seleccionado."
            icon={<FaCalendarAlt className="text-emerald-300" />}
            badge="Trazabilidad"
          />

          <div className={sectionLeadClass}>
            El historial debe responder dos preguntas rapido: que se genero y que todavia sirve descargar o limpiar.
          </div>

          <div className="mb-4">
            <Select
              value={selectedRunReportCode}
              onChange={(event) => setSelectedRunReportCode(event.target.value)}
              className="min-h-[48px] max-w-sm border-white/15 bg-black/35 text-white"
            >
              {REPORT_TYPE_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>{option.label}</option>
              ))}
            </Select>
          </div>

          {loadingAttendanceReports ? (
            <LoadingSpinner message="Cargando historial..." />
          ) : attendanceRuns.length === 0 ? (
            <EmptyState
              icon={<FaFilePdf />}
              title="Sin reportes persistidos"
              description="Cuando generes reportes del tipo seleccionado, apareceran aqui."
            />
          ) : (
            <DataTable
              columns={[
                { key: 'periodo', label: 'Periodo' },
                { key: 'estado', label: 'Estado' },
                { key: 'trigger', label: 'Trigger' },
                { key: 'creado', label: 'Creado' },
                { key: 'acciones', label: 'Acciones' },
              ]}
              rows={paginatedRuns.items}
              keyExtractor={(run) => run.id}
              renderRow={(run) => (
                <>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-white">{run.period_start || '--'} {run.period_end && run.period_end !== run.period_start ? `a ${run.period_end}` : ''}</p>
                      <p className="mt-1 text-xs text-slate-400">{run.report_code}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase',
                      run.status === 'completed'
                        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
                        : run.status === 'failed'
                          ? 'border-red-400/25 bg-red-400/10 text-red-200'
                          : 'border-sky-400/25 bg-sky-400/10 text-sky-200'
                    )}>
                      {run.status || '--'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{run.trigger || '--'}</td>
                  <td className="px-4 py-4 text-slate-300">{run.created_at ? new Date(run.created_at).toLocaleString('es-EC') : '--'}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownloadRun(run)}
                        disabled={downloadingRunId === run.id}
                      >
                        <FaDownload className="mr-1" /> {downloadingRunId === run.id ? 'Descargando...' : 'Descargar'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteRun(run.id)}
                        disabled={deletingRunId === run.id}
                        className="hover:border-red-400/30 hover:text-red-200"
                      >
                        <FaTrash className="mr-1" /> {deletingRunId === run.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </td>
                </>
              )}
              minWidth="880px"
              page={paginatedRuns.page}
              totalPages={paginatedRuns.totalPages}
              onPageChange={setRunsPage}
            />
          )}
        </Card>
      </div>
      ) : null}

      {/* ── Tab: Finanzas ───────────────────────────────────────────────── */}
      {selectedReportsTab === 'finanzas' ? (
      <>
      <div className="grid gap-4 desktop:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <PanelHeader
            title="Resumen Financiero Disponible"
            subtitle="Vista de control rapido sobre lo que ya puedes exportar."
            icon={<FaChartLine className="text-violet-300" />}
            badge="Snapshot"
          />
          {loadingFinancialData ? (
            <LoadingSpinner message="Cargando resumen financiero..." />
          ) : (
            <div className="space-y-4">
              <div className={sectionLeadClass}>
                Aqui se concentra la lectura ejecutiva. Primero mira deuda, peso del pago diario y ticket promedio; luego baja al inventario completo de indicadores.
              </div>
              <div className="grid gap-3 mobile:grid-cols-2">
                <KpiTile
                  label="Deuda / ingreso del mes"
                  value={`${financialHealthKpis.debtCoverageRatio.toFixed(2)}x`}
                  accent="rose"
                />
                <KpiTile
                  label="Peso del pago diario"
                  value={`${financialHealthKpis.dailyRevenueShare.toFixed(1)}%`}
                  accent="emerald"
                />
                <KpiTile
                  label="Ticket por asistencia"
                  value={formatCurrency(financialHealthKpis.averageTicketPerAttendance)}
                  accent="cyan"
                />
                <KpiTile
                  label="Deuda vs mensualidades"
                  value={`${financialHealthKpis.projectedDebtVsMembership.toFixed(1)}%`}
                  accent="amber"
                />
              </div>
              <div className="grid gap-3 mobile:grid-cols-2">
                {financialSummaryRows.map(([label, value]) => (
                  <KpiTile key={label} label={label} value={value} accent="slate" />
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <PanelHeader
            title="Riesgo por Categoria"
            subtitle="Concentracion de deuda vencida para detectar donde intervenir primero."
            icon={<FaExclamationTriangle className="text-rose-300" />}
            badge="Prioridad"
          />
          <div className={sectionLeadClass}>
            El foco aqui no es listar todo, sino dejar evidente donde se concentra la deuda y que categorias requieren atencion primero.
          </div>

          {loadingFinancialData ? (
            <LoadingSpinner message="Cargando concentracion de riesgo..." />
          ) : financialCategoryBreakdown.length === 0 ? (
            <EmptyState
              icon={<FaExclamationTriangle />}
              title="Sin riesgo acumulado"
              description="No hay cartera vencida agrupable por categoria."
            />
          ) : (
            <div className="space-y-3">
              {financialCategoryBreakdown.map((row) => (
                <div key={row.category} className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-3 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{CATEGORY_LABELS[row.category] || row.category.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-xs text-slate-400">{row.studentsCount} atletas | {row.overdueMonths} meses vencidos acumulados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-rose-300">{formatCurrency(row.estimatedDebt)}</p>
                      <p className="mt-1 text-xs text-emerald-300">Pago diario mes: {formatCurrency(row.dailyRevenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 desktop:grid-cols-[1.05fr_0.95fr]" data-guide-id="reports-financial-exports">
        <Card>
          <PanelHeader
            title="Tendencia Financiera Tabular"
            subtitle="Revision paginada del comportamiento mensual para exportes y contraste rapido."
            icon={<FaCalendarAlt className="text-cyan-300" />}
            badge="Analisis"
          />
          <div className={sectionLeadClass}>
            Esta tabla sirve para comparacion mes a mes. El total combinado debe leerse primero, luego el detalle por fuente.
          </div>

          {loadingFinancialData ? (
            <LoadingSpinner message="Cargando tendencia..." />
          ) : (
            <DataTable
              columns={[
                { key: 'mes', label: 'Mes' },
                { key: 'mensualidades', label: 'Mensualidades' },
                { key: 'diario', label: 'Pago diario' },
                { key: 'total', label: 'Total combinado' },
                { key: 'asistencias', label: 'Asistencias cobradas' },
              ]}
              rows={paginatedTrend.items}
              keyExtractor={(row) => row.key || row.label}
              renderRow={(row) => (
                <>
                  <td className="px-4 py-4 font-semibold">{row.label}</td>
                  <td className="px-4 py-4 text-slate-300">{formatCurrency(row.monthlyPaymentsTotal || 0)}</td>
                  <td className="px-4 py-4 text-slate-300">{formatCurrency(row.dailyPaymentsTotal || 0)}</td>
                  <td className="px-4 py-4 font-semibold text-cyan-300">{formatCurrency(row.combinedTotal || 0)}</td>
                  <td className="px-4 py-4 text-slate-200">{row.dailyPaymentsCount || 0}</td>
                </>
              )}
              emptyIcon={<FaCalendarAlt />}
              emptyTitle="Sin tendencia disponible"
              emptyDescription="Aun no hay meses con movimientos financieros para mostrar."
              minWidth="760px"
              page={paginatedTrend.page}
              totalPages={paginatedTrend.totalPages}
              onPageChange={setTrendPage}
            />
          )}
        </Card>

        <Card>
          <PanelHeader
            title="Exportes Financieros"
            subtitle="Descargas en PDF, CSV y Excel desde la revision financiera consolidada."
            icon={<FaChartLine className="text-cyan-300" />}
            badge="Finanzas"
          />
          <div className={sectionLeadClass}>
            Los formatos estan agrupados por decision operativa: resumen, tendencia y cartera vencida.
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Resumen financiero</p>
              <ExportButtonGroup
                columns={3}
                disabled={loadingFinancialData}
                items={[
                  { label: 'Resumen PDF', format: 'pdf', onClick: exportFinancialSummaryPdf },
                  { label: 'Resumen CSV', format: 'csv', onClick: exportFinancialSummaryCsv },
                  { label: 'Resumen Excel', format: 'excel', onClick: exportFinancialSummaryExcel },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Tendencia mensual</p>
              <ExportButtonGroup
                columns={2}
                disabled={loadingFinancialData}
                items={[
                  { label: 'Tendencia CSV', format: 'csv', onClick: exportFinancialTrendCsv },
                  { label: 'Tendencia Excel', format: 'excel', onClick: exportFinancialTrendExcel },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cartera vencida</p>
              <ExportButtonGroup
                columns={2}
                disabled={loadingFinancialData}
                items={[
                  { label: 'Cartera CSV', format: 'csv', onClick: exportOverduePortfolioCsv },
                  { label: 'Cartera Excel', format: 'excel', onClick: exportOverduePortfolioExcel },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Impresion</p>
              <ExportButtonGroup
                columns={1}
                disabled={loadingFinancialData}
                items={[
                  { label: 'Version imprimible', format: 'print', onClick: printFinancialSummary },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <PanelHeader
          title="Cartera Vencida para Revision"
          subtitle="Vista paginada de los casos con deuda para revision administrativa directa."
          icon={<FaChartLine className="text-amber-300" />}
          badge="Seguimiento"
        />
        <div className={sectionLeadClass}>
          Esta vista debe servir como cola de trabajo. La deuda y la cobertura fin tienen prioridad visual sobre el resto.
        </div>

        {loadingFinancialData ? (
          <LoadingSpinner message="Cargando cartera vencida..." />
        ) : (
          <DataTable
            columns={[
              { key: 'atleta', label: 'Atleta' },
              { key: 'categoria', label: 'Categoria' },
              { key: 'cobertura', label: 'Cobertura fin' },
              { key: 'meses', label: 'Meses vencidos' },
              { key: 'deuda', label: 'Deuda estimada' },
              { key: 'asistencias', label: 'Asistencias mes' },
              { key: 'pagodiario', label: 'Pago diario mes' },
            ]}
            rows={paginatedPortfolio.items}
            keyExtractor={(row) => row.studentId}
            renderRow={(row) => (
              <>
                <td className="px-4 py-4">
                  <p className="font-semibold">{row.athleteName}</p>
                  <p className="mt-1 text-xs text-slate-400">ID: {row.studentId}</p>
                </td>
                <td className="px-4 py-4 text-slate-300">{CATEGORY_LABELS[row.category] || row.category || '--'}</td>
                <td className="px-4 py-4 text-slate-300">{row.coverageEnd || '--'}</td>
                <td className="px-4 py-4 text-slate-200">{row.overdueMonths || 0}</td>
                <td className="px-4 py-4 font-semibold text-rose-300">{formatCurrency(row.estimatedDebt || 0)}</td>
                <td className="px-4 py-4 text-slate-200">{row.currentMonthAttendances || 0}</td>
                <td className="px-4 py-4 font-semibold text-emerald-300">{formatCurrency(row.currentMonthDailyRevenue || 0)}</td>
              </>
            )}
            emptyIcon={<FaChartLine />}
            emptyTitle="Sin cartera vencida"
            emptyDescription="Actualmente no hay atletas con mensualidades vencidas en la revision consolidada."
            minWidth="980px"
            page={paginatedPortfolio.page}
            totalPages={paginatedPortfolio.totalPages}
            onPageChange={setPortfolioPage}
          />
        )}
      </Card>
      </>
      ) : null}
    </div>
  );
};

export default ReportsCenter;
