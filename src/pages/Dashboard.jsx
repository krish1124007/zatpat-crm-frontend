import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, followupsService } from '../services/dashboard.service.js';
import { BarChart, DonutChart, Sparkline } from '../components/charts/Charts.jsx';
import { formatINR, formatDate } from '../utils/format.js';
import { STATUS_COLORS, LOAN_STATUSES } from '../utils/constants.js';
import { useAuth } from '../store/auth.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [trend, setTrend] = useState(null);
  const [banks, setBanks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [followCounts, setFollowCounts] = useState(null);
  const [channels, setChannels] = useState([]);
  const [handlers, setHandlers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      dashboardService.kpis(),
      dashboardService.statusBreakdown(),
      dashboardService.monthlyTrend(6),
      dashboardService.topBanks(),
      dashboardService.recentCases(),
      followupsService.inbox(7),
      dashboardService.channelBreakdown(),
      dashboardService.handlerPerformance(),
      dashboardService.productBreakdown(),
      dashboardService.pipelineSummary(),
    ])
      .then(([k, b, t, bk, rc, fi, ch, hp, pb, ps]) => {
        if (cancelled) return;
        setKpis(k);
        setBreakdown(b);
        setTrend(t);
        setBanks(bk.items);
        setRecent(rc.items);
        setFollowCounts(fi.counts);
        setChannels(ch.items);
        setHandlers(hp.items);
        setProducts(pb.items);
        setPipeline(ps);
      })
      .catch((e) => setError(e.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const trendValues = trend?.items?.map((t) => t.disbursedCount) || [];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500">
              Welcome back, {user?.name}. Here's your complete business overview.
            </p>
          </div>
          <Link
            to="/cases"
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Open Cases
          </Link>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {loading && <div className="text-sm text-slate-500">Loading dashboard...</div>}

        {!loading && kpis && (
          <>
            {/* ── ROW 1: Primary KPIs ── */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Total Cases" value={kpis.totalCases} hint={`${kpis.monthNewCases} new this month`} accent="text-slate-800" />
              <Kpi label="Active Pipeline" value={kpis.activeCases} hint="In progress" accent="text-indigo-700" spark={trendValues} />
              <Kpi label="This Month Disbursed" value={kpis.monthDisbursed.count} hint={formatINR(kpis.monthDisbursed.amount)} accent="text-emerald-700" />
              <Kpi label="Pending Payments" value={kpis.pendingPayment.count} hint={formatINR(kpis.pendingPayment.amount)} accent="text-amber-700" />
            </div>

            {/* ── ROW 2: Secondary KPIs ── */}
            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Today's Follow-ups" value={kpis.todayFollowUps}
                hint={followCounts ? `${followCounts.overdue} overdue | ${followCounts.upcoming} upcoming` : ''}
                accent="text-rose-700" href="/followups" />
              <Kpi label="Sanctioned (Awaiting Disb.)" value={kpis.sanctionedPending.count}
                hint={formatINR(kpis.sanctionedPending.amount)} accent="text-blue-700" />
              <Kpi label="All-time Disbursed" value={kpis.totalDisbursed.count}
                hint={formatINR(kpis.totalDisbursed.amount)} accent="text-emerald-800" />
              <Kpi label="Avg Loan Size" value={formatINR(kpis.avgLoanAmount)} accent="text-purple-700" />
            </div>

            {/* ── ROW 3: Financial Summary ── */}
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <FinanceCard label="Month Commission" value={formatINR(kpis.monthCommissionPaid)} color="text-emerald-700" bg="bg-emerald-50" />
              <FinanceCard label="Month Expenses" value={formatINR(kpis.monthExpenses)} sub={`${kpis.monthExpenseCount} entries`} color="text-red-700" bg="bg-red-50" />
              <FinanceCard label="Month Net Income" value={formatINR(kpis.monthNetIncome)} color={kpis.monthNetIncome >= 0 ? 'text-emerald-700' : 'text-red-700'} bg={kpis.monthNetIncome >= 0 ? 'bg-emerald-50' : 'bg-red-50'} />
            </div>

            {/* ── Pipeline Funnel ── */}
            {pipeline && (
              <Panel title="Pipeline Funnel" className="mb-4">
                <div className="flex items-end gap-1">
                  {pipeline.pipeline.map((s) => {
                    const maxCount = Math.max(...pipeline.pipeline.map((p) => p.count), 1);
                    const height = Math.max((s.count / maxCount) * 100, 8);
                    const sc = STATUS_COLORS[s.status];
                    return (
                      <Link key={s.status} to={`/cases/status/${s.status}`} className="group flex flex-1 flex-col items-center">
                        <span className="mb-1 text-xs font-bold text-slate-700">{s.count}</span>
                        <div
                          className="w-full rounded-t-md transition-all group-hover:opacity-80"
                          style={{ height: `${height}px`, backgroundColor: sc?.fg || '#64748b', minHeight: '8px' }}
                        />
                        <span className="mt-1 text-[10px] text-slate-500 text-center leading-tight">{s.status}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Overdue follow-ups: <strong className="text-red-600">{pipeline.overdueFollowUps}</strong></span>
                  <span>Pending insurance: <strong className="text-amber-600">{pipeline.pendingInsurance}</strong></span>
                  <span>Rejected: <strong>{pipeline.rejected}</strong></span>
                  <span>Cancelled: <strong>{pipeline.cancelled}</strong></span>
                </div>
              </Panel>
            )}

            {/* ── Charts Row ── */}
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
              <Panel title="Status breakdown" className="lg:col-span-1">
                {breakdown && (
                  <DonutChart
                    data={breakdown.items.filter((it) => it.count > 0).map((it) => ({
                      label: it.status,
                      value: it.count,
                      color: STATUS_COLORS[it.status]?.fg || '#64748b',
                    }))}
                  />
                )}
              </Panel>

              <Panel title="Monthly Trend (6 months)" className="lg:col-span-2">
                {trend && (
                  <div>
                    <BarChart
                      data={trend.items.map((t) => ({ label: t.label, value: t.disbursedCount }))}
                    />
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      {trend.items.map((t) => (
                        <span key={t.label}>{t.label}: <strong>{t.newCases}</strong> new, <strong className="text-emerald-700">{t.disbursedCount}</strong> disbursed ({formatINR(t.disbursedAmount)})</span>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </div>

            {/* ── Data Tables Row ── */}
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
              {/* Top Banks */}
              <Panel title="Top Banks This Month">
                {banks.length === 0 && <div className="text-sm text-slate-500">No disbursals yet this month.</div>}
                <div className="space-y-2">
                  {banks.map((b, i) => (
                    <div key={b.bank} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{i + 1}</span>
                        <span className="truncate font-medium text-slate-700">{b.bank}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{b.count}</span>
                        <span className="text-xs tabular-nums text-slate-500">{formatINR(b.amount)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Channel Breakdown */}
              <Panel title="Channel Performance">
                {channels.length === 0 && <div className="text-sm text-slate-500">No data.</div>}
                <div className="space-y-2">
                  {channels.map((c) => (
                    <div key={c.channel} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{c.channel}</span>
                      <span className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{c.count} cases</span>
                        <span className="font-semibold text-emerald-700">{c.disbursedCount} disbursed</span>
                        <span className="tabular-nums text-slate-400">{formatINR(c.totalDisbursed)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Product Breakdown */}
              <Panel title="Product Mix">
                {products.length === 0 && <div className="text-sm text-slate-500">No data.</div>}
                <div className="space-y-2">
                  {products.map((p) => (
                    <div key={p.product} className="flex items-center justify-between text-sm">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{p.product}</span>
                      <span className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{p.count} total</span>
                        <span className="font-semibold text-emerald-700">{p.disbursedCount} disbursed</span>
                        <span className="tabular-nums text-slate-400">{formatINR(p.totalAmount)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* ── Handler Performance ── */}
            <Panel title="Team Performance" className="mb-4">
              {handlers.length === 0 && <div className="text-sm text-slate-500">No handler data.</div>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="pb-2 text-left font-medium">Team Member</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                      <th className="pb-2 text-right font-medium">Active</th>
                      <th className="pb-2 text-right font-medium">Disbursed</th>
                      <th className="pb-2 text-right font-medium">This Month</th>
                      <th className="pb-2 text-right font-medium">Disbursed Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handlers.map((h, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 font-medium text-slate-800">{h.handler.name}</td>
                        <td className="py-2 text-right tabular-nums">{h.totalCases}</td>
                        <td className="py-2 text-right tabular-nums text-indigo-600">{h.activeCases}</td>
                        <td className="py-2 text-right tabular-nums text-emerald-700 font-semibold">{h.disbursedCases}</td>
                        <td className="py-2 text-right tabular-nums">
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand">{h.monthDisbursed}</span>
                        </td>
                        <td className="py-2 text-right tabular-nums text-slate-600">{formatINR(h.disbursedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* ── Recent Cases ── */}
            <Panel title="Recent Cases">
              {recent.length === 0 && <div className="text-sm text-slate-500">No cases yet.</div>}
              <div className="space-y-1">
                {recent.map((c) => (
                  <Link
                    key={c._id}
                    to="/cases"
                    className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm last:border-0 hover:bg-slate-50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">#{c.srNo}</span>
                      <span className="font-medium text-slate-800">{c.customerName}</span>
                      <span className="text-xs text-slate-500">{c.bankName || '---'}</span>
                      {c.handledBy && (
                        <span className="text-xs text-indigo-600">{c.handledBy.name}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusPill status={c.currentStatus} />
                      <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, accent, spark, href }) {
  const inner = (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${accent || 'text-slate-800'}`}>{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
        {spark && spark.length > 0 && <Sparkline values={spark} width={70} height={32} />}
      </div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function FinanceCard({ label, value, sub, color, bg }) {
  return (
    <div className={`rounded-xl p-4 shadow-sm ring-1 ring-slate-200 ${bg}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#e5e7eb', fg: '#374151' };
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {status}
    </span>
  );
}
