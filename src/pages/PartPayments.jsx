import { useEffect, useState, Fragment } from 'react';
import { casesService } from '../services/cases.service.js';
import { formatINR, formatDate, paisaToRupees } from '../utils/format.js';
import { POST_DISBURSEMENT_STAGES } from '../utils/constants.js';
import { downloadCSV } from '../utils/csv.js';

const stageLabel = (key) => POST_DISBURSEMENT_STAGES.find((s) => s.key === key)?.label || key || '---';

export default function PartPaymentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await casesService.partPayments({ search: search || undefined });
      setItems(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSanctioned = items.reduce((a, it) => a + (it.sanctionedAmount || 0), 0);
  const totalDisbursed = items.reduce((a, it) => a + (it.disbursedAmount || 0), 0);
  const totalPending = items.reduce((a, it) => a + (it.pendingPaymentAmount || 0), 0);
  const totalReceived = items.reduce((a, it) => a + (it.paymentReceived || []).reduce((s, p) => s + p.amount, 0), 0);
  const totalInsurance = items.reduce((a, it) => a + (it.insuranceAmount || 0), 0);

  function handleExportCSV() {
    const cols = [
      { key: 'srNo', label: 'Sr No' },
      { key: 'fileNumber', label: 'File No' },
      { key: 'customerName', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'bankName', label: 'Bank' },
      { label: 'Channel', get: (r) => r.channelName || '' },
      { label: 'Handled By', get: (r) => r.handledBy?.name || '' },
      { label: 'Product', get: (r) => r.product || '' },
      { label: 'Loan Amount', get: (r) => paisaToRupees(r.loanAmount) },
      { label: 'Sanctioned', get: (r) => paisaToRupees(r.sanctionedAmount) },
      { label: 'Disbursed', get: (r) => paisaToRupees(r.disbursedAmount) },
      { label: 'Pending Payment', get: (r) => paisaToRupees(r.pendingPaymentAmount) },
      { label: 'Payment Received', get: (r) => paisaToRupees((r.paymentReceived || []).reduce((s, p) => s + p.amount, 0)) },
      { label: 'Insurance Co.', get: (r) => r.insuranceCompany || '' },
      { label: 'Insurance Amt', get: (r) => paisaToRupees(r.insuranceAmount) },
      { label: 'Post-Disb Stage', get: (r) => stageLabel(r.postDisbursementStage) },
      { label: 'Disb. Date', get: (r) => formatDate(r.disbursementDate) },
      { label: 'Part Disbursements', get: (r) => (r.partDisbursements || []).map((pd) => `${pd.disbursementNumber || '#'}: Rs${paisaToRupees(pd.amount)}`).join('; ') },
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`part-payments-${stamp}.csv`, cols, items);
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Part Payments</h1>
            <p className="text-sm text-slate-500">Excel-style tracker for all part-disbursement cases with detailed payment and insurance info</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={items.length === 0}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Download CSV
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, phone, file no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button onClick={load} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
            Search
          </button>
          <button onClick={() => { setSearch(''); load(); }} className="text-xs text-slate-500 hover:text-slate-700">
            Clear
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-4 grid grid-cols-5 gap-3">
          <SummaryCard label="Cases" value={items.length} />
          <SummaryCard label="Total Sanctioned" value={formatINR(totalSanctioned)} color="text-blue-700" />
          <SummaryCard label="Total Disbursed" value={formatINR(totalDisbursed)} color="text-emerald-700" />
          <SummaryCard label="Total Received" value={formatINR(totalReceived)} color="text-indigo-700" />
          <SummaryCard label="Total Pending" value={formatINR(totalPending)} color="text-red-600" />
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        {/* Main Table */}
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 sticky top-0">
              <tr className="text-slate-600">
                <TH>Sr</TH>
                <TH>File No</TH>
                <TH>Customer</TH>
                <TH>Phone</TH>
                <TH>Bank</TH>
                <TH>Channel</TH>
                <TH>Handled By</TH>
                <TH>Product</TH>
                <TH align="right">Loan Amt</TH>
                <TH align="right">Sanctioned</TH>
                <TH align="right">Disbursed</TH>
                <TH align="right">Received</TH>
                <TH align="right">Pending</TH>
                <TH>Insurance</TH>
                <TH align="right">Ins. Amt</TH>
                <TH>Post-Disb Stage</TH>
                <TH>Disb. Date</TH>
                <TH>Details</TH>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={18} className="p-4 text-slate-500">Loading...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={18} className="p-4 text-slate-500">No part-disbursement cases found.</td></tr>
              )}
              {items.map((c) => {
                const received = (c.paymentReceived || []).reduce((s, p) => s + p.amount, 0);
                const isExpanded = expandedId === c._id;
                return (
                  <Fragment key={c._id}>
                    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : c._id)}>
                      <TD className="font-mono text-slate-500">#{c.srNo}</TD>
                      <TD className="font-mono">{c.fileNumber || '---'}</TD>
                      <TD className="font-medium text-slate-800">{c.customerName}</TD>
                      <TD>{c.phone}</TD>
                      <TD>{c.bankName || '---'}</TD>
                      <TD>{c.channelName || '---'}</TD>
                      <TD className="text-indigo-700">{c.handledBy?.name || '---'}</TD>
                      <TD><span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-semibold">{c.product}</span></TD>
                      <TD className="text-right tabular-nums">{formatINR(c.loanAmount)}</TD>
                      <TD className="text-right tabular-nums">{formatINR(c.sanctionedAmount)}</TD>
                      <TD className="text-right tabular-nums font-semibold text-emerald-700">{formatINR(c.disbursedAmount)}</TD>
                      <TD className="text-right tabular-nums font-semibold text-indigo-700">{formatINR(received)}</TD>
                      <TD className="text-right tabular-nums font-semibold text-red-600">{formatINR(c.pendingPaymentAmount)}</TD>
                      <TD>{c.insuranceCompany || '---'}</TD>
                      <TD className="text-right tabular-nums">{c.insuranceAmount ? formatINR(c.insuranceAmount) : '---'}</TD>
                      <TD>
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          {stageLabel(c.postDisbursementStage)}
                        </span>
                      </TD>
                      <TD>{formatDate(c.disbursementDate)}</TD>
                      <TD>
                        <button className="text-brand hover:underline text-[10px] font-medium">
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                      </TD>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={18} className="p-4">
                          <ExpandedDetails c={c} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            {/* Totals Footer */}
            {items.length > 0 && (
              <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
                <tr>
                  <td colSpan={8} className="px-3 py-2 text-right text-slate-600">TOTALS:</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(items.reduce((a, it) => a + (it.loanAmount || 0), 0))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(totalSanctioned)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{formatINR(totalDisbursed)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-indigo-700">{formatINR(totalReceived)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatINR(totalPending)}</td>
                  <td colSpan={1}></td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(totalInsurance)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function ExpandedDetails({ c }) {
  const fn = c.frankingNotary || {};
  const le = c.loanExpenses || {};
  const frankTotal = (fn.frankingActual || 0) + (fn.notaryActual || 0) + (fn.otherChargesActual || 0);
  const frankBalance = (fn.amountTakenFromCustomer || 0) - frankTotal;

  return (
    <div className="grid grid-cols-3 gap-4 text-xs">
      {/* Part Disbursements */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase text-slate-500">Part Disbursements</div>
        {(c.partDisbursements || []).length === 0 ? (
          <div className="text-slate-400">No part disbursements</div>
        ) : (
          <table className="w-full">
            <thead><tr className="text-slate-500"><th className="text-left pb-1">#</th><th className="text-right pb-1">Amount</th><th className="text-left pb-1">Date</th><th className="text-left pb-1">Ref</th></tr></thead>
            <tbody>
              {c.partDisbursements.map((pd, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1 font-medium">{pd.disbursementNumber || `#${i + 1}`}</td>
                  <td className="py-1 text-right tabular-nums font-semibold">{formatINR(pd.amount)}</td>
                  <td className="py-1 text-slate-500">{formatDate(pd.date)}</td>
                  <td className="py-1 text-slate-400">{pd.bankRef || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payments Received */}
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase text-slate-500">Payments Received</div>
        {(c.paymentReceived || []).length === 0 ? (
          <div className="text-slate-400">No payments</div>
        ) : (
          <table className="w-full">
            <thead><tr className="text-slate-500"><th className="text-left pb-1">#</th><th className="text-right pb-1">Amount</th><th className="text-left pb-1">Mode</th><th className="text-left pb-1">GST</th><th className="text-left pb-1">Note</th></tr></thead>
            <tbody>
              {c.paymentReceived.map((p, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1 font-medium">{p.disbursementNumber || `#${i + 1}`}</td>
                  <td className="py-1 text-right tabular-nums font-semibold">{formatINR(p.amount)}</td>
                  <td className="py-1">{p.mode}</td>
                  <td className="py-1">
                    {p.gstStatus ? (
                      <span className={p.gstStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}>
                        {p.gstStatus} {p.gstAmount ? `(${formatINR(p.gstAmount)})` : ''}
                      </span>
                    ) : '---'}
                  </td>
                  <td className="py-1 text-slate-500 max-w-[120px] truncate">{p.note || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Franking, Notary & Insurance */}
      <div className="space-y-3">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase text-slate-500">Franking & Notary</div>
          <div className="grid grid-cols-2 gap-1">
            <MiniField label="Franking" value={formatINR(fn.frankingActual || 0)} />
            <MiniField label="Notary" value={formatINR(fn.notaryActual || 0)} />
            {fn.otherChargesLabel && <MiniField label={fn.otherChargesLabel} value={formatINR(fn.otherChargesActual || 0)} />}
            <MiniField label="Taken from Customer" value={formatINR(fn.amountTakenFromCustomer || 0)} color="text-blue-700" />
            <MiniField label="Balance" value={formatINR(Math.abs(frankBalance))} color={frankBalance >= 0 ? 'text-emerald-700' : 'text-red-600'} prefix={frankBalance >= 0 ? '+' : '-'} />
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase text-slate-500">Insurance</div>
          <div className="grid grid-cols-2 gap-1">
            <MiniField label="Company" value={c.insuranceCompany || '---'} />
            <MiniField label="Amount" value={c.insuranceAmount ? formatINR(c.insuranceAmount) : '---'} />
            <MiniField label="Status" value={c.insuranceStatus || '---'} />
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase text-slate-500">Loan Expenses</div>
          <div className="grid grid-cols-2 gap-1">
            <MiniField label="Processing Fee" value={formatINR(le.processingFee || 0)} />
            <MiniField label="Stamp Duty" value={formatINR(le.stampDuty || 0)} />
            <MiniField label="Legal" value={formatINR(le.legalCharge || 0)} />
            <MiniField label="Technical" value={formatINR(le.technicalCharge || 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniField({ label, value, color, prefix }) {
  return (
    <div>
      <div className="text-[9px] uppercase text-slate-400">{label}</div>
      <div className={`text-xs font-medium ${color || 'text-slate-700'}`}>{prefix}{value}</div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${color || 'text-slate-800'}`}>{value}</div>
    </div>
  );
}

function TH({ children, align }) {
  return (
    <th className={`whitespace-nowrap px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function TD({ children, className = '' }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
