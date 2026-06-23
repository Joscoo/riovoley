import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FaCalendarAlt,
  FaChartLine,
  FaDollarSign,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaFilter,
  FaSearch,
  FaUserClock,
  FaUsers,
} from 'react-icons/fa';
import { adminDashboardService } from '../../adminDashboardService';
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  KpiTile,
  LoadingSpinner,
  SectionHeader,
  Select,
  SortableHeader,
} from '../../../../shared/ui';
import { SORT_DIRECTION } from '../../../../shared/lib/tableQuery';

const TABLE_PAGE_SIZE = 8;
const CHART_COLORS = {
  total: '#facc15',
  membership: '#38bdf8',
  daily: '#34d399',
  debt: '#fb7185',
  attendance: '#a78bfa',
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('es-EC', {
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));
const formatNumber = (value) => compactNumberFormatter.format(Number(value || 0));



const DEFAULT_FILTERS = {
  search: '',
  category: 'all',
  debtLevel: 'all',
};

const DEFAULT_SORT = {
  field: 'estimatedDebt',
  direction: SORT_DIRECTION.DESC,
};

// ── Sub-components ────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/95 px-4 py-3 text-xs text-slate-100 shadow-2xl backdrop-blur-md">
      {label ? <p className="mb-2 text-sm font-black text-white">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <p key={`${entry.name}-${entry.dataKey}`} style={{ color: entry.color || entry.fill }}>
            <span className="font-semibold">{entry.name}:</span>{' '}
            {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <Card className={className}>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-black text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </Card>
);

const paginateItems = (items, page, pageSize = TABLE_PAGE_SIZE) => {
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

const normalizeText = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const resolveDebtLevel = (row) => {
  const overdueMonths = Number(row?.overdueMonths || 0);
  const estimatedDebt = Number(row?.estimatedDebt || 0);

  if (overdueMonths >= 3 || estimatedDebt >= 100) return 'critica';
  if (overdueMonths >= 2 || estimatedDebt >= 60) return 'alta';
  return 'moderada';
};

const resolveNextSort = ({ currentSort, field }) => {
  if (currentSort.field !== field) {
    return { field, direction: SORT_DIRECTION.DESC };
  }

  if (currentSort.direction === SORT_DIRECTION.DESC) {
    return { field, direction: SORT_DIRECTION.ASC };
  }

  return { field, direction: SORT_DIRECTION.DESC };
};

// ── Main component ────────────────────────────────────────────────────────
const FinancialReview = () => {
  const [loading, setLoading] = useState(true);
  const [tablePage, setTablePage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [data, setData] = useState({
    summary: {
      monthlyMembershipRevenue: 0,
      dailyAttendanceRevenue: 0,
      totalRevenue: 0,
      overdueStudentsCount: 0,
      overdueMonthlyFeesCount: 0,
      estimatedDebtTotal: 0,
      currentMonthAttendancesCount: 0,
      currentMonthDailyPaymentsCount: 0,
      currentMonthStudentsWithAttendance: 0,
      activeMonthlyCoverageCount: 0,
    },
    overdueStudents: [],
    monthlyTrend: [],
  });

  const loadFinancialReview = async () => {
    try {
      setLoading(true);
      const result = await adminDashboardService.loadFinancialReview();
      setData(result || {
        summary: {},
        overdueStudents: [],
        monthlyTrend: [],
      });
    } catch (error) {
      console.error('Error cargando revision financiera:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialReview();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      loadFinancialReview();
    };

    window.addEventListener('riovoley:dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('riovoley:dashboard-refresh', handleRefresh);
  }, []);

  useEffect(() => {
    setTablePage(1);
  }, [data.overdueStudents, filters, sort]);

  const { summary, overdueStudents, monthlyTrend } = data;

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        (overdueStudents || [])
          .map((row) => row.category)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'es'));

    return categories;
  }, [overdueStudents]);

  const filteredOverdueStudents = useMemo(() => {
    const normalizedSearch = normalizeText(filters.search);

    return (overdueStudents || []).filter((row) => {
      const searchMatches = !normalizedSearch || normalizeText(
        `${row.athleteName} ${row.studentId} ${row.category || ''} ${row.coverageEnd || ''} ${row.lastPaymentDate || ''}`
      ).includes(normalizedSearch);
      const categoryMatches = filters.category === 'all' || row.category === filters.category;
      const debtLevelMatches = filters.debtLevel === 'all' || resolveDebtLevel(row) === filters.debtLevel;

      return searchMatches && categoryMatches && debtLevelMatches;
    });
  }, [filters, overdueStudents]);

  const sortedOverdueStudents = useMemo(() => {
    const rows = [...filteredOverdueStudents];
    const directionFactor = sort.direction === SORT_DIRECTION.ASC ? 1 : -1;

    rows.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sort.field) {
        case 'athleteName':
          valueA = normalizeText(a.athleteName);
          valueB = normalizeText(b.athleteName);
          break;
        case 'category':
          valueA = normalizeText(a.category);
          valueB = normalizeText(b.category);
          break;
        case 'coverageEnd':
          valueA = a.coverageEnd || '';
          valueB = b.coverageEnd || '';
          break;
        case 'overdueMonths':
          valueA = Number(a.overdueMonths || 0);
          valueB = Number(b.overdueMonths || 0);
          break;
        case 'currentMonthAttendances':
          valueA = Number(a.currentMonthAttendances || 0);
          valueB = Number(b.currentMonthAttendances || 0);
          break;
        case 'currentMonthDailyPayments':
          valueA = Number(a.currentMonthDailyPayments || 0);
          valueB = Number(b.currentMonthDailyPayments || 0);
          break;
        case 'currentMonthDailyRevenue':
          valueA = Number(a.currentMonthDailyRevenue || 0);
          valueB = Number(b.currentMonthDailyRevenue || 0);
          break;
        case 'estimatedDebt':
        default:
          valueA = Number(a.estimatedDebt || 0);
          valueB = Number(b.estimatedDebt || 0);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * directionFactor;
      }

      if (valueA < valueB) return -1 * directionFactor;
      if (valueA > valueB) return 1 * directionFactor;
      return 0;
    });

    return rows;
  }, [filteredOverdueStudents, sort]);

  const revenueSplitData = useMemo(() => ([
    { name: 'Mensualidades', value: Number(summary.monthlyMembershipRevenue || 0), fill: CHART_COLORS.membership },
    { name: 'Pago diario', value: Number(summary.dailyAttendanceRevenue || 0), fill: CHART_COLORS.daily },
  ]), [summary.dailyAttendanceRevenue, summary.monthlyMembershipRevenue]);

  const kpiInsights = useMemo(() => {
    const avgRevenuePerAttendance = summary.currentMonthAttendancesCount > 0
      ? summary.totalRevenue / summary.currentMonthAttendancesCount
      : 0;
    const dailyAttendanceShare = summary.totalRevenue > 0
      ? (summary.dailyAttendanceRevenue / summary.totalRevenue) * 100
      : 0;
    const coverageVsAttendance = summary.currentMonthStudentsWithAttendance > 0
      ? (summary.activeMonthlyCoverageCount / summary.currentMonthStudentsWithAttendance) * 100
      : 0;

    return {
      avgRevenuePerAttendance,
      dailyAttendanceShare,
      coverageVsAttendance,
    };
  }, [summary]);

  const debtRankingData = useMemo(
    () => sortedOverdueStudents.slice(0, 6).map((row) => ({
      name: row.athleteName.split(' ').slice(0, 2).join(' '),
      deuda: Number(row.estimatedDebt || 0),
      pagoDiario: Number(row.currentMonthDailyRevenue || 0),
    })),
    [sortedOverdueStudents]
  );

  const paginatedOverdue = useMemo(
    () => paginateItems(sortedOverdueStudents, tablePage, TABLE_PAGE_SIZE),
    [sortedOverdueStudents, tablePage]
  );

  const trendPeak = useMemo(
    () => monthlyTrend.reduce((max, item) => Math.max(max, Number(item.combinedTotal || 0)), 0),
    [monthlyTrend]
  );

  const filteredDebtTotal = useMemo(
    () => sortedOverdueStudents.reduce((sum, row) => sum + Number(row.estimatedDebt || 0), 0),
    [sortedOverdueStudents]
  );

  const filteredDailyRevenueTotal = useMemo(
    () => sortedOverdueStudents.reduce((sum, row) => sum + Number(row.currentMonthDailyRevenue || 0), 0),
    [sortedOverdueStudents]
  );

  const heroStats = useMemo(() => ([
    {
      label: 'Atletas con deuda',
      value: loading ? '...' : formatNumber(summary.overdueStudentsCount),
      detail: 'casos abiertos',
    },
    {
      label: 'Mensualidades vencidas',
      value: loading ? '...' : formatNumber(summary.overdueMonthlyFeesCount),
      detail: 'meses acumulados',
    },
    {
      label: 'Asistencias del mes',
      value: loading ? '...' : formatNumber(summary.currentMonthAttendancesCount),
      detail: 'actividad registrada',
    },
  ]), [
    loading,
    summary.currentMonthAttendancesCount,
    summary.overdueMonthlyFeesCount,
    summary.overdueStudentsCount,
  ]);

  // ── Table sortable header helper ──────────────────────────────────────
  const makeSortableHeader = (field, label) => (
    <SortableHeader
      field={field}
      label={label}
      sort={sort}
      onToggleSort={(f) => setSort((current) => resolveNextSort({ currentSort: current, field: f }))}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <SectionHeader
        title="Revision Financiera"
        subtitle="KPIs ejecutivos, tendencia de ingresos, deuda mensual y control de pagos diarios por asistencia."
        icon={<FaChartLine />}
      />

      {/* ── Hero Card ───────────────────────────────────────────────────── */}
      <Card>
        <div className="grid gap-5 desktop:grid-cols-[1.2fr_0.8fr] desktop:items-end">
          <div className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
              <FaChartLine className="text-cyan-300" />
              Lectura ejecutiva
            </div>
            <div>
              <h2 className="max-w-3xl text-3xl font-black tracking-tight text-white mobile:text-4xl">
                Prioriza ingresos, cobertura y riesgo sin perder el detalle operativo.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 mobile:text-base">
                Este tablero concentra lo que requiere decision rapida: flujo mensual, peso del pago diario y cartera vencida con contexto de actividad reciente.
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
            <KpiTile
              variant="spotlight"
              label="Ingreso total"
              value={loading ? '...' : formatCurrency(summary.totalRevenue)}
              detail="Mensualidades y cobros diarios consolidados en el corte actual."
              icon={<FaDollarSign />}
              accent="cyan"
            />
            <KpiTile
              variant="spotlight"
              label="Deuda estimada"
              value={loading ? '...' : formatCurrency(summary.estimatedDebtTotal)}
              detail="Saldo vencido acumulado sobre el que conviene intervenir primero."
              icon={<FaExclamationTriangle />}
              accent="rose"
            />
          </div>
        </div>
      </Card>

      {/* ── Summary KPI Cards ───────────────────────────────────────────── */}
      <div className="grid gap-4 mobile:grid-cols-2 desktop:grid-cols-4">
        <Card>
          <KpiTile
            label="Ingreso Total Mes"
            value={loading ? '...' : formatCurrency(summary.totalRevenue)}
            detail={`Mensualidades y cobros diarios consolidados.`}
            icon={<FaDollarSign />}
            accent="cyan"
          />
        </Card>

        <Card>
          <KpiTile
            label="Pago Diario Mes"
            value={loading ? '...' : formatCurrency(summary.dailyAttendanceRevenue)}
            detail={`${formatNumber(summary.currentMonthDailyPaymentsCount)} asistencias cobradas a $2.`}
            icon={<FaCalendarAlt />}
            accent="emerald"
          />
        </Card>

        <Card>
          <KpiTile
            label="Deuda Estimada"
            value={loading ? '...' : formatCurrency(summary.estimatedDebtTotal)}
            detail={`${formatNumber(summary.overdueStudentsCount)} atletas con saldo vencido.`}
            icon={<FaFileInvoiceDollar />}
            accent="rose"
          />
        </Card>

        <Card>
          <KpiTile
            label="Cobertura Activa"
            value={loading ? '...' : formatNumber(summary.activeMonthlyCoverageCount)}
            detail="Atletas con mensualidad vigente hoy."
            icon={<FaUserClock />}
            accent="violet"
          />
        </Card>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 desktop:grid-cols-[1.45fr_0.95fr]" data-guide-id="financial-review-filters">
        <ChartCard
          title="Tendencia Financiera"
          subtitle={`Pico reciente: ${loading ? '...' : formatCurrency(trendPeak)}. Vista consolidada de los ultimos 6 meses.`}
        >
          {loading ? (
            <LoadingSpinner message="Cargando tendencia financiera..." />
          ) : monthlyTrend.length === 0 ? (
            <EmptyState
              icon={<FaChartLine />}
              title="Sin datos financieros"
              description="Cuando existan pagos o asistencias con cobro diario, apareceran aqui."
            />
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.total} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={CHART_COLORS.total} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dailyRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.daily} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.daily} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#e2e8f0', fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="combinedTotal"
                    name="Total combinado"
                    stroke={CHART_COLORS.total}
                    fill="url(#totalRevenueGradient)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="dailyPaymentsTotal"
                    name="Pago diario"
                    stroke={CHART_COLORS.daily}
                    fill="url(#dailyRevenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Mix de Ingresos"
          subtitle="Lectura rapida para ver si el flujo depende mas de mensualidades o de asistencia diaria."
        >
          {loading ? (
            <LoadingSpinner message="Cargando composicion..." />
          ) : revenueSplitData.every((item) => item.value === 0) ? (
            <EmptyState
              icon={<FaDollarSign />}
              title="Sin composicion disponible"
              description="Aun no hay ingresos para comparar."
            />
          ) : (
            <div className="grid gap-4 mobile:grid-cols-[1.1fr_0.9fr]">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueSplitData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={4}
                    >
                      {revenueSplitData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-3">
                {revenueSplitData.map((item) => (
                  <div key={item.name} className="rounded-2xl border border-white/10 bg-black/20 p-3 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">{formatCurrency(item.value)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {summary.totalRevenue > 0 ? `${((item.value / summary.totalRevenue) * 100).toFixed(1)}% del ingreso mensual` : '0% del ingreso mensual'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── KPIs + Ranking ──────────────────────────────────────────────── */}
      <div className="grid gap-4 desktop:grid-cols-[0.95fr_1.05fr]">
        <ChartCard
          title="KPIs de Revision"
          subtitle="Indicadores pensados para lectura administrativa rapida."
        >
          <div className="grid gap-3">
            <KpiTile
              label="Ingreso promedio por asistencia"
              value={loading ? '...' : formatCurrency(kpiInsights.avgRevenuePerAttendance)}
              detail="Relacion entre ingresos del mes y asistencias registradas."
              icon={<FaChartLine />}
              accent="gold"
            />
            <KpiTile
              label="Peso del pago diario"
              value={loading ? '...' : `${kpiInsights.dailyAttendanceShare.toFixed(1)}%`}
              detail="Participacion del cobro por asistencia dentro del ingreso total."
              icon={<FaCalendarAlt />}
              accent="emerald"
            />
            <KpiTile
              label="Cobertura vs atletas con asistencia"
              value={loading ? '...' : `${kpiInsights.coverageVsAttendance.toFixed(1)}%`}
              detail="Que porcentaje de quienes entrenan este mes ya tiene mensualidad vigente."
              icon={<FaUsers />}
              accent="violet"
            />
            <KpiTile
              label="Mensualidades vencidas acumuladas"
              value={loading ? '...' : formatNumber(summary.overdueMonthlyFeesCount)}
              detail="Total de meses vencidos detectados en la cartera actual."
              icon={<FaExclamationTriangle />}
              accent="rose"
            />
          </div>
        </ChartCard>

        <ChartCard
          title="Ranking de Riesgo"
          subtitle="Atletas con mayor deuda estimada y comparativo contra lo que han aportado por pago diario este mes."
        >
          {loading ? (
            <LoadingSpinner message="Cargando ranking de riesgo..." />
          ) : debtRankingData.length === 0 ? (
            <EmptyState
              icon={<FaExclamationTriangle />}
              title="Sin cartera vencida"
              description="Cuando existan mensualidades vencidas, se mostraran aqui."
            />
          ) : (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={debtRankingData} layout="vertical" margin={{ top: 6, right: 18, left: 18, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.14)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={112}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="deuda" name="Deuda estimada" fill={CHART_COLORS.debt} radius={[0, 10, 10, 0]} />
                  <Bar dataKey="pagoDiario" name="Ingreso diario mes" fill={CHART_COLORS.daily} radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Overdue students detail table ────────────────────────────────── */}
      <ChartCard
        title="Detalle de Mensualidades Vencidas"
        subtitle="Tabla paginada para revisar cartera, actividad reciente y aporte por pago diario."
      >
        {loading ? (
          <LoadingSpinner message="Cargando detalle de vencidos..." />
        ) : overdueStudents.length === 0 ? (
          <EmptyState
            icon={<FaExclamationTriangle />}
            title="No hay mensualidades vencidas"
            description="Todos los atletas con historial de mensualidad tienen cobertura vigente."
          />
        ) : (
          <>
            {/* Filters */}
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm mb-4">
              <div className="mb-3 flex items-center gap-2 text-rv-gold">
                <FaFilter />
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">Filtros de revision</p>
              </div>
              <div className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-[1.3fr_1fr_1fr_auto]">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaSearch />
                  </span>
                  <Input
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    className="min-h-[48px] border-white/15 bg-black/35 pl-10 text-white placeholder:text-slate-500"
                    placeholder="Buscar por atleta, ID o fecha..."
                    aria-label="Buscar vencidos"
                  />
                </div>
                <Select
                  value={filters.category}
                  onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                  className="min-h-[48px] border-white/15 bg-black/35 text-white"
                  aria-label="Filtrar por categoria"
                >
                  <option value="all">Todas las categorias</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
                <Select
                  value={filters.debtLevel}
                  onChange={(event) => setFilters((current) => ({ ...current, debtLevel: event.target.value }))}
                  className="min-h-[48px] border-white/15 bg-black/35 text-white"
                  aria-label="Filtrar por nivel de deuda"
                >
                  <option value="all">Todos los niveles</option>
                  <option value="critica">Critica</option>
                  <option value="alta">Alta</option>
                  <option value="moderada">Moderada</option>
                </Select>
                <Button
                  variant="secondary"
                  className="min-h-[48px]"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setSort(DEFAULT_SORT);
                    setTablePage(1);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>

            {/* Filter summary KPIs */}
            <div className="mb-4 grid gap-3 mobile:grid-cols-3">
              <KpiTile label="Casos filtrados" value={formatNumber(sortedOverdueStudents.length)} accent="slate" />
              <KpiTile label="Deuda filtrada" value={formatCurrency(filteredDebtTotal)} accent="slate" />
              <KpiTile label="Pago diario filtrado" value={formatCurrency(filteredDailyRevenueTotal)} accent="slate" />
            </div>

            {sortedOverdueStudents.length === 0 ? (
              <EmptyState
                icon={<FaFilter />}
                title="Sin resultados para los filtros"
                description="Ajusta la busqueda o el nivel de deuda para volver a mostrar casos."
              />
            ) : (
              <DataTable
                columns={[
                  { key: 'athleteName', label: 'Atleta', headerContent: makeSortableHeader('athleteName', 'Atleta') },
                  { key: 'category', label: 'Categoria', headerContent: makeSortableHeader('category', 'Categoria') },
                  { key: 'lastPayment', label: 'Ultimo pago' },
                  { key: 'coverageEnd', label: 'Cobertura fin', headerContent: makeSortableHeader('coverageEnd', 'Cobertura fin') },
                  { key: 'overdueMonths', label: 'Meses vencidos', headerContent: makeSortableHeader('overdueMonths', 'Meses vencidos') },
                  { key: 'estimatedDebt', label: 'Deuda estimada', headerContent: makeSortableHeader('estimatedDebt', 'Deuda estimada') },
                  { key: 'attendances', label: 'Asistencias mes', headerContent: makeSortableHeader('currentMonthAttendances', 'Asistencias mes') },
                  { key: 'dailyPayments', label: 'Pagos diarios', headerContent: makeSortableHeader('currentMonthDailyPayments', 'Pagos diarios') },
                  { key: 'dailyRevenue', label: 'Ingreso diario', headerContent: makeSortableHeader('currentMonthDailyRevenue', 'Ingreso diario') },
                ]}
                rows={paginatedOverdue.items}
                keyExtractor={(row) => row.studentId}
                renderRow={(row) => (
                  <>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-white">{row.athleteName}</p>
                        <p className="mt-1 text-xs text-slate-400">ID: {row.studentId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{row.category ? row.category.replaceAll('_', ' ') : '--'}</td>
                    <td className="px-4 py-4 text-slate-300">{row.lastPaymentDate || '--'}</td>
                    <td className="px-4 py-4 text-slate-200">{row.coverageEnd || '--'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                        resolveDebtLevel(row) === 'critica'
                          ? 'border-rose-400/25 bg-rose-400/10 text-rose-200'
                          : resolveDebtLevel(row) === 'alta'
                            ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                            : 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200'
                      }`}>
                        {row.overdueMonths}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-rose-300">{formatCurrency(row.estimatedDebt)}</td>
                    <td className="px-4 py-4 text-slate-200">{formatNumber(row.currentMonthAttendances)}</td>
                    <td className="px-4 py-4 text-slate-200">{formatNumber(row.currentMonthDailyPayments)}</td>
                    <td className="px-4 py-4 font-semibold text-emerald-300">{formatCurrency(row.currentMonthDailyRevenue)}</td>
                  </>
                )}
                minWidth="1060px"
                page={paginatedOverdue.page}
                totalPages={paginatedOverdue.totalPages}
                onPageChange={setTablePage}
              />
            )}
          </>
        )}
      </ChartCard>
    </div>
  );
};

export default FinancialReview;
