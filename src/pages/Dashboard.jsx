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
  const [distributions, setDistributions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHandler, setSelectedHandler] = useState(null);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [kpiCases, setKpiCases] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(false);

  async function handleKpiClick(title, params) {
    if (!params) return;
    setSelectedKpi({ title, params });
    setKpiLoading(true);
    try {
      const { casesService } = await import('../services/cases.service.js');
      const r = await casesService.list({ ...params, limit: 100 });
      setKpiCases(r.items);
    } catch (err) {
      console.error(err);
    } finally {
      setKpiLoading(false);
    }
  }

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
      dashboardService.allDistributions(),
    ])
      .then(([k, b, t, bk, rc, fi, ch, hp, pb, ps, dist]) => {
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
        setDistributions(dist);
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
              <Kpi label="Total Cases" value={kpis.totalCases} hint={`${kpis.monthNewCases} new this month`} accent="text-slate-800" onClick={() => handleKpiClick('Total Cases', {})} />
              <Kpi label="Active Pipeline" value={kpis.activeCases} hint="In progress" accent="text-indigo-700" spark={trendValues} onClick={() => handleKpiClick('Active Pipeline', {})} />
              <Kpi label="This Month Disbursed" value={kpis.monthDisbursed.count} hint={formatINR(kpis.monthDisbursed.amount)} accent="text-emerald-700" onClick={() => handleKpiClick('This Month Disbursed', { status: 'Disbursed' })} />
              <Kpi label="Pending Payments" value={kpis.pendingPayment.count} hint={formatINR(kpis.pendingPayment.amount)} accent="text-amber-700" onClick={() => handleKpiClick('Pending Payments', { pendingPayment: 'true' })} />
            </div>

            {/* ── ROW 2: Secondary KPIs ── */}
            <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label="Today's Follow-ups" value={kpis.todayFollowUps}
                hint={followCounts ? `${followCounts.overdue} overdue | ${followCounts.upcoming} upcoming` : ''}
                accent="text-rose-700" onClick={() => window.location.href = '#/followups'} />
              <Kpi label="Sanctioned (Awaiting Disb.)" value={kpis.sanctionedPending.count}
                hint={formatINR(kpis.sanctionedPending.amount)} accent="text-blue-700" onClick={() => handleKpiClick('Sanctioned Cases', { status: 'Sanctioned' })} />
              <Kpi label="All-time Disbursed" value={kpis.totalDisbursed.count}
                hint={formatINR(kpis.totalDisbursed.amount)} accent="text-emerald-800" onClick={() => handleKpiClick('All-time Disbursed', { status: 'Disbursed' })} />
              <Kpi label="Avg Loan Size" value={formatINR(kpis.avgLoanAmount)} accent="text-purple-700" />
              <Kpi label="Part Payments Collected" value={kpis.partPayments?.count || 0}
                hint={formatINR(kpis.partPayments?.amount || 0)} accent="text-amber-600" onClick={() => handleKpiClick('Part Payments', { hasPartPayment: 'true' })} />
              <Kpi label="Unpaid Ref. Payouts" value={kpis.unpaidReferralPayout?.count || 0}
                hint={formatINR(kpis.unpaidReferralPayout?.amount || 0)} accent="text-red-600" onClick={() => window.location.href = '#/reference-partners'} />
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
                    <div 
                      key={b.bank} 
                      className="flex cursor-pointer items-center justify-between text-sm rounded transition hover:bg-slate-50 p-1 -mx-1"
                      onClick={() => handleKpiClick(`Bank: ${b.bank}`, { bankName: b.bank })}
                    >
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
                    <div 
                      key={c.channel} 
                      className="flex cursor-pointer items-center justify-between text-sm rounded transition hover:bg-slate-50 p-1 -mx-1"
                      onClick={() => handleKpiClick(`Channel: ${c.channel}`, { channelName: c.channel })}
                    >
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
                    <div 
                      key={p.product} 
                      className="flex cursor-pointer items-center justify-between text-sm rounded transition hover:bg-slate-50 p-1 -mx-1"
                      onClick={() => handleKpiClick(`Product: ${p.product}`, { product: p.product })}
                    >
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
                        <td 
                          className="py-2 font-medium text-brand hover:underline cursor-pointer"
                          onClick={() => setSelectedHandler(h)}
                        >
                          {h.handler.name}
                        </td>
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

            {/* ── Additional Column Breakdowns ── */}
            {distributions && (
              <div className="mb-4 grid gap-4 lg:grid-cols-4">
                <DistributionPanel title="Send Feedback Form" data={distributions.sendFeedbackForm} onRowClick={(label) => handleKpiClick(`Feedback Form: ${label || '(Blank)'}`, { sendFeedbackForm: label })} />
                <DistributionPanel title="Send Review Link" data={distributions.sendReviewLink} onRowClick={(label) => handleKpiClick(`Review Link: ${label || '(Blank)'}`, { sendReviewLink: label })} />
                <DistributionPanel title="Handover Confirmation" data={distributions.handoverConfirmation} onRowClick={(label) => handleKpiClick(`Handover: ${label || '(Blank)'}`, { handoverConfirmation: label })} />
                <DistributionPanel title="Banker Confirmation" data={distributions.bankerConfirmation} onRowClick={(label) => handleKpiClick(`Banker Confirmation: ${label || '(Blank)'}`, { bankerConfirmation: label })} />
                <DistributionPanel title="Insurance Status" data={distributions.insuranceStatus} onRowClick={(label) => handleKpiClick(`Insurance: ${label || '(Blank)'}`, { insuranceStatus: label })} />
                <DistributionPanel title="Property Type" data={distributions.propertyType} onRowClick={(label) => handleKpiClick(`Property: ${label || '(Blank)'}`, { propertyType: label })} />
                <DistributionPanel title="Profession" data={distributions.profession} onRowClick={(label) => handleKpiClick(`Profession: ${label || '(Blank)'}`, { profession: label })} />
                <DistributionPanel title="Disbursement Type" data={distributions.disbursementType} onRowClick={(label) => handleKpiClick(`Disbursement Type: ${label || '(Blank)'}`, { disbursementType: label })} />
                <DistributionPanel title="Post Disbursement Stage" data={distributions.postDisbursementStage} onRowClick={(label) => handleKpiClick(`Post Disbursement: ${label || '(Blank)'}`, { postDisbursementStage: label })} />
              </div>
            )}

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

      {/* ── Handler Detail Modal ── */}
      {selectedHandler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedHandler(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">{selectedHandler.handler.name} - Performance</h2>
              <button onClick={() => setSelectedHandler(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <div className="text-2xl font-bold text-slate-800">{selectedHandler.totalCases}</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Cases</div>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-700">{selectedHandler.disbursedCases}</div>
                <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Disbursed</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-5">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Status Breakdown</div>
                <div className="space-y-2">
                  {Object.entries(selectedHandler.statusCounts || {}).sort((a,b) => b[1]-a[1]).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <StatusPill status={status} />
                      </div>
                      <div className="font-semibold text-slate-700">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">Product Breakdown</div>
                <div className="space-y-2">
                  {Object.entries(selectedHandler.productCounts || {}).sort((a,b) => b[1]-a[1]).map(([product, count]) => (
                    <div key={product} className="flex items-center justify-between text-sm">
                      <div className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 max-w-[120px] truncate" title={product}>
                        {product}
                      </div>
                      <div className="font-semibold text-slate-700">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link 
              to={`/cases?handledBy=${selectedHandler.handler._id}`}
              className="block w-full rounded-md bg-brand py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
            >
              View All Cases
            </Link>
          </div>
        </div>
      )}

      {/* ── KPI Detail Modal ── */}
      {selectedKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedKpi(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="text-lg font-bold text-slate-800">{selectedKpi.title}</h2>
              <button onClick={() => setSelectedKpi(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {kpiLoading ? (
                 <div className="text-sm text-slate-500">Loading cases...</div>
              ) : kpiCases.length === 0 ? (
                 <div className="text-sm text-slate-500">No cases found.</div>
              ) : (
                <div className="space-y-1">
                  {kpiCases.map((c) => (
                    <div key={c._id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0 hover:bg-slate-50">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">#{c.srNo}</span>
                        <span className="font-medium text-slate-800">{c.customerName}</span>
                        <span className="text-xs text-slate-500">{c.bankName || '---'}</span>
                        {c.handledBy && <span className="text-xs text-indigo-600">{c.handledBy.name}</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusPill status={c.currentStatus} />
                        <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 text-right">
               <Link 
                 to={`/cases?${new URLSearchParams(selectedKpi.params).toString()}`} 
                 className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
               >
                 View in Full Table →
               </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, accent, spark, onClick }) {
  const inner = (
    <div 
      className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
    >
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
  return inner;
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

function DistributionPanel({ title, data, onRowClick }) {
  if (!data || data.length === 0) return null;
  return (
    <Panel title={title}>
      <div className="space-y-1">
        {data.map((d) => (
          <div
            key={d.label}
            onClick={() => onRowClick(d.label === 'Empty' ? '' : d.label)}
            className="flex cursor-pointer items-center justify-between rounded-md border-b border-slate-100 py-1.5 px-2 text-sm transition hover:bg-slate-50 last:border-0"
          >
            <span className="font-medium text-slate-700 truncate mr-2" title={d.label}>{d.label === 'Empty' ? '(Blank)' : d.label}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{d.count}</span>
          </div>
        ))}
      </div>
    </Panel>
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
