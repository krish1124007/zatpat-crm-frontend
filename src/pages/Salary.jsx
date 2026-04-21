import { useEffect, useState } from 'react';
import SimpleTable from '../components/common/SimpleTable.jsx';
import { salaryService } from '../services/finance.service.js';
import { formatINR, paisaToRupees, rupeesToPaisa } from '../utils/format.js';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function SalaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null | salary doc | 'new'
  const [error, setError] = useState(null);

  async function fetchRows() {
    setLoading(true);
    try {
      const r = await salaryService.list({ month, year });
      setRows(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load salaries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    salaryService.employees().then((r) => setEmployees(r.items));
  }, []);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  async function handleDelete(r) {
    if (!confirm(`Delete ${r.employee?.name}'s salary for ${MONTHS[r.month - 1]} ${r.year}?`)) return;
    await salaryService.remove(r._id);
    fetchRows();
  }

  const totalNet = rows.reduce((a, r) => a + (r.netPay || 0), 0);
  const totalIncentives = rows.reduce((a, r) => a + (r.incentiveAmount || 0), 0);

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      cellClass: 'font-medium',
      render: (r) => r.employee?.name || '—',
    },
    { key: 'role', label: 'Role', render: (r) => r.employee?.role || '—' },
    { key: 'basicSalary', label: 'Basic', cellClass: 'text-right tabular-nums', render: (r) => formatINR(r.basicSalary) },
    { key: 'allowances', label: 'Allowances', cellClass: 'text-right tabular-nums', render: (r) => formatINR(r.allowances) },
    {
      key: 'incentiveAmount',
      label: 'Incentive',
      cellClass: 'text-right tabular-nums text-emerald-700',
      render: (r) => formatINR(r.incentiveAmount),
    },
    {
      key: 'deductions',
      label: 'Deductions',
      cellClass: 'text-right tabular-nums text-red-600',
      render: (r) => formatINR(r.deductions),
    },
    {
      key: 'netPay',
      label: 'Net Pay',
      cellClass: 'text-right tabular-nums font-bold',
      render: (r) => formatINR(r.netPay),
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
            <h1 className="text-2xl font-bold text-slate-800">Salary</h1>
            <p className="text-sm text-slate-500">Monthly payroll with auto-incentive suggestions</p>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Add / Update Salary
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
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
          <div className="ml-auto flex gap-4 text-sm text-slate-600">
            <span>
              Incentives: <span className="font-semibold text-emerald-700">{formatINR(totalIncentives)}</span>
            </span>
            <span>
              Net Payroll: <span className="font-semibold text-slate-800">{formatINR(totalNet)}</span>
            </span>
          </div>
        </div>

        {error && <div className="mb-2 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <SimpleTable columns={columns} rows={rows} loading={loading} empty="No salary records for this month." />

        {editing && (
          <SalaryModal
            initial={editing === 'new' ? null : editing}
            employees={employees}
            month={month}
            year={year}
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

function SalaryModal({ initial, employees, month, year, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    employee: initial?.employee?._id || '',
    month: initial?.month || month,
    year: initial?.year || year,
    basicSalary: paisaToRupees(initial?.basicSalary) || '',
    allowances: paisaToRupees(initial?.allowances) || '',
    deductions: paisaToRupees(initial?.deductions) || '',
    incentiveAmount: paisaToRupees(initial?.incentiveAmount) || '',
    incentiveDetails: initial?.incentiveDetails || '',
    paymentMode: initial?.paymentMode || 'Bank',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function suggestIncentive() {
    if (!form.employee) return;
    const r = await salaryService.suggestIncentive({
      employee: form.employee,
      month: form.month,
      year: form.year,
    });
    setSuggestion(r);
  }

  function applySuggestion() {
    if (!suggestion) return;
    setForm((f) => ({
      ...f,
      incentiveAmount: paisaToRupees(suggestion.suggestedIncentivePaisa),
      incentiveDetails: `Auto: ${suggestion.disbursedCount} disbursed cases this month`,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await salaryService.upsert({
        employee: form.employee,
        month: parseInt(form.month, 10),
        year: parseInt(form.year, 10),
        basicSalary: rupeesToPaisa(parseFloat(form.basicSalary) || 0),
        allowances: rupeesToPaisa(parseFloat(form.allowances) || 0),
        deductions: rupeesToPaisa(parseFloat(form.deductions) || 0),
        incentiveAmount: rupeesToPaisa(parseFloat(form.incentiveAmount) || 0),
        incentiveDetails: form.incentiveDetails,
        paymentMode: form.paymentMode,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {initial ? 'Edit Salary' : 'Add / Update Salary'}
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
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Employee *</span>
            <select
              required
              value={form.employee}
              onChange={set('employee')}
              disabled={!!initial}
              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:bg-slate-100"
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </select>
          </label>

          <Input label="Basic Salary (₹)" type="number" step="0.01" value={form.basicSalary} onChange={set('basicSalary')} />
          <Input label="Allowances (₹)" type="number" step="0.01" value={form.allowances} onChange={set('allowances')} />
          <Input label="Deductions (₹)" type="number" step="0.01" value={form.deductions} onChange={set('deductions')} />
          <Input label="Incentive (₹)" type="number" step="0.01" value={form.incentiveAmount} onChange={set('incentiveAmount')} />

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Incentive Details</span>
            <input
              type="text"
              value={form.incentiveDetails}
              onChange={set('incentiveDetails')}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">
              Auto-suggest incentive based on disbursed cases this month
            </span>
            <button
              type="button"
              onClick={suggestIncentive}
              disabled={!form.employee}
              className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs hover:bg-slate-100 disabled:opacity-50"
            >
              Calculate
            </button>
          </div>
          {suggestion && (
            <div className="mt-2 flex items-center justify-between rounded bg-white p-2">
              <span>
                <strong>{suggestion.disbursedCount}</strong> disbursed cases →{' '}
                <strong>{formatINR(suggestion.suggestedIncentivePaisa)}</strong>
              </span>
              <button
                type="button"
                onClick={applySuggestion}
                className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Apply
              </button>
            </div>
          )}
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
