import { useEffect, useState } from 'react';
import SimpleTable from '../components/common/SimpleTable.jsx';
import { partnersService } from '../services/finance.service.js';

const EMPTY = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstNumber: '',
  commissionPercent: 0,
  bankDetails: { accountName: '', accountNumber: '', ifsc: '', bankName: '' },
  isActive: true,
  notes: '',
};

export default function PartnersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | partner object | 'new'
  const [error, setError] = useState(null);

  async function fetchRows() {
    setLoading(true);
    try {
      const r = await partnersService.list({ search });
      setRows(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(p) {
    if (!confirm(`Delete partner "${p.name}"?`)) return;
    await partnersService.remove(p._id);
    fetchRows();
  }

  const columns = [
    { key: 'name', label: 'Name', cellClass: 'font-medium text-slate-800' },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'gstNumber', label: 'GSTIN' },
    {
      key: 'commissionPercent',
      label: 'Commission',
      cellClass: 'text-right',
      render: (r) => `${r.commissionPercent || 0}%`,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) =>
        r.isActive ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Inactive
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Partners</h1>
            <p className="text-sm text-slate-500">Channel partners and referral partners</p>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Add Partner
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="🔍 Search by name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRows()}
            className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            onClick={fetchRows}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
        </div>

        {error && <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <SimpleTable columns={columns} rows={rows} loading={loading} empty="No partners yet." />

        {editing && (
          <PartnerModal
            initial={editing === 'new' ? EMPTY : editing}
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

function PartnerModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...initial,
    bankDetails: { ...EMPTY.bankDetails, ...(initial.bankDetails || {}) },
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isNew = !initial?._id;

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
  function setBank(field) {
    return (e) =>
      setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, [field]: e.target.value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        commissionPercent: parseFloat(form.commissionPercent) || 0,
      };
      if (isNew) await partnersService.create(payload);
      else await partnersService.update(initial._id, payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isNew ? 'Add Partner' : 'Edit Partner'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Name *" value={form.name} onChange={set('name')} required />
          <Input label="Contact Person" value={form.contactPerson} onChange={set('contactPerson')} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} />
          <Input label="GSTIN" value={form.gstNumber} onChange={set('gstNumber')} />
          <Input
            label="Commission %"
            type="number"
            step="0.01"
            value={form.commissionPercent}
            onChange={set('commissionPercent')}
          />
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Bank details</div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Account Name" value={form.bankDetails.accountName} onChange={setBank('accountName')} />
            <Input label="Account Number" value={form.bankDetails.accountNumber} onChange={setBank('accountNumber')} />
            <Input label="IFSC" value={form.bankDetails.ifsc} onChange={setBank('ifsc')} />
            <Input label="Bank Name" value={form.bankDetails.bankName} onChange={setBank('bankName')} />
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active
        </label>

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
