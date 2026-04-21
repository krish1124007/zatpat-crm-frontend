import { useEffect, useMemo, useState, useCallback } from 'react';
import { followupsService } from '../services/dashboard.service.js';
import { casesService } from '../services/cases.service.js';
import { formatDate, formatINR } from '../utils/format.js';
import { STATUS_COLORS, FOLLOWUP_TYPES } from '../utils/constants.js';
import AddCaseModal from '../components/cases/AddCaseModal.jsx';

const BUCKET_LABELS = { overdue: 'Overdue', today: 'Today', upcoming: 'Upcoming' };
const BUCKET_COLORS = {
  overdue: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-300', dot: 'bg-red-500' },
  today: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300', dot: 'bg-amber-500' },
  upcoming: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300', dot: 'bg-emerald-500' },
};

function getBucket(dateStr, todayStr) {
  const today = new Date(todayStr);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dateStr);
  if (d < today) return 'overdue';
  if (d < tomorrow) return 'today';
  return 'upcoming';
}

export default function FollowUpsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('nextFollowUpDate');
  const [sortDir, setSortDir] = useState('asc');
  const [addOpen, setAddOpen] = useState(false);

  // Add follow-up inline
  const [addingFollowUpFor, setAddingFollowUpFor] = useState(null);
  const [fuForm, setFuForm] = useState({ details: '', nextFollowUpDate: '', nextFollowUpDetails: '', followUpType: 'FollowUp' });
  const [fuSubmitting, setFuSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await followupsService.inbox(days);
      setData(r);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;
    if (typeFilter) items = items.filter((it) => it.followUpType === typeFilter);
    if (statusFilter) items = items.filter((it) => it.status === statusFilter);
    if (bucketFilter) items = items.filter((it) => getBucket(it.nextFollowUpDate, data.today) === bucketFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((it) =>
        it.customerName.toLowerCase().includes(q) ||
        it.phone.toLowerCase().includes(q) ||
        (it.fileNumber || '').toLowerCase().includes(q) ||
        (it.bankName || '').toLowerCase().includes(q)
      );
    }
    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    items = [...items].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === 'nextFollowUpDate' || sortCol === 'createdAt') {
        va = new Date(va || 0).getTime();
        vb = new Date(vb || 0).getTime();
      } else if (sortCol === 'loanAmount' || sortCol === 'srNo' || sortCol === 'totalFollowUps') {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else {
        va = String(va || '').toLowerCase();
        vb = String(vb || '').toLowerCase();
      }
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    return items;
  }, [data, typeFilter, statusFilter, bucketFilter, search, sortCol, sortDir]);

  const counts = useMemo(() => {
    if (!data?.items) return { overdue: 0, today: 0, upcoming: 0 };
    const c = { overdue: 0, today: 0, upcoming: 0 };
    for (const it of data.items) {
      c[getBucket(it.nextFollowUpDate, data.today)]++;
    }
    return c;
  }, [data]);

  const statuses = useMemo(() => {
    if (!data?.items) return [];
    return [...new Set(data.items.map((it) => it.status))].filter(Boolean).sort();
  }, [data]);

  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <span className="ml-0.5 text-slate-300">↕</span>;
    return <span className="ml-0.5 text-brand">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  async function handleAddFollowUp(caseId) {
    if (!fuForm.details.trim()) return;
    setFuSubmitting(true);
    try {
      await casesService.addFollowUp(caseId, {
        details: fuForm.details,
        nextFollowUpDate: fuForm.nextFollowUpDate || undefined,
        nextFollowUpDetails: fuForm.nextFollowUpDetails || undefined,
        followUpType: fuForm.followUpType,
      });
      setAddingFollowUpFor(null);
      setFuForm({ details: '', nextFollowUpDate: '', nextFollowUpDetails: '', followUpType: 'FollowUp' });
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to add follow-up');
    } finally {
      setFuSubmitting(false);
    }
  }

  function exportCSV() {
    if (!filteredItems.length) return;
    const headers = ['Sr No', 'File No', 'Customer', 'Phone', 'Bank', 'Channel', 'Product', 'Loan Amount', 'Status', 'Handler', 'Type', 'Follow-Up Date', 'Details', 'Next Details', 'Bucket'];
    const rows = filteredItems.map((it) => [
      it.srNo, it.fileNumber, it.customerName, it.phone, it.bankName, it.channelName,
      it.product, (it.loanAmount / 100).toFixed(0), it.status, it.handler, it.followUpType,
      formatDate(it.nextFollowUpDate), it.nextFollowUpDetails, it.lastDetails,
      getBucket(it.nextFollowUpDate, data.today),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `followups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Follow-Ups Sheet</h1>
          <p className="text-xs text-slate-500">All upcoming and overdue follow-ups in Excel format</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            + Add Query
          </button>
          <button
            onClick={exportCSV}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
          >
            <option value={3}>Next 3 days</option>
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
            <option value={60}>Next 60 days</option>
          </select>
        </div>
      </div>

      {/* Summary Buckets */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2">
        {['overdue', 'today', 'upcoming'].map((b) => {
          const col = BUCKET_COLORS[b];
          const active = bucketFilter === b;
          return (
            <button
              key={b}
              onClick={() => setBucketFilter(active ? '' : b)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${active ? `${col.bg} ${col.text} ring-1 ${col.ring}` : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${col.dot}`} />
              {BUCKET_LABELS[b]} <span className="font-bold">{counts[b]}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name, phone, file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
            <option value="">All Types</option>
            {FOLLOWUP_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
            <option value="">All Statuses</option>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-slate-500">{filteredItems.length} rows</span>
        </div>
      </div>

      {error && <div className="mx-5 mt-2 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      {/* Sheet Table */}
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr className="border-b border-slate-300 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <th className="w-8 border-r border-slate-200 px-2 py-2 text-center">#</th>
              <ThSort col="srNo" label="Sr" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="fileNumber" label="File No" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="customerName" label="Customer" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="phone" label="Phone" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="bankName" label="Bank" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="product" label="Product" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="loanAmount" label="Loan Amt" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="status" label="Status" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="handler" label="Handler" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="followUpType" label="Type" current={sortCol} dir={sortDir} onClick={handleSort} />
              <ThSort col="nextFollowUpDate" label="Follow-Up Date" current={sortCol} dir={sortDir} onClick={handleSort} />
              <th className="border-r border-slate-200 px-2 py-2">Details / Notes</th>
              <ThSort col="totalFollowUps" label="# F/U" current={sortCol} dir={sortDir} onClick={handleSort} />
              <th className="px-2 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={15} className="py-8 text-center text-slate-500">Loading…</td></tr>
            )}
            {!loading && filteredItems.length === 0 && (
              <tr><td colSpan={15} className="py-8 text-center text-slate-500">No follow-ups found for the selected period.</td></tr>
            )}
            {!loading && filteredItems.map((it, idx) => {
              const bucket = getBucket(it.nextFollowUpDate, data.today);
              const bCol = BUCKET_COLORS[bucket];
              const sc = STATUS_COLORS[it.status] || { bg: '#e5e7eb', fg: '#374151' };
              const isAddingFU = addingFollowUpFor === it.caseId;

              return (
                <tr key={it.caseId} className={`border-b border-slate-200 hover:bg-slate-50 ${bucket === 'overdue' ? 'bg-red-50/40' : bucket === 'today' ? 'bg-amber-50/40' : ''}`}>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center text-slate-400">{idx + 1}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 font-mono text-slate-500">{it.srNo}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-slate-600">{it.fileNumber || '—'}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 font-medium text-slate-800">{it.customerName}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-slate-600">{it.phone}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-slate-600">{it.bankName || '—'}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-slate-600">{it.product || '—'}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-right tabular-nums text-slate-700">{it.loanAmount ? formatINR(it.loanAmount) : '—'}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5">
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: sc.bg, color: sc.fg }}>
                      {it.status}
                    </span>
                  </td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-slate-600">{it.handler || '—'}</td>
                  <td className="border-r border-slate-200 px-2 py-1.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      it.followUpType === 'Login' ? 'bg-cyan-100 text-cyan-700' :
                      it.followUpType === 'Disbursement' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {it.followUpType}
                    </span>
                  </td>
                  <td className="border-r border-slate-200 px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${bCol.dot}`} />
                      <span className={`font-semibold ${bCol.text}`}>{formatDate(it.nextFollowUpDate)}</span>
                    </div>
                  </td>
                  <td className="border-r border-slate-200 px-2 py-1.5 max-w-[220px]">
                    {it.nextFollowUpDetails && (
                      <div className="truncate text-slate-700" title={it.nextFollowUpDetails}>{it.nextFollowUpDetails}</div>
                    )}
                    {it.lastDetails && (
                      <div className="truncate text-[10px] italic text-slate-400" title={it.lastDetails}>prev: {it.lastDetails}</div>
                    )}
                  </td>
                  <td className="border-r border-slate-200 px-2 py-1.5 text-center tabular-nums text-slate-500">{it.totalFollowUps}</td>
                  <td className="px-2 py-1.5 text-center">
                    {!isAddingFU ? (
                      <button
                        onClick={() => { setAddingFollowUpFor(it.caseId); setFuForm({ details: '', nextFollowUpDate: '', nextFollowUpDetails: '', followUpType: 'FollowUp' }); }}
                        className="rounded border border-brand/30 px-2 py-0.5 text-[10px] font-semibold text-brand hover:bg-brand/5"
                      >
                        + Follow-Up
                      </button>
                    ) : (
                      <div className="text-left">
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            type="text"
                            placeholder="Details *"
                            value={fuForm.details}
                            onChange={(e) => setFuForm((f) => ({ ...f, details: e.target.value }))}
                            className="w-28 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] focus:border-brand focus:outline-none"
                          />
                          <select
                            value={fuForm.followUpType}
                            onChange={(e) => setFuForm((f) => ({ ...f, followUpType: e.target.value }))}
                            className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[11px]"
                          >
                            {FOLLOWUP_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            type="date"
                            value={fuForm.nextFollowUpDate}
                            onChange={(e) => setFuForm((f) => ({ ...f, nextFollowUpDate: e.target.value }))}
                            className="rounded border border-slate-300 px-1 py-0.5 text-[11px]"
                          />
                          <input
                            type="text"
                            placeholder="Next note"
                            value={fuForm.nextFollowUpDetails}
                            onChange={(e) => setFuForm((f) => ({ ...f, nextFollowUpDetails: e.target.value }))}
                            className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] focus:border-brand focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            disabled={fuSubmitting}
                            onClick={() => handleAddFollowUp(it.caseId)}
                            className="rounded bg-brand px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                          >
                            {fuSubmitting ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setAddingFollowUpFor(null)}
                            className="rounded border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Case Modal */}
      <AddCaseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => { setAddOpen(false); load(); }}
      />
    </div>
  );
}

function ThSort({ col, label, current, dir, onClick }) {
  const active = current === col;
  return (
    <th
      onClick={() => onClick(col)}
      className="cursor-pointer select-none border-r border-slate-200 px-2 py-2 hover:bg-slate-200"
    >
      {label}
      {active ? (
        <span className="ml-0.5 text-brand">{dir === 'asc' ? '↑' : '↓'}</span>
      ) : (
        <span className="ml-0.5 text-slate-300">↕</span>
      )}
    </th>
  );
}
