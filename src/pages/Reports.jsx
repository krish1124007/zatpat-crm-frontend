import { useEffect, useState } from 'react';
import { reportsService } from '../services/finance.service.js';
import { formatINR } from '../utils/format.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [tab, setTab] = useState('pnl');
  const [pnl, setPnl] = useState(null);
  const [gst, setGst] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, g] = await Promise.all([
        reportsService.pnl({ month, year }),
        reportsService.gst({ month, year }),
      ]);
      setPnl(p);
      setGst(g);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
            <p className="text-sm text-slate-500">Monthly P&amp;L and GST summary (computed live)</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 flex gap-2 border-b border-slate-200">
          <TabButton active={tab === 'pnl'} onClick={() => setTab('pnl')}>P&amp;L</TabButton>
          <TabButton active={tab === 'gst'} onClick={() => setTab('gst')}>GST</TabButton>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {loading && <div className="text-sm text-slate-500">Loading…</div>}

        {!loading && tab === 'pnl' && pnl && <PnLView data={pnl} />}
        {!loading && tab === 'gst' && gst && <GSTView data={gst} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium ${
        active
          ? 'border-b-2 border-brand text-brand'
          : 'text-slate-600 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function PnLView({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigStat label="Income" value={formatINR(data.summary.totalIncome)} accent="text-emerald-700" />
        <BigStat label="Expenses" value={formatINR(data.summary.totalExpenses)} accent="text-amber-700" />
        <BigStat label="Salaries" value={formatINR(data.summary.totalSalaries)} accent="text-amber-700" />
        <BigStat
          label="Net Profit"
          value={formatINR(data.summary.netProfit)}
          accent={data.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}
        />
      </div>

      <Card title="Income">
        <Row label="Paid invoices" value={data.income.invoiceCount} />
        <Row label="Commission earned (base)" value={formatINR(data.income.commission)} />
        <Row label="GST collected" value={formatINR(data.income.gstCollected)} muted />
        <Row label="Gross invoiced" value={formatINR(data.income.grossInvoiced)} muted />
      </Card>

      <Card title="Expenses by category">
        {data.expenses.byCategory.length === 0 && (
          <div className="text-sm text-slate-500">No expenses this month.</div>
        )}
        {data.expenses.byCategory.map((c) => (
          <Row key={c.category} label={`${c.category} (${c.count})`} value={formatINR(c.amount)} />
        ))}
        <Row label="Total" value={formatINR(data.expenses.total)} bold />
      </Card>

      <Card title="Salaries">
        <Row label="Employees paid" value={data.salaries.employeeCount} />
        <Row label="Incentives" value={formatINR(data.salaries.totalIncentives)} muted />
        <Row label="Total net pay" value={formatINR(data.salaries.totalNetPay)} bold />
      </Card>
    </div>
  );
}

function GSTView({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigStat label="Invoices" value={data.invoiceCount} />
        <BigStat label="Collected GST" value={formatINR(data.collectedGst)} />
        <BigStat label="Payable GST" value={formatINR(data.payableGst)} accent="text-red-600" />
        <BigStat label="Pending Invoiced" value={formatINR(data.pendingTotal)} accent="text-amber-700" />
      </div>

      <Card title="GST split (intra-state default)">
        <Row label="CGST (50%)" value={formatINR(data.cgst)} />
        <Row label="SGST (50%)" value={formatINR(data.sgst)} />
        <Row label="IGST" value={formatINR(data.igst)} muted />
        <Row label="Total payable" value={formatINR(data.payableGst)} bold />
      </Card>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Note: <strong>Payable GST</strong> only counts invoices already marked <em>Paid</em> —
        you only owe GST on commission you've actually been paid for.
      </div>
    </div>
  );
}

function BigStat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent || 'text-slate-800'}`}>{value}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 text-sm font-semibold text-slate-700">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, muted, bold }) {
  return (
    <div
      className={`flex items-center justify-between border-b border-slate-100 py-1 text-sm last:border-0 ${
        bold ? 'pt-2 font-semibold text-slate-900' : muted ? 'text-slate-500' : 'text-slate-700'
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
