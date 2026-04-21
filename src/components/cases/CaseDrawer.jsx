import { useEffect, useState, useRef } from 'react';
import { casesService } from '../../services/cases.service.js';
import { formatINR, formatDate, formatDateTime, paisaToRupees, rupeesToPaisa, toDateInput } from '../../utils/format.js';
import { LOAN_STATUSES, STATUS_COLORS, FOLLOWUP_TYPES, POST_DISBURSEMENT_STAGES, DISBURSEMENT_TYPES } from '../../utils/constants.js';
import { useAuth } from '../../store/auth.js';
import {
  MESSAGE_TEMPLATES,
  buildContext,
  renderTemplate,
  whatsappLink,
  smsLink,
  emailLink,
} from '../../utils/communication.js';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'followups', label: 'Follow-ups' },
  { key: 'payments', label: 'Payments' },
  { key: 'frankingNotary', label: 'Franking & Notary' },
  { key: 'postDisb', label: 'Post-Disbursement' },
  { key: 'communicate', label: 'Communicate' },
  { key: 'documents', label: 'Documents' },
];

export default function CaseDrawer({ caseId, onClose, onUpdated }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    casesService
      .get(caseId)
      .then((r) => setData(r.case))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  async function refresh() {
    const r = await casesService.get(caseId);
    setData(r.case);
    onUpdated?.(r.case);
  }

  async function updateField(patch) {
    await casesService.update(caseId, patch);
    refresh();
  }

  if (!caseId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase text-slate-500">Case #{data?.srNo ?? '...'}</span>
              {data?.fileNumber && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                  File: {data.fileNumber}
                </span>
              )}
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {data?.customerName || 'Loading...'}
            </div>
            {data && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <a href={`tel:${data.phone}`} className="text-brand hover:underline">Ph: {data.phone}</a>
                <a
                  href={`https://wa.me/91${(data.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  WhatsApp
                </a>
                <StatusPill value={data.currentStatus} />
                {data.handledBy && (
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                    {data.handledBy.name}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            X
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'border-b-2 border-brand text-brand'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <div className="text-slate-500">Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {data && tab === 'overview' && <OverviewTab data={data} onUpdate={updateField} onRefresh={refresh} />}
          {data && tab === 'followups' && <FollowUpsTab data={data} onAdded={refresh} />}
          {data && tab === 'payments' && <PaymentsTab data={data} onAdded={refresh} />}
          {data && tab === 'frankingNotary' && <FrankingNotaryTab data={data} onUpdate={updateField} />}
          {data && tab === 'postDisb' && <PostDisbursementTab data={data} onUpdate={updateField} />}
          {data && tab === 'communicate' && <CommunicateTab data={data} />}
          {data && tab === 'documents' && <DocumentsTab data={data} onRefresh={refresh} />}
        </div>
      </aside>
    </>
  );
}

function StatusPill({ value }) {
  const c = STATUS_COLORS[value];
  if (!c) return null;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {value}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-800">{children || '---'}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{children}</div>;
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ data, onUpdate, onRefresh }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Customer">{data.customerName}</Field>
        <Field label="Phone">{data.phone}</Field>
        <Field label="Email">{data.email}</Field>
        <Field label="Profession">{data.profession}</Field>
        <Field label="File Number">{data.fileNumber}</Field>
        <Field label="Handled By">{data.handledBy?.name || '---'}</Field>
        <Field label="Product">{data.product}</Field>
        <Field label="Property Type">{data.propertyType}</Field>
        <Field label="App ID">{data.appId}</Field>
        <Field label="Channel Name">{data.channelName}</Field>
        <Field label="Bank">{data.bankName}</Field>
        <Field label="Bank SM">{data.bankSMName}</Field>
        <Field label="Provisional Banks">{(data.provisionalBanks || []).join(', ')}</Field>
        <Field label="ROI">{data.roi ? `${data.roi}%` : '---'}</Field>
        <Field label="Loan Amount">{formatINR(data.loanAmount)}</Field>
        <Field label="Sanctioned">{formatINR(data.sanctionedAmount)}</Field>
        <Field label="Disbursed">{formatINR(data.disbursedAmount)}</Field>
        <Field label="Disbursement Type">{data.disbursementType || '---'}</Field>
        <Field label="Pending Payment">
          <span className="text-red-600">{formatINR(data.pendingPaymentAmount)}</span>
        </Field>
        <Field label="Entry Date">{formatDate(data.entryDate)}</Field>
        <Field label="Follow Date">{formatDate(data.followDate)}</Field>
        <Field label="Login Date">{formatDate(data.loginDate)}</Field>
        <Field label="Sanction Date">{formatDate(data.sanctionDate)}</Field>
        <Field label="Disbursement Date">{formatDate(data.disbursementDate)}</Field>
        <Field label="Handover Date">{formatDate(data.handoverDate)}</Field>
      </div>

      {/* Insurance (post-disbursement) */}
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <SectionTitle>Insurance</SectionTitle>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Insurance Company">{data.insuranceCompany}</Field>
          <Field label="Insurance Amount">{data.insuranceAmount ? formatINR(data.insuranceAmount) : '---'}</Field>
          <Field label="Policy Number">{data.insurancePolicyNumber}</Field>
          <Field label="Status">
            {data.insuranceStatus ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                data.insuranceStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                data.insuranceStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                data.insuranceStatus === 'Claimed' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {data.insuranceStatus}
              </span>
            ) : '---'}
          </Field>
        </div>
      </div>

      {/* Referral Information */}
      {(data.referralId || data.referenceName || data.referencePhone) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <SectionTitle>Referral Information</SectionTitle>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Referral ID">{data.referralId || '---'}</Field>
            <Field label="Reference Name">{data.referenceName || '---'}</Field>
            <Field label="Reference Phone">{data.referencePhone || '---'}</Field>
            {data.referenceDetails && (
              <>
                <Field label="Reference Mobile">{data.referenceDetails.mobileNumber || '---'}</Field>
                <Field label="Reference Bank">{data.referenceDetails.bankName || '---'}</Field>
                <Field label="Bank Branch">{data.referenceDetails.bankBranch || '---'}</Field>
                <Field label="Account Number">{data.referenceDetails.accountNumber || '---'}</Field>
                <Field label="IFSC Code">{data.referenceDetails.ifscCode || '---'}</Field>
              </>
            )}
          </div>
        </div>
      )}

      {/* Banker/Handover Details */}
      {(data.bankerDetails?.name || data.bankerDetails?.mobileNumber || data.bankerDetails?.emailId) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <SectionTitle>Banker/Handover Details</SectionTitle>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Banker Name">{data.bankerDetails.name || '---'}</Field>
            <Field label="Banker Mobile">{data.bankerDetails.mobileNumber || '---'}</Field>
            <Field label="Banker Email">{data.bankerDetails.emailId || '---'}</Field>
            <Field label="Handover Confirmation">
              {data.bankerDetails.handoverConfirmation ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  data.bankerDetails.handoverConfirmation === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {data.bankerDetails.handoverConfirmation}
                </span>
              ) : '---'}
            </Field>
          </div>
        </div>
      )}

      {/* Reference */}
      {(data.referenceName || data.referencePhone) && !data.referralId && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <SectionTitle>Reference</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-slate-700">{data.referenceName || '---'}</span>
            <span className="text-slate-700">{data.referencePhone || '---'}</span>
          </div>
        </div>
      )}

      {/* Bank Portal Credentials */}
      {(data.bankUserId || data.bankPassword) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <SectionTitle>Bank Portal Credentials</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            <Field label="User ID">{data.bankUserId}</Field>
            <Field label="Password">{data.bankPassword}</Field>
          </div>
        </div>
      )}

      {/* Sanction Letter */}
      {data.sanctionLetterFile && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <SectionTitle>Sanction Letter</SectionTitle>
          <a
            href={data.sanctionLetterFile}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
          >
            View Sanction Letter
            <span className="text-xs text-green-500">&#8599;</span>
          </a>
        </div>
      )}

      <div>
        <Field label="Special Notes">{data.specialNotes}</Field>
      </div>
    </div>
  );
}

/* ─── FOLLOW-UPS TAB ─── */
function FollowUpsTab({ data, onAdded }) {
  const [details, setDetails] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [followUpType, setFollowUpType] = useState('FollowUp');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!details.trim()) return;
    setSubmitting(true);
    try {
      await casesService.addFollowUp(data._id, {
        details,
        nextFollowUpDate: nextDate || undefined,
        followUpType,
      });
      setDetails('');
      setNextDate('');
      onAdded?.();
    } finally {
      setSubmitting(false);
    }
  }

  const allFollowUps = [...(data.followUps || [])].reverse();
  const filtered = filterType ? allFollowUps.filter((f) => f.followUpType === filterType) : allFollowUps;

  const typeCounts = {};
  for (const f of data.followUps || []) {
    typeCounts[f.followUpType || 'FollowUp'] = (typeCounts[f.followUpType || 'FollowUp'] || 0) + 1;
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-sm font-semibold text-slate-700">Add follow-up</div>
        <div className="mb-2 flex gap-2">
          {FOLLOWUP_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFollowUpType(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                followUpType === t
                  ? 'bg-brand text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="What happened on this call / visit?"
          rows={2}
          className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Next follow-up:</label>
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={submitting || !details.trim()}
            className="ml-auto rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Filter by type */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Filter:</span>
        <button
          onClick={() => setFilterType('')}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${!filterType ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          All ({(data.followUps || []).length})
        </button>
        {FOLLOWUP_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${filterType === t ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {t} ({typeCounts[t] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-slate-500">No follow-ups recorded yet.</div>
      )}

      <ol className="space-y-3">
        {filtered.map((f, i) => (
          <li key={i} className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-slate-700">{formatDateTime(f.date)}</div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                  f.followUpType === 'Login' ? 'bg-cyan-100 text-cyan-700' :
                  f.followUpType === 'Disbursement' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {f.followUpType || 'FollowUp'}
                </span>
              </div>
              {f.nextFollowUpDate && (
                <div className="text-xs text-amber-700">
                  Next: {formatDate(f.nextFollowUpDate)}
                </div>
              )}
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{f.details}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ─── PAYMENTS TAB ─── */
function PaymentsTab({ data, onAdded }) {
  const [kind, setKind] = useState('received');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Bank');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [disbursementNumber, setDisbursementNumber] = useState('');
  const [gstStatus, setGstStatus] = useState('');
  const [gstAmount, setGstAmount] = useState('');
  const [shortfall, setShortfall] = useState('');
  const [shortfallReason, setShortfallReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    const rupees = parseFloat(amount);
    if (!rupees || rupees <= 0) return;
    setSubmitting(true);
    try {
      await casesService.addPayment(data._id, kind, {
        amount: rupeesToPaisa(rupees),
        mode,
        reference,
        note,
        disbursementNumber,
        gstStatus: gstStatus || undefined,
        gstAmount: gstAmount ? rupeesToPaisa(parseFloat(gstAmount)) : 0,
        shortfall: shortfall ? rupeesToPaisa(parseFloat(shortfall)) : 0,
        shortfallReason,
      });
      setAmount('');
      setReference('');
      setNote('');
      setDisbursementNumber('');
      setGstStatus('');
      setGstAmount('');
      setShortfall('');
      setShortfallReason('');
      onAdded?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <SummaryCard label="Sanctioned" value={formatINR(data.sanctionedAmount)} />
        <SummaryCard
          label="Received"
          value={formatINR((data.paymentReceived || []).reduce((a, p) => a + p.amount, 0))}
        />
        <SummaryCard
          label="Pending"
          value={formatINR(data.pendingPaymentAmount)}
          accent="text-red-600"
        />
      </div>

      <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-sm font-semibold text-slate-700">Add payment</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="received">Received</option>
            <option value="done">Paid Out</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (Rs)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option>Bank</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Cheque</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="text"
            placeholder="Disbursement # (1st, 2nd...)"
            value={disbursementNumber}
            onChange={(e) => setDisbursementNumber(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <select
            value={gstStatus}
            onChange={(e) => setGstStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">GST Status</option>
            <option value="Pending">GST Pending</option>
            <option value="Received">GST Received</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="GST Amount (Rs)"
            value={gstAmount}
            onChange={(e) => setGstAmount(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Shortfall (Rs)"
            value={shortfall}
            onChange={(e) => setShortfall(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            type="text"
            placeholder="Shortfall reason"
            value={shortfallReason}
            onChange={(e) => setShortfallReason(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        {/* Payment Note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Payment note (optional) - e.g., cheque details, split info..."
          rows={2}
          className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={submitting || !amount}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Add'}
        </button>
      </form>

      <PaymentList title="Received" items={data.paymentReceived} />
      <PaymentList title="Paid Out" items={data.paymentDone} />
    </div>
  );
}

/* ─── FRANKING & NOTARY TAB ─── */
function FrankingNotaryTab({ data, onUpdate }) {
  const fn = data.frankingNotary || {};
  const [form, setForm] = useState({
    frankingActual: paisaToRupees(fn.frankingActual || 0),
    notaryActual: paisaToRupees(fn.notaryActual || 0),
    otherChargesActual: paisaToRupees(fn.otherChargesActual || 0),
    otherChargesLabel: fn.otherChargesLabel || '',
    amountTakenFromCustomer: paisaToRupees(fn.amountTakenFromCustomer || 0),
    notes: fn.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const totalActual = (parseFloat(form.frankingActual) || 0) +
    (parseFloat(form.notaryActual) || 0) +
    (parseFloat(form.otherChargesActual) || 0);
  const taken = parseFloat(form.amountTakenFromCustomer) || 0;
  const balance = taken - totalActual;

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate({
        frankingNotary: {
          frankingActual: rupeesToPaisa(parseFloat(form.frankingActual) || 0),
          notaryActual: rupeesToPaisa(parseFloat(form.notaryActual) || 0),
          otherChargesActual: rupeesToPaisa(parseFloat(form.otherChargesActual) || 0),
          otherChargesLabel: form.otherChargesLabel,
          amountTakenFromCustomer: rupeesToPaisa(parseFloat(form.amountTakenFromCustomer) || 0),
          notes: form.notes,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-700">Franking & Notary Charges</div>
        <p className="mb-3 text-xs text-slate-500">
          Track actual charges paid and amount taken from customer. Balance shows profit/loss.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Franking (Rs)</span>
            <input type="number" min="0" step="0.01" value={form.frankingActual} onChange={set('frankingActual')}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Notary (Rs)</span>
            <input type="number" min="0" step="0.01" value={form.notaryActual} onChange={set('notaryActual')}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Other Charges Label</span>
            <input type="text" value={form.otherChargesLabel} onChange={set('otherChargesLabel')}
              placeholder="e.g., Stamp Duty, Legal..."
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Other Charges (Rs)</span>
            <input type="number" min="0" step="0.01" value={form.otherChargesActual} onChange={set('otherChargesActual')}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
        </div>

        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-3">
          <label className="block">
            <span className="text-xs font-bold text-blue-700">Amount Taken From Customer (Rs)</span>
            <input type="number" min="0" step="0.01" value={form.amountTakenFromCustomer} onChange={set('amountTakenFromCustomer')}
              className="mt-0.5 w-full rounded-md border border-blue-300 px-2 py-1.5 text-sm font-semibold" />
          </label>
        </div>

        <label className="block mb-3">
          <span className="text-xs font-medium text-slate-600">Notes</span>
          <textarea value={form.notes} onChange={set('notes')} rows={2}
            placeholder="Any remarks about franking/notary..."
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </label>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div>
            <div className="text-[10px] uppercase text-slate-500">Total Actual</div>
            <div className="text-sm font-bold text-slate-800">{formatINR(rupeesToPaisa(totalActual))}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Taken from Customer</div>
            <div className="text-sm font-bold text-blue-700">{formatINR(rupeesToPaisa(taken))}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500">Balance</div>
            <div className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{formatINR(rupeesToPaisa(balance))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Charges'}
        </button>
      </div>
    </div>
  );
}

/* ─── POST-DISBURSEMENT TAB ─── */
function PostDisbursementTab({ data, onUpdate }) {
  const [stage, setStage] = useState(data.postDisbursementStage || '');
  const [disbType, setDisbType] = useState(data.disbursementType || '');

  function handleStageChange(newStage) {
    setStage(newStage);
    onUpdate({ postDisbursementStage: newStage });
  }

  function handleDisbTypeChange(newType) {
    setDisbType(newType);
    onUpdate({ disbursementType: newType });
  }

  const stageIndex = POST_DISBURSEMENT_STAGES.findIndex((s) => s.key === stage);

  return (
    <div className="space-y-4">
      {data.currentStatus !== 'Disbursed' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Post-disbursement tracking is most relevant after the case is disbursed.
        </div>
      )}

      {/* Insurance Section */}
      <InsuranceSection data={data} onUpdate={onUpdate} />

      {/* Disbursement Type */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-slate-700">Disbursement Type</div>
        <div className="flex gap-2">
          {DISBURSEMENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => handleDisbTypeChange(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                disbType === t
                  ? 'bg-brand text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t} Disbursement
            </button>
          ))}
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-slate-700">Post-Disbursement Stage</div>
        <div className="space-y-1">
          {POST_DISBURSEMENT_STAGES.map((s, i) => {
            const isActive = s.key === stage;
            const isDone = stageIndex >= 0 && i < stageIndex;
            return (
              <button
                key={s.key}
                onClick={() => handleStageChange(s.key)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand ring-1 ring-brand'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isActive ? 'bg-brand text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {isDone ? 'v' : i + 1}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Part Disbursements */}
      {data.partDisbursements?.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">Part Disbursements</div>
          <div className="space-y-1">
            {data.partDisbursements.map((pd, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">
                    {pd.disbursementNumber || `#${i + 1}`}
                  </span>
                  <span className="ml-2 text-slate-500">{formatDate(pd.date)}</span>
                </div>
                <span className="font-semibold tabular-nums">{formatINR(pd.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Summary for post-disbursement */}
      {data.paymentReceived?.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">Payment Tracking</div>
          {data.paymentReceived.map((p, i) => (
            <div key={i} className="mb-2 rounded-md border border-slate-100 p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">{p.disbursementNumber || `Payment #${i + 1}`}</span>
                <span className="font-bold tabular-nums">{formatINR(p.amount)}</span>
              </div>
              <div className="mt-1 flex gap-4 text-slate-500">
                <span>{formatDate(p.paymentDate || p.date)}</span>
                <span>{p.mode}</span>
                {p.gstStatus && (
                  <span className={p.gstStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}>
                    GST: {p.gstStatus} {p.gstAmount ? `(${formatINR(p.gstAmount)})` : ''}
                  </span>
                )}
                {p.shortfall > 0 && (
                  <span className="text-red-600">
                    Shortfall: {formatINR(p.shortfall)} {p.shortfallReason ? `- ${p.shortfallReason}` : ''}
                  </span>
                )}
              </div>
              {p.note && (
                <div className="mt-1 text-slate-600 italic">Note: {p.note}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── INSURANCE SECTION (inside Post-Disbursement) ─── */
function InsuranceSection({ data, onUpdate }) {
  const [form, setForm] = useState({
    insuranceCompany: data.insuranceCompany || '',
    insuranceAmount: data.insuranceAmount ? paisaToRupees(data.insuranceAmount) : '',
    insurancePolicyNumber: data.insurancePolicyNumber || '',
    insuranceStatus: data.insuranceStatus || '',
  });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate({
        insuranceCompany: form.insuranceCompany,
        insuranceAmount: form.insuranceAmount ? rupeesToPaisa(parseFloat(form.insuranceAmount)) : 0,
        insurancePolicyNumber: form.insurancePolicyNumber,
        insuranceStatus: form.insuranceStatus,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
      <div className="mb-2 text-sm font-semibold text-teal-800">Insurance</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Insurance Company</span>
          <input type="text" value={form.insuranceCompany} onChange={set('insuranceCompany')}
            placeholder="e.g., HDFC Life, LIC..."
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Amount (Rs)</span>
          <input type="number" min="0" step="0.01" value={form.insuranceAmount} onChange={set('insuranceAmount')}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Policy Number</span>
          <input type="text" value={form.insurancePolicyNumber} onChange={set('insurancePolicyNumber')}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Status</span>
          <select value={form.insuranceStatus} onChange={set('insuranceStatus')}
            className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">-- Select --</option>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Claimed">Claimed</option>
            <option value="Expired">Expired</option>
          </select>
        </label>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="mt-3 rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Insurance'}
      </button>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-sm font-semibold ${accent || 'text-slate-800'}`}>{value || '---'}</div>
    </div>
  );
}

function PaymentList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</div>
      <ul className="space-y-1">
        {items.map((p, i) => (
          <li
            key={i}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{formatDate(p.date)} - {p.mode}</span>
                {p.disbursementNumber && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    {p.disbursementNumber}
                  </span>
                )}
              </div>
              <span className="font-semibold tabular-nums">{formatINR(p.amount)}</span>
            </div>
            {p.note && (
              <div className="mt-1 text-xs text-slate-600 italic">Note: {p.note}</div>
            )}
            {(p.gstStatus || p.shortfall > 0) && (
              <div className="mt-1 flex gap-3 text-[11px]">
                {p.gstStatus && (
                  <span className={p.gstStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}>
                    GST: {p.gstStatus} {p.gstAmount ? `(${formatINR(p.gstAmount)})` : ''}
                  </span>
                )}
                {p.shortfall > 0 && (
                  <span className="text-red-600">
                    Shortfall: {formatINR(p.shortfall)} {p.shortfallReason ? `- ${p.shortfallReason}` : ''}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommunicateTab({ data }) {
  const { user } = useAuth();
  const [templateKey, setTemplateKey] = useState(MESSAGE_TEMPLATES[0].key);
  const template = MESSAGE_TEMPLATES.find((t) => t.key === templateKey);
  const ctx = buildContext(data, user);
  const [message, setMessage] = useState(() => renderTemplate(template.body, ctx));
  const [subject, setSubject] = useState(`Update on your loan with ${data.bankName || 'us'}`);

  function pickTemplate(key) {
    setTemplateKey(key);
    const t = MESSAGE_TEMPLATES.find((x) => x.key === key);
    setMessage(renderTemplate(t.body, ctx));
  }

  function copyToClipboard() {
    navigator.clipboard?.writeText(message);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 text-sm font-semibold text-slate-700">Pick a template</div>
        <div className="flex flex-wrap gap-1">
          {MESSAGE_TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => pickTemplate(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                templateKey === t.key
                  ? 'bg-brand text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>{message.length} characters</span>
          <button onClick={copyToClipboard} className="text-brand hover:underline">Copy</button>
        </div>
      </div>

      {template?.channels.includes('email') && (
        <div>
          <label className="text-xs font-medium text-slate-600">Email subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {template?.channels.includes('whatsapp') && (
          <a href={whatsappLink(data.phone, message)} target="_blank" rel="noreferrer"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
            Send via WhatsApp
          </a>
        )}
        {template?.channels.includes('sms') && (
          <a href={smsLink(data.phone, message)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
            Send SMS
          </a>
        )}
        {template?.channels.includes('email') && data.email && (
          <a href={emailLink(data.email, subject, message)}
            className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">
            Email
          </a>
        )}
      </div>
    </div>
  );
}

function DocumentsTab({ data, onRefresh }) {
  const expenseHref = `/api/v1/cases/${data._id}/expense-sheet.pdf`;
  const offerBeforeHref = `/api/v1/cases/${data._id}/offer-letter.pdf?stage=before`;
  const offerAfterHref = `/api/v1/cases/${data._id}/offer-letter.pdf?stage=after`;
  const checklist = data.documents || {};
  const checklistItems = [
    ['kycDone', 'KYC'],
    ['itrDone', 'ITR'],
    ['bankStatementDone', 'Bank Statement'],
    ['propertyDocsDone', 'Property Docs'],
    ['salarySlipDone', 'Salary Slip'],
    ['form16Done', 'Form 16'],
    ['gstReturnDone', 'GST Return'],
  ];

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  async function handleSanctionUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await casesService.uploadSanctionLetter(data._id, file);
      onRefresh?.();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Sanction Letter Upload */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="mb-2 text-sm font-semibold text-green-800">Sanction Letter</div>
        {data.sanctionLetterFile ? (
          <div className="flex items-center gap-3">
            <a
              href={data.sanctionLetterFile}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
            >
              View Sanction Letter
            </a>
            <span className="text-xs text-green-600">Uploaded</span>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-green-700 underline hover:text-green-900"
            >
              Replace
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs text-slate-500">Upload the sanction letter (PDF, JPG, PNG, DOC - max 10MB)</p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Sanction Letter'}
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleSanctionUpload}
          className="hidden"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-slate-700">Generate documents</div>
        <p className="mb-3 text-xs text-slate-500">
          Customer-facing PDFs. Each opens in a new tab.
        </p>
        <div className="flex flex-wrap gap-2">
          <DocBtn href={expenseHref} icon="doc" label="Loan Expense Sheet" />
          <DocBtn href={offerBeforeHref} icon="doc" label="Offer Letter (Pre-process)" />
          <DocBtn href={offerAfterHref} icon="doc" label="Offer Letter (Post-sanction)" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-slate-700">Document checklist</div>
        <div className="grid grid-cols-2 gap-1.5">
          {checklistItems.map(([k, label]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded text-[10px] ${
                  checklist[k]
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {checklist[k] ? 'v' : 'o'}
              </span>
              <span className={checklist[k] ? 'text-slate-800' : 'text-slate-500'}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocBtn({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      <span>{label}</span>
      <span className="text-[10px] text-slate-400">&#8599;</span>
    </a>
  );
}
