import { useEffect, useMemo, useState } from 'react';
import SimpleTable from '../components/common/SimpleTable.jsx';
import { insuranceService } from '../services/dashboard.service.js';
import { formatINR, formatDate, rupeesToPaisa, paisaToRupees, toDateInput } from '../utils/format.js';

const STATUS_COLORS = {
  Lead:      'bg-slate-100 text-slate-700',
  Quoted:    'bg-blue-50 text-blue-700',
  Active:    'bg-emerald-50 text-emerald-700',
  Lapsed:    'bg-amber-50 text-amber-700',
  Cancelled: 'bg-red-50 text-red-700',
};

export default function InsurancePage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ types: [], statuses: [] });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [renewalSoon, setRenewalSoon] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | doc
  const [error, setError] = useState(null);

  async function fetchRows() {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (renewalSoon) params.renewalSoon = 'true';
      if (search) params.search = search;
      const r = await insuranceService.list(params);
      setRows(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    insuranceService.meta().then(setMeta);
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchRows, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType, renewalSoon, search]);

  async function handleDelete(r) {
    if (!confirm(`Delete policy for ${r.customerName}?`)) return;
    await insuranceService.remove(r._id);
    fetchRows();
  }

  const totals = useMemo(() => {
    const sum = rows.reduce(
      (a, r) => ({
        premium: a.premium + (r.premium || 0),
        commission: a.commission + (r.commission || 0),
        sumAssured: a.sumAssured + (r.sumAssured || 0),
      }),
      { premium: 0, commission: 0, sumAssured: 0 }
    );
    return sum;
  }, [rows]);

  const columns = [
    { key: 'customerName', label: 'Customer', cellClass: 'font-medium' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'type',
      label: 'Type',
      render: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {r.type}
        </span>
      ),
    },
    { key: 'insurer', label: 'Insurer' },
    { key: 'policyNumber', label: 'Policy #', cellClass: 'font-mono text-xs' },
    {
      key: 'sumAssured',
      label: 'Sum Assured',
      cellClass: 'text-right tabular-nums',
      render: (r) => formatINR(r.sumAssured),
    },
    {
      key: 'premium',
      label: 'Premium',
      cellClass: 'text-right tabular-nums',
      render: (r) => formatINR(r.premium),
    },
    {
      key: 'commission',
      label: 'Comm.',
      cellClass: 'text-right tabular-nums text-emerald-700',
      render: (r) => formatINR(r.commission),
    },
    {
      key: 'renewalDate',
      label: 'Renewal',
      render: (r) => (r.renewalDate ? formatDate(r.renewalDate) : '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(r)}
            className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(r)}
            className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Insurance</h1>
            <p className="text-sm text-slate-500">Cross-sell policies, track renewals & commissions</p>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Add Policy
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search name / phone / policy #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {meta.statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All types</option>
            {meta.types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={renewalSoon}
              onChange={(e) => setRenewalSoon(e.target.checked)}
            />
            Renewal in 30 days
          </label>
          <div className="ml-auto flex gap-3 text-xs text-slate-600">
            <span>Premium: <strong className="text-slate-800">{formatINR(totals.premium)}</strong></span>
            <span>Commission: <strong className="text-emerald-700">{formatINR(totals.commission)}</strong></span>
          </div>
        </div>

        {error && <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <SimpleTable columns={columns} rows={rows} loading={loading} empty="No policies yet." />

        {editing && (
          <PolicyModal
            initial={editing === 'new' ? null : editing}
            meta={meta}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              fetchRows();
            }}
          />
        )}
      </div>
    </div>
  );
}

function PolicyModal({ initial, meta, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    customerName: initial?.customerName || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    type: initial?.type || meta.types[0] || 'Life',
    insurer: initial?.insurer || '',
    policyNumber: initial?.policyNumber || '',
    sumAssured: paisaToRupees(initial?.sumAssured) || '',
    premium: paisaToRupees(initial?.premium) || '',
    commission: paisaToRupees(initial?.commission) || '',
    startDate: initial?.startDate ? toDateInput(initial.startDate) : '',
    renewalDate: initial?.renewalDate ? toDateInput(initial.renewalDate) : '',
    status: initial?.status || meta.statuses[0] || 'Lead',
    notes: initial?.notes || '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        email: form.email || undefined,
        type: form.type,
        insurer: form.insurer,
        policyNumber: form.policyNumber,
        sumAssured: rupeesToPaisa(parseFloat(form.sumAssured) || 0),
        premium: rupeesToPaisa(parseFloat(form.premium) || 0),
        commission: rupeesToPaisa(parseFloat(form.commission) || 0),
        startDate: form.startDate || undefined,
        renewalDate: form.renewalDate || undefined,
        status: form.status,
        notes: form.notes,
      };
      if (initial?._id) {
        await insuranceService.update(initial._id, payload);
      } else {
        await insuranceService.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {initial ? 'Edit Policy' : 'Add Policy'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Customer Name *" required value={form.customerName} onChange={set('customerName')} />
          <Input label="Phone *" required value={form.phone} onChange={set('phone')} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} />
          <Select label="Type" value={form.type} onChange={set('type')} options={meta.types} />
          <Input label="Insurer" value={form.insurer} onChange={set('insurer')} />
          <Input label="Policy Number" value={form.policyNumber} onChange={set('policyNumber')} />
          <Input label="Sum Assured (₹)" type="number" step="0.01" value={form.sumAssured} onChange={set('sumAssured')} />
          <Input label="Premium (₹)" type="number" step="0.01" value={form.premium} onChange={set('premium')} />
          <Input label="Commission (₹)" type="number" step="0.01" value={form.commission} onChange={set('commission')} />
          <Select label="Status" value={form.status} onChange={set('status')} options={meta.statuses} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
          <Input label="Renewal Date" type="date" value={form.renewalDate} onChange={set('renewalDate')} />
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={set('notes')}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        {...props}
        className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />
    </label>
  );
}

function Select({ label, options = [], ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        {...props}
        className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
