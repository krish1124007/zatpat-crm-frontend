import { useEffect, useState } from 'react';
import { casesService } from '../../services/cases.service.js';
import { CHANNEL_NAMES, PRODUCTS, PROFESSIONS, LOAN_STATUSES, PROPERTY_TYPES } from '../../utils/constants.js';
import { rupeesToPaisa } from '../../utils/format.js';
import { salaryService } from '../../services/finance.service.js';

export default function AddCaseModal({ open, onClose, onCreated, defaultChannelName = 'Zatpat', editData = null, onUpdated }) {
  const [form, setForm] = useState(() => {
    if (editData) {
      return {
        customerName: editData.customerName || '',
        phone: editData.phone || '',
        email: editData.email || '',
        profession: editData.profession || 'Salaried',
        product: editData.product || 'HL',
        loanAmount: editData.loanAmount ? (editData.loanAmount / 100).toString() : '',
        bankName: editData.bankName || '',
        channelName: editData.channelName || defaultChannelName,
        currentStatus: editData.currentStatus || 'Query',
        fileNumber: editData.fileNumber || '',
        bankUserId: editData.bankUserId || '',
        bankPassword: editData.bankPassword || '',
        propertyType: editData.propertyType || '',
        provisionalBanks: editData.provisionalBanks ? editData.provisionalBanks.join(', ') : '',
        referralId: editData.referralId || '',
        entryDate: editData.entryDate ? new Date(editData.entryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        loginDate: editData.loginDate ? new Date(editData.loginDate).toISOString().split('T')[0] : '',
        sanctionDate: editData.sanctionDate ? new Date(editData.sanctionDate).toISOString().split('T')[0] : '',
        disbursementDate: editData.disbursementDate ? new Date(editData.disbursementDate).toISOString().split('T')[0] : '',
        handoverDate: editData.handoverDate ? new Date(editData.handoverDate).toISOString().split('T')[0] : '',
        referenceName: editData.referenceName || '',
        referencePhone: editData.referencePhone || '',
        referenceDetails: {
          mobileNumber: editData.referenceDetails?.mobileNumber || '',
          bankName: editData.referenceDetails?.bankName || '',
          bankBranch: editData.referenceDetails?.bankBranch || '',
          accountNumber: editData.referenceDetails?.accountNumber || '',
          ifscCode: editData.referenceDetails?.ifscCode || '',
        },
        bankerDetails: {
          name: editData.bankerDetails?.name || '',
          mobileNumber: editData.bankerDetails?.mobileNumber || '',
          emailId: editData.bankerDetails?.emailId || '',
          handoverConfirmation: editData.bankerDetails?.handoverConfirmation || '',
        },
        handledBy: editData.handledBy?._id || editData.handledBy || '',
        saleDeedAmount: editData.saleDeedAmount ? (editData.saleDeedAmount / 100).toString() : '',
        ocrAmount: editData.ocrAmount ? (editData.ocrAmount / 100).toString() : '',
        parallelFundingAmount: editData.parallelFundingAmount ? (editData.parallelFundingAmount / 100).toString() : '',
        isFullDisbursed: editData.isFullDisbursed || false,
        partPayments: (editData.partPayments || []).map(p => ({
          amount: p.amount ? (p.amount / 100).toString() : '',
          date: p.date ? new Date(p.date).toISOString().split('T')[0] : ''
        })),
      };
    }
    return {
      customerName: '',
      phone: '',
      email: '',
      profession: 'Salaried',
      product: 'HL',
      loanAmount: '',
      bankName: '',
      channelName: defaultChannelName,
      currentStatus: 'Query',
      fileNumber: '',
      bankUserId: '',
      bankPassword: '',
      propertyType: '',
      provisionalBanks: '',
      referralId: '',
      entryDate: new Date().toISOString().split('T')[0],
      loginDate: '',
      sanctionDate: '',
      disbursementDate: '',
      handoverDate: '',
      referenceName: '',
      referencePhone: '',
      referenceDetails: {
        mobileNumber: '',
        bankName: '',
        bankBranch: '',
        accountNumber: '',
        ifscCode: '',
      },
      bankerDetails: {
        name: '',
        mobileNumber: '',
        emailId: '',
        handoverConfirmation: '',
      },
      handledBy: '',
      saleDeedAmount: '',
      ocrAmount: '',
      parallelFundingAmount: '',
      isFullDisbursed: false,
      partPayments: [],
    };
  });

  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [channelOptions, setChannelOptions] = useState(CHANNEL_NAMES);
  const [bankOptions, setBankOptions] = useState([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [dropdownLoading, setDropdownLoading] = useState(true);

  useEffect(() => {
    if (open) {
      salaryService.employees().then((r) => setEmployees(r.items));
      loadDropdownOptions();
    }
  }, [open]);

  async function loadDropdownOptions() {
    try {
      setDropdownLoading(true);
      const options = await casesService.getAllDropdownOptions();
      setChannelOptions(options.channelName?.map(o => o.value) || CHANNEL_NAMES);
      setBankOptions(options.bankName?.map(o => o.value) || []);
    } catch (err) {
      console.error('Failed to load dropdown options:', err);
      // Fallback to constants
      setChannelOptions(CHANNEL_NAMES);
      setBankOptions([]);
    } finally {
      setDropdownLoading(false);
    }
  }

  if (!open) return null;

  function field(name) {
    return {
      value: form[name],
      onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  function nestedField(section, field) {
    return {
      value: form[section]?.[field] || '',
      onChange: (e) => setForm((f) => ({
        ...f,
        [section]: { ...f[section], [field]: e.target.value }
      })),
    };
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

  async function handleAddChannel() {
    if (!newChannelName.trim()) {
      setError('Channel name cannot be empty');
      return;
    }
    try {
      await casesService.createDropdownOption('channelName', newChannelName, newChannelName);
      setChannelOptions([...channelOptions, newChannelName]);
      setForm((f) => ({ ...f, channelName: newChannelName }));
      setNewChannelName('');
      setShowAddChannel(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add channel');
    }
  }

  async function handleAddBank() {
    if (!newBankName.trim()) {
      setError('Bank name cannot be empty');
      return;
    }
    try {
      await casesService.createDropdownOption('bankName', newBankName, newBankName);
      setBankOptions([...bankOptions, newBankName]);
      setForm((f) => ({ ...f, bankName: newBankName }));
      setNewBankName('');
      setShowAddBank(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add bank');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        loanAmount: form.loanAmount ? rupeesToPaisa(parseFloat(form.loanAmount)) : 0,
        provisionalBanks: form.provisionalBanks
          ? form.provisionalBanks.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        entryDate: form.entryDate ? new Date(form.entryDate) : new Date(),
        loginDate: form.loginDate ? new Date(form.loginDate) : undefined,
        sanctionDate: form.sanctionDate ? new Date(form.sanctionDate) : undefined,
        disbursementDate: form.disbursementDate ? new Date(form.disbursementDate) : undefined,
        handoverDate: form.handoverDate ? new Date(form.handoverDate) : undefined,
        handledBy: form.handledBy || undefined,
        saleDeedAmount: form.saleDeedAmount ? rupeesToPaisa(parseFloat(form.saleDeedAmount)) : 0,
        ocrAmount: form.ocrAmount ? rupeesToPaisa(parseFloat(form.ocrAmount)) : 0,
        parallelFundingAmount: form.parallelFundingAmount ? rupeesToPaisa(parseFloat(form.parallelFundingAmount)) : 0,
        isFullDisbursed: form.isFullDisbursed,
        partPayments: form.partPayments.filter(p => p.amount && p.date).map(p => ({
          amount: rupeesToPaisa(parseFloat(p.amount)),
          date: new Date(p.date)
        })),
      };
      
      if (editData) {
        const r = await casesService.update(editData._id, payload);
        onUpdated?.(r.case);
      } else {
        const r = await casesService.create(payload);
        onCreated?.(r.case);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || (editData ? 'Failed to update case' : 'Failed to create case'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{editData ? 'Edit Case' : 'Add New Case'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        {/* Customer Info */}
        <SectionTitle>Customer Information</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Input label="Customer Name *" {...field('customerName')} required />
          <Input label="Phone *" {...field('phone')} required />
          <Input label="Email" type="email" {...field('email')} />
          <Select label="Profession" options={PROFESSIONS} {...field('profession')} />
          <Input label="File Number" {...field('fileNumber')} placeholder="e.g. ZPL-001" />
          <Select label="Handled By" options={employees.map((e) => ({ value: e._id, label: `${e.name} (${e.role})` }))} {...field('handledBy')} hasEmpty />
        </div>

        {/* Loan Details */}
        <SectionTitle>Loan Details</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Select label="Product" options={PRODUCTS} {...field('product')} />
          <Input label="Loan Amount (₹)" type="number" min="0" {...field('loanAmount')} />
          <Select label="Property Type" options={PROPERTY_TYPES} {...field('propertyType')} hasEmpty />
          <SelectWithAdd
            label="Bank Name"
            options={bankOptions}
            value={form.bankName}
            onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            onAddClick={() => setShowAddBank(true)}
          />
          {showAddBank && (
            <AddOptionForm
              label="Bank Name"
              value={newBankName}
              onChange={setNewBankName}
              onAdd={handleAddBank}
              onCancel={() => { setShowAddBank(false); setNewBankName(''); }}
            />
          )}
          <Input label="Provisional Banks" {...field('provisionalBanks')} placeholder="Bank1, Bank2, ..." />
          <SelectWithAdd
            label="Channel Name"
            options={channelOptions}
            value={form.channelName}
            onChange={(e) => setForm((f) => ({ ...f, channelName: e.target.value }))}
            onAddClick={() => setShowAddChannel(true)}
          />
          {showAddChannel && (
            <AddOptionForm
              label="Channel Name"
              value={newChannelName}
              onChange={setNewChannelName}
              onAdd={handleAddChannel}
              onCancel={() => { setShowAddChannel(false); setNewChannelName(''); }}
            />
          )}
          <Select label="Status" options={LOAN_STATUSES} {...field('currentStatus')} />
        </div>

        {/* Bank Login */}
        <SectionTitle>Bank Portal Credentials</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Input label="Bank User ID" {...field('bankUserId')} />
          <Input label="Bank Password" {...field('bankPassword')} />
        </div>

        {/* Important Dates */}
        <SectionTitle>Important Dates</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Input label="Entry Date" type="date" {...field('entryDate')} />
          <Input label="Login Date" type="date" {...field('loginDate')} />
          <Input label="Sanction Date" type="date" {...field('sanctionDate')} />
          <Input label="Disbursement Date" type="date" {...field('disbursementDate')} />
          <Input label="Handover Date" type="date" {...field('handoverDate')} />
        </div>

        {/* Reference/Referral Details */}
        <SectionTitle>Referral Information</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Input label="Referral ID" {...field('referralId')} placeholder="Referral ID" />
          <Input label="Reference Name" {...field('referenceName')} placeholder="Who referred this case?" />
          <Input label="Reference Phone" {...field('referencePhone')} />
          <Input label="Reference Mobile" {...nestedField('referenceDetails', 'mobileNumber')} />
          <Input label="Reference Bank Name" {...nestedField('referenceDetails', 'bankName')} />
          <Input label="Reference Bank Branch" {...nestedField('referenceDetails', 'bankBranch')} />
          <Input label="Account Number" {...nestedField('referenceDetails', 'accountNumber')} />
          <Input label="IFSC Code" {...nestedField('referenceDetails', 'ifscCode')} />
        </div>

        {/* Banker Details */}
        <SectionTitle>Banker/Handover Details</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Input label="Banker Name" {...nestedField('bankerDetails', 'name')} />
          <Input label="Banker Mobile" {...nestedField('bankerDetails', 'mobileNumber')} />
          <Input label="Banker Email" type="email" {...nestedField('bankerDetails', 'emailId')} />
          <Select
            label="Handover Confirmation"
            options={['Done', 'Pending']}
            {...nestedField('bankerDetails', 'handoverConfirmation')}
            hasEmpty
          />
        </div>

        {/* Disbursement Tracker Fields */}
        <SectionTitle>Disbursement Tracker</SectionTitle>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Input label="Sale Deed Amount (₹)" type="number" min="0" {...field('saleDeedAmount')} />
          <Input label="OCR Amount (₹)" type="number" min="0" {...field('ocrAmount')} />
          <Input label="Parallel Funding Amount (₹)" type="number" min="0" {...field('parallelFundingAmount')} />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 col-span-3 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFullDisbursed}
              onChange={e => setForm(f => ({ ...f, isFullDisbursed: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            FULL Disbursed (Yes/No)
          </label>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Part Payments</h3>
            <button
              type="button"
              onClick={addPartPayment}
              className="text-xs font-bold text-brand hover:underline"
            >
              + Add Part Payment
            </button>
          </div>
          
          <div className="space-y-2">
            {form.partPayments.map((pp, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Input
                  label="Amount (₹)"
                  type="number"
                  min="0"
                  value={pp.amount}
                  onChange={e => updatePartPayment(i, 'amount', e.target.value)}
                />
                <Input
                  label="Date"
                  type="date"
                  value={pp.date}
                  onChange={e => updatePartPayment(i, 'date', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removePartPayment(i)}
                  className="mt-5 p-1 text-red-500 hover:text-red-700"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            {form.partPayments.length === 0 && (
              <div className="text-center py-2 text-xs text-slate-400 italic">No part payments added.</div>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || dropdownLoading}
            className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? (editData ? 'Updating…' : 'Creating…') : (editData ? 'Update Case' : 'Create Case')}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mb-2 mt-3 border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
      {children}
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

function Select({ label, options, hasEmpty, ...props }) {
  const isObjectOptions = options.length > 0 && typeof options[0] === 'object';
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select
        {...props}
        className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      >
        {hasEmpty && <option value="">— Select —</option>}
        {isObjectOptions
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
      </select>
    </label>
  );
}

function SelectWithAdd({ label, options, onAddClick, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-0.5 flex gap-1">
        <select
          {...props}
          className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="">— Select —</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onAddClick}
          className="rounded-md bg-brand/10 px-2 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20"
          title="Add new option"
        >
          + Add
        </button>
      </div>
    </label>
  );
}

function AddOptionForm({ label, value, onChange, onAdd, onCancel }) {
  return (
    <div className="col-span-3 rounded-md border border-brand/20 bg-brand/5 p-3">
      <div className="text-xs font-medium text-slate-600 mb-2">Add New {label}</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter new ${label.toLowerCase()}`}
          className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

