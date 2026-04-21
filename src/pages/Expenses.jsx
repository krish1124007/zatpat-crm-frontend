import { useEffect, useMemo, useState } from 'react';
import SimpleTable from '../components/common/SimpleTable.jsx';
import { expensesService } from '../services/finance.service.js';
import { formatINR, formatDate, rupeesToPaisa, toDateInput } from '../utils/format.js';

export default function ExpensesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    date: toDateInput(new Date()),
    category: 'Petrol',
    amount: '',
    description: '',
    paymentType: 'Cash',
  });
  const [submitting, setSubmitting] = useState(false);

  async function fetchRows() {
    setLoading(true);
    try {
      const params = {};
      if (filterCat) params.category = filterCat;
      const r = await expensesService.list(params);
      setRows(r.items);
      setTotalAmount(r.totalAmount);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    expensesService.categories().then((r) => {
      setCategories(r.categories);
      if (r.paymentTypes) setPaymentTypes(r.paymentTypes);
    });
  }, []);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCat]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    try {
      await expensesService.create({
        date: form.date,
        category: form.category,
        amount: rupeesToPaisa(parseFloat(form.amount)),
        description: form.description,
        paymentType: form.paymentType,
      });
      setForm((f) => ({ ...f, amount: '', description: '' }));
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(r) {
    if (!confirm('Delete this expense?')) return;
    await expensesService.remove(r._id);
    fetchRows();
  }

  const breakdown = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      map.set(r.category, (map.get(r.category) || 0) + r.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    {
      key: 'category',
      label: 'Category',
      render: (r) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {r.category}
        </span>
      ),
    },
    { key: 'description', label: 'Description', cellClass: 'text-slate-700' },
    {
      key: 'paymentType',
      label: 'Payment Type',
      render: (r) => (
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700">
          {r.paymentType || 'Cash'}
        </span>
      ),
    },
    {
      key: 'paidBy',
      label: 'Paid By',
      render: (r) => r.paidBy?.name || '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      cellClass: 'text-right tabular-nums font-semibold',
      render: (r) => formatINR(r.amount),
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          onClick={() => handleDelete(r)}
          className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Expenses</h1>
          <p className="text-sm text-slate-500">Daily office and field expenses</p>
        </div>

        <form
          onSubmit={handleAdd}
          className="mb-4 grid grid-cols-7 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Amount (₹)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            required
          />
          <select
            value={form.paymentType}
            onChange={(e) => setForm((f) => ({ ...f, paymentType: e.target.value }))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {(paymentTypes.length > 0 ? paymentTypes : ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Other']).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Adding…' : '+ Add'}
          </button>
        </form>

        <div className="mb-3 flex items-center gap-3">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="ml-auto text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{formatINR(totalAmount)}</span>
          </div>
        </div>

        {error && <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <SimpleTable columns={columns} rows={rows} loading={loading} empty="No expenses recorded." />

        {breakdown.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">By category</div>
            <div className="flex flex-wrap gap-2">
              {breakdown.map(([cat, amt]) => (
                <div
                  key={cat}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                >
                  <div className="font-medium text-slate-600">{cat}</div>
                  <div className="font-bold text-slate-800">{formatINR(amt)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
