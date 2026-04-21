import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { casesService } from '../services/cases.service.js';
import { formatINR, formatDate, toDateInput } from '../utils/format.js';
import { LOAN_STATUSES, STATUS_COLORS, POST_DISBURSEMENT_STAGES } from '../utils/constants.js';

const statusLabels = {
  Query: 'Query Cases',
  ReadyLogin: 'Ready for Login',
  Hold: 'On Hold',
  LoginDone: 'Login Done',
  UnderProcess: 'Under Process',
  BankFinalized: 'Bank Finalized',
  Sanctioned: 'Sanctioned',
  Disbursed: 'Disbursed',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  NotInterested: 'Not Interested',
};

export default function CasesByStatusPage() {
  const { status } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [handlerFilter, setHandlerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [postDisbStageFilter, setPostDisbStageFilter] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = { status, limit: 200 };
      if (search) params.search = search;
      if (bankFilter) params.bankName = bankFilter;
      if (handlerFilter) params.handledBy = handlerFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (postDisbStageFilter) params.postDisbursementStage = postDisbStageFilter;
      const r = await casesService.list(params);
      setRows(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, bankFilter, handlerFilter, dateFrom, dateTo, postDisbStageFilter]);

  const sc = STATUS_COLORS[status] || { bg: '#e5e7eb', fg: '#374151', rowBg: '#f3f4f6' };

  // Derive unique banks and handlers for filters
  const banks = useMemo(() => [...new Set(rows.map((r) => r.bankName).filter(Boolean))], [rows]);
  const handlers = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (r.handledBy) map.set(r.handledBy._id || r.handledBy, r.handledBy.name || 'Unknown');
    }
    return [...map.entries()];
  }, [rows]);

  const totalLoan = rows.reduce((a, r) => a + (r.loanAmount || 0), 0);
  const totalDisbursed = rows.reduce((a, r) => a + (r.disbursedAmount || 0), 0);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3">
          <Link to="/cases" className="text-sm text-brand hover:underline">← All Cases</Link>
          <h1 className="text-2xl font-bold text-slate-800">
            <span
              className="mr-2 inline-block rounded-lg px-3 py-1 text-lg"
              style={{ backgroundColor: sc.bg, color: sc.fg }}
            >
              {statusLabels[status] || status}
            </span>
          </h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {rows.length} cases
          </span>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <input
            type="text"
            placeholder="🔍 Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-56 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All Banks</option>
            {banks.map((b) => <option key={b}>{b}</option>)}
          </select>
          {handlers.length > 0 && (
            <select
              value={handlerFilter}
              onChange={(e) => setHandlerFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">All Handlers</option>
              {handlers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          {status === 'Disbursed' && (
            <select
              value={postDisbStageFilter}
              onChange={(e) => setPostDisbStageFilter(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">All Post-Disb Stages</option>
              {POST_DISBURSEMENT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          )}
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" title="From date" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" title="To date" />
          <button onClick={load} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
            Apply
          </button>
          <div className="ml-auto flex gap-4 text-xs text-slate-600">
            <span>Loan: <strong>{formatINR(totalLoan)}</strong></span>
            <span>Disbursed: <strong className="text-emerald-700">{formatINR(totalDisbursed)}</strong></span>
          </div>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-slate-600">
                <th className="px-3 py-2 text-left font-semibold">Sr No</th>
                <th className="px-3 py-2 text-left font-semibold">File No</th>
                <th className="px-3 py-2 text-left font-semibold">Customer</th>
                <th className="px-3 py-2 text-left font-semibold">Phone</th>
                <th className="px-3 py-2 text-left font-semibold">Product</th>
                <th className="px-3 py-2 text-left font-semibold">Bank</th>
                <th className="px-3 py-2 text-left font-semibold">Handled By</th>
                <th className="px-3 py-2 text-left font-semibold">Channel</th>
                <th className="px-3 py-2 text-left font-semibold">Reference</th>
                <th className="px-3 py-2 text-right font-semibold">Loan Amt</th>
                <th className="px-3 py-2 text-right font-semibold">Sanctioned</th>
                <th className="px-3 py-2 text-right font-semibold">Disbursed</th>
                <th className="px-3 py-2 text-right font-semibold">Pending</th>
                <th className="px-3 py-2 text-left font-semibold">Follow Date</th>
                {status === 'Disbursed' && <th className="px-3 py-2 text-left font-semibold">Post-Disb</th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={15} className="p-4 text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={15} className="p-4 text-slate-500">No cases.</td></tr>}
              {rows.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  style={{ backgroundColor: sc.rowBg }}
                >
                  <td className="px-3 py-2 font-mono text-slate-500">#{c.srNo}</td>
                  <td className="px-3 py-2 font-mono">{c.fileNumber || '—'}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{c.customerName}</td>
                  <td className="px-3 py-2">{c.phone}</td>
                  <td className="px-3 py-2">{c.product}</td>
                  <td className="px-3 py-2">{c.bankName || '—'}</td>
                  <td className="px-3 py-2 text-indigo-700">{c.handledBy?.name || '—'}</td>
                  <td className="px-3 py-2">{c.channelName || '—'}</td>
                  <td className="px-3 py-2 text-purple-700">{c.referenceName || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(c.loanAmount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(c.sanctionedAmount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700">{formatINR(c.disbursedAmount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatINR(c.pendingPaymentAmount)}</td>
                  <td className="px-3 py-2">{formatDate(c.followDate)}</td>
                  {status === 'Disbursed' && (
                    <td className="px-3 py-2">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        {POST_DISBURSEMENT_STAGES.find((s) => s.key === c.postDisbursementStage)?.label || '—'}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
