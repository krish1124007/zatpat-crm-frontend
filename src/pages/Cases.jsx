import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CasesDataGrid from '../components/grid/CasesDataGrid.jsx';
import CaseDrawer from '../components/cases/CaseDrawer.jsx';
import AddCaseModal from '../components/cases/AddCaseModal.jsx';
import { casesService } from '../services/cases.service.js';
import { CASE_TABS, LOAN_STATUSES } from '../utils/constants.js';
import { exportCasesCSV } from '../utils/csv.js';

export default function CasesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [pendingOnly, setPendingOnly] = useState(searchParams.get('pendingPayment') === 'true');
  const [handlerFilter, setHandlerFilter] = useState(searchParams.get('handledBy') || '');
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(null);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeTab !== 'All') params.channelName = activeTab;
      if (statusFilter) params.status = statusFilter;
      if (pendingOnly) params.pendingPayment = 'true';
      if (handlerFilter) params.handledBy = handlerFilter;
      const r = await casesService.list(params);
      setRows(r.items);
      setTotal(r.total);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, pendingOnly, handlerFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Inline edit handler — fires per cell change. Optimistic; rolls back on failure.
  const editTimers = useRef(new Map());
  const handleCellEdit = useCallback(
    (id, patch, params) => {
      // Debounce per row by 400ms so rapid edits coalesce.
      const key = `${id}:${Object.keys(patch).join(',')}`;
      const prev = editTimers.current.get(key);
      if (prev) clearTimeout(prev);
      const t = setTimeout(async () => {
        editTimers.current.delete(key);
        try {
          const r = await casesService.update(id, patch);
          // Replace the row in local state with server-authoritative data
          // (so derived fields like pendingPaymentAmount update visibly).
          setRows((rs) => rs.map((row) => (row._id === id ? r.case : row)));
        } catch (err) {
          // Rollback: refetch
          fetchRows();
          alert(err.response?.data?.error || 'Update failed — refreshed from server');
        }
      }, 400);
      editTimers.current.set(key, t);
    },
    [fetchRows]
  );

  const handleCreated = (newCase) => {
    setRows((rs) => [newCase, ...rs]);
    setTotal((t) => t + 1);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <input
          type="text"
          placeholder="🔍  Quick search (name, phone, app id)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          {LOAN_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
          />
          Pending payment only
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {loading ? 'Loading…' : `${total} case${total === 1 ? '' : 's'}`}
          </span>
          <button
            onClick={fetchRows}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
          <button
            onClick={() => exportCasesCSV(rows)}
            disabled={rows.length === 0}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="Download visible rows as CSV"
          >
            ⬇ CSV
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            🖨 Print
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            + Add Case
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <CasesDataGrid
          rows={rows}
          loading={loading}
          quickFilter={search}
          onRowClick={(row) => setSelectedId(row._id)}
          onCellEdit={handleCellEdit}
          onDelete={async (row) => {
            if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
              try {
                await casesService.remove(row._id);
                setRows((rs) => rs.filter((r) => r._id !== row._id));
                setTotal((t) => t - 1);
              } catch (err) {
                alert(err.response?.data?.error || 'Failed to delete case');
              }
            }
          }}
          onEdit={(row) => {
            setEditOpen(row._id);
          }}
        />
      </div>

      {/* Bottom sheet tabs (channelName) */}
      <div className="flex items-center gap-1 border-t border-slate-200 bg-slate-100 px-2 py-1">
        {CASE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-t-md px-3 py-1 text-xs font-medium transition ${
              activeTab === t.key
                ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto pr-2 text-[10px] text-slate-500">
          Tip: click a row to open details · double-click a cell to edit
        </div>
      </div>

      {/* Drawer */}
      {selectedId && (
        <CaseDrawer
          caseId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={(updated) =>
            setRows((rs) => rs.map((r) => (r._id === updated._id ? updated : r)))
          }
          onDeleted={(deletedId) => {
            setRows((rs) => rs.filter((r) => r._id !== deletedId));
            setTotal((t) => t - 1);
          }}
          onEditRequest={() => setEditOpen(selectedId)}
        />
      )}

      {editOpen && (
        <AddCaseModal
          open={!!editOpen}
          onClose={() => setEditOpen(null)}
          editData={rows.find(r => r._id === editOpen)}
          onUpdated={(updated) => {
            setRows((rs) => rs.map((r) => (r._id === updated._id ? updated : r)));
          }}
          defaultChannelName={activeTab !== 'All' ? activeTab : 'Zatpat'}
        />
      )}

      <AddCaseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
        defaultChannelName={activeTab !== 'All' ? activeTab : 'Zatpat'}
      />
    </div>
  );
}
