import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { casesService } from '../services/cases.service.js';
import { useCasesRefresh } from '../utils/casesSync.js';
import { formatINR } from '../utils/format.js';
import { STATUS_COLORS, POST_DISBURSEMENT_STAGES, NEW_INQUIRY_STATUSES } from '../utils/constants.js';
import AddCaseModal from '../components/cases/AddCaseModal.jsx';
import CasesDataGrid from '../components/grid/CasesDataGrid.jsx';
import CaseDrawer from '../components/cases/CaseDrawer.jsx';


const statusLabels = {
  'Query': 'Query',
  'Hold': 'Hold',
  'Ready Login': 'Ready Login',
  'Bank finalized': 'Bank finalized',
  'Under Bank Workout': 'Under Bank Workout',
  'Under Login Query': 'Under Login Query',
  'Login done - under process': 'Login done - under process',
  'Sanctioned': 'Sanctioned',
  'Disbursed': 'Disbursed',
  'Rejected': 'Rejected',
  'Cancelled': 'Cancelled',
  'Not interested': 'Not interested',
};

// A "group" is one page that combines several statuses/filters from the old
// sidebar folder. `baseStatus` is the default status set (null = all cases).
// `dimensions` become in-page filter button-rows; a dimension with key 'status'
// overrides baseStatus when a specific option is picked.
const ALL = { label: 'All', value: '' };
const DONE_PENDING = (key, label) => ({
  key, label,
  options: [ALL, { label: 'Done', value: 'Done' }, { label: 'Pending', value: 'Pending' }],
});

const GROUPS = {
  'new-inquiry': { label: 'New Inquiry', baseStatus: ['__EMPTY__'], dimensions: [] },
  active: { label: 'Query', baseStatus: NEW_INQUIRY_STATUSES, dimensions: [] },
  login: {
    label: 'Login',
    baseStatus: ['Under Login Query', 'Login done - under process', 'Sanctioned'],
    dimensions: [
      { key: 'status', label: 'Stage', options: [
        ALL,
        { label: 'Under Login Query', value: 'Under Login Query' },
        { label: 'Login done', value: 'Login done - under process' },
        { label: 'Sanctioned', value: 'Sanctioned' },
      ] },
    ],
  },
  disbursed: {
    label: 'Disbursed',
    baseStatus: ['Disbursed'],
    dimensions: [
      { key: 'disbursementType', label: 'Type', options: [
        ALL, { label: 'Full', value: 'Full' }, { label: 'Part', value: 'Part' },
      ] },
      DONE_PENDING('handoverConfirmation', 'Handover'),
      DONE_PENDING('bankerConfirmation', 'Banker'),
      DONE_PENDING('invoiceStatus', 'Invoice'),
    ],
  },
  invoices: {
    label: 'Invoices',
    baseStatus: null,
    dimensions: [
      { key: 'paymentStatus', label: 'Payment', options: [
        ALL, { label: 'Done', value: 'done' }, { label: 'Pending', value: 'pending' },
      ] },
      { key: 'gstStatus', label: 'GST', options: [
        ALL, { label: 'Done', value: 'Received' }, { label: 'Pending', value: 'Pending' },
      ] },
    ],
  },
  ni: {
    label: 'NI (Closed)',
    baseStatus: ['Rejected', 'Not interested'],
    dimensions: [
      { key: 'status', label: 'Type', options: [
        ALL, { label: 'Rejected', value: 'Rejected' }, { label: 'Not interested', value: 'Not interested' },
      ] },
    ],
  },
};

