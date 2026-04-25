import { useEffect, useState, Fragment } from 'react';
import { disbursementTrackerService } from '../services/disbursementTracker.service.js';
import { formatINR, formatDate, paisaToRupees, rupeesToPaisa } from '../utils/format.js';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DisbursementTrackersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await disbursementTrackerService.list({ search: search || undefined });
      setItems(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleAdd() {
    setEditingItem(null);
    setIsModalOpen(true);
  }

  function handleEdit(item) {
    setEditingItem(item);
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await disbursementTrackerService.remove(id);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed');
    }
  }

  return (
    <div className="h-full overflow-auto p-6 bg-slate-50">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Disbursement Trackers</h1>
            <p className="text-slate-500 mt-1">Manage customer disbursements and part payments</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all active:scale-95"
          >
            <PlusIcon className="h-5 w-5" />
            New Entry
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <button onClick={load} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
            Search
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/50">
                <tr className="text-slate-600 font-semibold">
                  <TH>Sr</TH>
                  <TH>Customer</TH>
                  <TH>Mobile</TH>
                  <TH align="right">Loan Amt</TH>
                  <TH align="right">Sale Deed</TH>
                  <TH align="right">OCR</TH>
                  <TH align="right">Parallel Funding</TH>
                  <TH align="right">Insurance</TH>
                  <TH align="right">Proc. Fee</TH>
                  <TH>Full Disb.</TH>
                  <TH>Part Payments</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={12} className="p-8 text-center text-slate-500">Loading records...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={12} className="p-8 text-center text-slate-500">No records found. Click "New Entry" to get started.</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors group">
                      <TD className="font-mono text-slate-400 group-hover:text-indigo-600">#{item.srNo}</TD>
                      <TD className="font-bold text-slate-900">{item.customerName}</TD>
                      <TD className="text-slate-600">{item.mobileNumber}</TD>
                      <TD align="right" className="tabular-nums text-slate-700">{formatINR(item.loanAmount)}</TD>
                      <TD align="right" className="tabular-nums text-slate-700">{formatINR(item.saleDeedAmount)}</TD>
                      <TD align="right" className="tabular-nums text-slate-700">{formatINR(item.ocrAmount)}</TD>
                      <TD align="right" className="tabular-nums text-slate-700">{formatINR(item.parallelFundingAmount)}</TD>
                      <TD align="right" className="tabular-nums text-slate-700">{formatINR(item.insuranceAmount)}</TD>
                      <TD align="right" className="tabular-nums text-slate-700">{formatINR(item.processingFeeAmount)}</TD>
                      <TD>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${item.isFullDisbursed ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'}`}>
                          {item.isFullDisbursed ? 'Yes' : 'No'}
                        </span>
                      </TD>
                      <TD>
                        <div className="flex flex-col gap-1 max-h-20 overflow-y-auto scrollbar-hide">
                          {(item.partPayments || []).map((pp, i) => (
                            <div key={i} className="text-[10px] text-slate-500 whitespace-nowrap bg-slate-100 rounded px-1.5 py-0.5">
                              {formatDate(pp.date)}: <span className="font-semibold text-slate-700">{formatINR(pp.amount)}</span>
                            </div>
                          ))}
                          {(item.partPayments || []).length === 0 && <span className="text-slate-300 italic">None</span>}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </TD>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <EntryModal
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function EntryModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    customerName: item?.customerName || '',
    mobileNumber: item?.mobileNumber || '',
    loanAmount: item ? paisaToRupees(item.loanAmount) : '',
    saleDeedAmount: item ? paisaToRupees(item.saleDeedAmount) : '',
    ocrAmount: item ? paisaToRupees(item.ocrAmount) : '',
    parallelFundingAmount: item ? paisaToRupees(item.parallelFundingAmount) : '',
    insuranceAmount: item ? paisaToRupees(item.insuranceAmount) : '',
    processingFeeAmount: item ? paisaToRupees(item.processingFeeAmount) : '',
    isFullDisbursed: item?.isFullDisbursed || false,
    partPayments: (item?.partPayments || []).map(p => ({
      amount: paisaToRupees(p.amount),
      date: p.date ? new Date(p.date).toISOString().split('T')[0] : ''
    }))
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        loanAmount: rupeesToPaisa(form.loanAmount),
        saleDeedAmount: rupeesToPaisa(form.saleDeedAmount),
        ocrAmount: rupeesToPaisa(form.ocrAmount),
        parallelFundingAmount: rupeesToPaisa(form.parallelFundingAmount),
        insuranceAmount: rupeesToPaisa(form.insuranceAmount),
        processingFeeAmount: rupeesToPaisa(form.processingFeeAmount),
        partPayments: form.partPayments.filter(p => p.amount && p.date).map(p => ({
          amount: rupeesToPaisa(p.amount),
          date: new Date(p.date)
        }))
      };

      if (item) {
        await disbursementTrackerService.update(item._id, payload);
      } else {
        await disbursementTrackerService.create(payload);
      }
      onSuccess();
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  function addPartPayment() {
    setForm(f => ({
      ...f,
      partPayments: [...f.partPayments, { amount: '', date: new Date().toISOString().split('T')[0] }]
    }));
  }

  function removePartPayment(index) {
    setForm(f => ({
      ...f,
      partPayments: f.partPayments.filter((_, i) => i !== index)
    }));
  }

  function updatePartPayment(index, field, value) {
    setForm(f => {
      const newList = [...f.partPayments];
      newList[index] = { ...newList[index], [field]: value };
      return { ...f, partPayments: newList };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{item ? 'Edit Entry' : 'New Disbursement Entry'}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-all">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex-1 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
          {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Customer Name" required>
              <input
                required
                type="text"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                className="Input"
                placeholder="Full Name"
              />
            </FormField>
            <FormField label="Mobile Number" required>
              <input
                required
                type="text"
                value={form.mobileNumber}
                onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                className="Input"
                placeholder="10-digit number"
              />
            </FormField>
            <FormField label="Loan Amount">
              <input
                type="number"
                value={form.loanAmount}
                onChange={e => setForm({ ...form, loanAmount: e.target.value })}
                className="Input"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Sale Deed Amount">
              <input
                type="number"
                value={form.saleDeedAmount}
                onChange={e => setForm({ ...form, saleDeedAmount: e.target.value })}
                className="Input"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="OCR Amount">
              <input
                type="number"
                value={form.ocrAmount}
                onChange={e => setForm({ ...form, ocrAmount: e.target.value })}
                className="Input"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Parallel Funding Amount">
              <input
                type="number"
                value={form.parallelFundingAmount}
                onChange={e => setForm({ ...form, parallelFundingAmount: e.target.value })}
                className="Input"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Insurance Amount">
              <input
                type="number"
                value={form.insuranceAmount}
                onChange={e => setForm({ ...form, insuranceAmount: e.target.value })}
                className="Input"
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Processing Fee Amount">
              <input
                type="number"
                value={form.processingFeeAmount}
                onChange={e => setForm({ ...form, processingFeeAmount: e.target.value })}
                className="Input"
                placeholder="0.00"
              />
            </FormField>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Part Payment Details</h3>
              <button
                type="button"
                onClick={addPartPayment}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                <PlusIcon className="h-4 w-4" /> Add Payment
              </button>
            </div>
            
            <div className="space-y-3">
              {form.partPayments.map((pp, i) => (
                <div key={i} className="group flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:border-slate-200">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <FormField label="Amount">
                      <input
                        type="number"
                        value={pp.amount}
                        onChange={e => updatePartPayment(i, 'amount', e.target.value)}
                        className="Input bg-white"
                        placeholder="0.00"
                      />
                    </FormField>
                    <FormField label="Date">
                      <input
                        type="date"
                        value={pp.date}
                        onChange={e => updatePartPayment(i, 'date', e.target.value)}
                        className="Input bg-white"
                      />
                    </FormField>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePartPayment(i)}
                    className="mt-6 p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {form.partPayments.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm italic">
                  No part payments added yet.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-6 pb-2">
            <input
              id="fullDisbursed"
              type="checkbox"
              checked={form.isFullDisbursed}
              onChange={e => setForm({ ...form, isFullDisbursed: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="fullDisbursed" className="text-sm font-semibold text-slate-700 cursor-pointer">
              FULL Disbursed - Yes / NO
            </label>
          </div>
        </form>

        <div className="border-t border-slate-100 bg-slate-50 p-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Saving...' : item ? 'Update Records' : 'Create Entry'}
          </button>
        </div>
      </div>

      <style>{`
        .FormField { display: flex; flex-direction: column; gap: 0.375rem; }
        .Input { width: 100%; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 0.625rem 1rem; font-size: 0.875rem; transition: all 0.2s; background: white; }
        .Input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
      `}</style>
    </div>
  );
}

function FormField({ label, children, required }) {
  return (
    <div className="FormField">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function TH({ children, align }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function TD({ children, className = '', align }) {
  return <td className={`px-4 py-4 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</td>;
}
