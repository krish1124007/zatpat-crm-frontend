import { useEffect, useState } from 'react';
import SimpleTable from '../components/common/SimpleTable.jsx';
import { invoicesService, partnersService } from '../services/finance.service.js';
import { casesService } from '../services/cases.service.js';
import { formatINR, formatDate, rupeesToPaisa } from '../utils/format.js';

const STATUS_COLORS = {
  Pending:   'bg-amber-50 text-amber-700',
  Paid:      'bg-emerald-50 text-emerald-700',
  Cancelled: 'bg-slate-100 text-slate-500',
};

export default function InvoicesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState(null);

  async function fetchRows() {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const r = await invoicesService.list(params);
      setRows(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function markPaid(inv) {
    await invoicesService.update(inv._id, {
      status: 'Paid',
      payment: { paidDate: new Date().toISOString(), mode: 'Bank' },
    });
    fetchRows();
  }

  async function handleDelete(inv) {
    if (!confirm(`Delete invoice ${inv.invoiceNo}?`)) return;
    await invoicesService.remove(inv._id);
    fetchRows();
  }

  const columns = [
    { key: 'invoiceNo', label: 'Invoice #', cellClass: 'font-mono font-medium text-slate-800' },
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    {
      key: 'partner',
      label: 'Partner',
      render: (r) => r.partner?.name || r.snapshot?.partnerName || '—',
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (r) =>
        r.snapshot?.customerName ? (
          <span>
            {r.snapshot.customerName}
            <span className="ml-1 text-xs text-slate-400">#{r.loanCase?.srNo}</span>
          </span>
        ) : '—',
    },
    { key: 'amount', label: 'Amount', cellClass: 'text-right tabular-nums', render: (r) => formatINR(r.amount) },
    {
      key: 'gst',
      label: 'GST',
      cellClass: 'text-right tabular-nums text-slate-500',
      render: (r) => `${r.gstRate}% · ${formatINR(r.gstAmount)}`,
    },
    {
      key: 'total',
      label: 'Total',
      cellClass: 'text-right tabular-nums font-semibold',
      render: (r) => formatINR(r.totalAmount),
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
          <a
            href={invoicesService.pdfUrl(r._id)}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
          >
            PDF
          </a>
          {r.status === 'Pending' && (
            <button
              onClick={() => markPaid(r)}
              className="rounded border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              Mark Paid
            </button>
          )}
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
            <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
            <p className="text-sm text-slate-500">Tax invoices to partners with GST + PDF export</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Create Invoice
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Paid</option>
            <option>Cancelled</option>
          </select>
          <span className="text-xs text-slate-500">{rows.length} invoice(s)</span>
        </div>

        {error && <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <SimpleTable columns={columns} rows={rows} loading={loading} empty="No invoices yet." />

        {createOpen && (
          <CreateInvoiceModal onClose={() => setCreateOpen(false)} onCreated={fetchRows} />
        )}
      </div>
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }) {
  const [partners, setPartners] = useState([]);
  const [cases, setCases] = useState([]);
  const [form, setForm] = useState({
    partner: '',
    loanCase: '',
    amount: '',
    gstRate: 18,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([partnersService.list({ active: 'true' }), casesService.list({ status: 'Disbursed' })])
      .then(([p, c]) => {
        setPartners(p.items);
        setCases(c.items);
      })
      .catch((e) => setError(e.response?.data?.error || 'Failed to load data'));
  }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  // Auto-fill amount from selected partner's commission % × selected case's disbursed amount.
  function handleAutoFill() {
    const partner = partners.find((p) => p._id === form.partner);
    const caseObj = cases.find((c) => c._id === form.loanCase);
    if (!partner || !caseObj) return;
    const base = caseObj.disbursedAmount || caseObj.sanctionedAmount || 0;
    const rupees = (base * (partner.commissionPercent || 0)) / 100 / 100;
    setForm((f) => ({ ...f, amount: rupees.toFixed(2) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await invoicesService.create({
        partner: form.partner,
        loanCase: form.loanCase || undefined,
        amount: rupeesToPaisa(parseFloat(form.amount) || 0),
        gstRate: parseFloat(form.gstRate) || 0,
        notes: form.notes,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Create Invoice</h2>
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
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Partner *</span>
            <select
              required
              value={form.partner}
              onChange={set('partner')}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">Select partner…</option>
              {partners.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.commissionPercent || 0}%)
                </option>
              ))}
            </select>
          </label>

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Loan Case (disbursed only)</span>
            <select
              value={form.loanCase}
              onChange={set('loanCase')}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">— none —</option>
              {cases.map((c) => (
                <option key={c._id} value={c._id}>
                  #{c.srNo} · {c.customerName} · {formatINR(c.disbursedAmount)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleAutoFill}
            disabled={!form.partner || !form.loanCase}
            className="col-span-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Auto-fill amount from commission %
          </button>

          <Input label="Amount (₹) *" type="number" step="0.01" value={form.amount} onChange={set('amount')} required />
          <Input label="GST Rate %" type="number" value={form.gstRate} onChange={set('gstRate')} />
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Notes</span>
            <input
              type="text"
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
            {submitting ? 'Creating…' : 'Create Invoice'}
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