export default function CasesByStatusPage() {
  const { status } = useParams();
  const group = GROUPS[status];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [handlerFilter, setHandlerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [postDisbStageFilter, setPostDisbStageFilter] = useState('');
  const [editOpen, setEditOpen] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  // Selected value per group filter dimension, e.g. { disbursementType: 'Full' }.
  const [dimValues, setDimValues] = useState({});

  // Reset the in-page filters when switching to a different group/status.
  useEffect(() => { setDimValues({}); }, [status]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 200 };
      if (group) {
        // A 'status' dimension overrides the group's default status set.
        if (dimValues.status) {
          params.status = dimValues.status;
        } else if (group.baseStatus) {
          params.status = group.baseStatus.join(',');
        }
        // Apply the other selected dimensions as filters.
        for (const dim of group.dimensions) {
          if (dim.key === 'status') continue;
          if (dimValues[dim.key]) params[dim.key] = dimValues[dim.key];
        }
      } else {
        params.status = status;
      }
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
  }, [status, bankFilter, handlerFilter, dateFrom, dateTo, postDisbStageFilter, dimValues]);

  // Refresh when a case is changed elsewhere or the tab regains focus. Paused
  // while the edit modal is open.
  useCasesRefresh(load, !editOpen);

  const heading = group ? group.label : (statusLabels[status] || status);
  const showPostDisb = status === 'disbursed';
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

  // Inline edit — fires per cell change. Debounced per row+field, optimistic,
  // rolls back via refetch on failure. Same behaviour as the All Cases grid.
  const editTimers = useRef(new Map());
  function handleCellEdit(id, patch) {
    const key = `${id}:${Object.keys(patch).join(',')}`;
    const prev = editTimers.current.get(key);
    if (prev) clearTimeout(prev);
    const t = setTimeout(async () => {
      editTimers.current.delete(key);
      try {
        const r = await casesService.update(id, patch);
        setRows((rs) => rs.map((row) => (row._id === id ? r.case : row)));
      } catch (err) {
        load();
        alert(err.response?.data?.error || 'Update failed — refreshed from server');
      }
    }, 400);
    editTimers.current.set(key, t);
  }

  async function handleDelete(row) {
    if (!window.confirm('Move this case to Recycle Bin?')) return;
    try {
      await casesService.remove(row._id);
      setRows((rs) => rs.filter((r) => r._id !== row._id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete case');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-6 pt-4">
        <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-3">
          <Link to="/cases" className="text-sm text-brand hover:underline">← All Cases</Link>
          <h1 className="text-2xl font-bold text-slate-800">
            <span
              className="mr-2 inline-block rounded-lg px-3 py-1 text-lg"
              style={{ backgroundColor: sc.bg, color: sc.fg }}
            >
              {heading}
            </span>
          </h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {rows.length} cases
          </span>
        </div>

        {/* In-page filters for this group (the old folder sub-tabs). */}
        {group && group.dimensions.length > 0 && (
          <div className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            {group.dimensions.map((dim) => (
              <div key={dim.key} className="flex flex-wrap items-center gap-1.5">
                <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{dim.label}</span>
                {dim.options.map((opt) => {
                  const active = (dimValues[dim.key] || '') === opt.value;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setDimValues((d) => ({ ...d, [dim.key]: opt.value }))}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

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
          {showPostDisb && (
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

        </div>
      </div>

      {/* Full data grid — same inline editing, row-click drawer, edit & delete
          as the All Cases page. Double-click any cell to edit it in place. */}
      <div className="min-h-0 flex-1 px-6 pb-4">
        <CasesDataGrid
          rows={rows}
          loading={loading}
          quickFilter={search}
          onRowClick={(row) => setSelectedId(row._id)}
          onCellEdit={handleCellEdit}
          onEdit={(row) => setEditOpen(row._id)}
          onDelete={handleDelete}
        />
      </div>

      {selectedId && (
        <CaseDrawer
          caseId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={(updated) =>
            setRows((rs) => rs.map((r) => (r._id === updated._id ? updated : r)))
          }
          onDeleted={(deletedId) => setRows((rs) => rs.filter((r) => r._id !== deletedId))}
          onEditRequest={() => setEditOpen(selectedId)}
        />
      )}

      {editOpen && (
        <AddCaseModal
          open={!!editOpen}
          onClose={() => setEditOpen(null)}
          editData={rows.find((r) => r._id === editOpen)}
          onUpdated={(updated) => {
            setRows((rs) => rs.map((r) => (r._id === updated._id ? updated : r)));
          }}
          defaultChannelName="Zatpat"
        />
      )}
    </div>
  );
}
