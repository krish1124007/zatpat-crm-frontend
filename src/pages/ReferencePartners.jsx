import { useEffect, useState } from 'react';
import { casesService } from '../services/cases.service.js';
import { formatINR } from '../utils/format.js';
import { STATUS_COLORS } from '../utils/constants.js';

export default function ReferencePartnersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await casesService.referencePartners({ search: search || undefined });
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

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Reference Partners</h1>
          <p className="text-sm text-slate-500">All people and partners who referred cases to us</p>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="🔍 Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            onClick={load}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
          <div className="ml-auto text-sm text-slate-500">
            {items.length} reference partner{items.length === 1 ? '' : 's'}
          </div>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {loading && <div className="text-sm text-slate-500">Loading…</div>}

        {/* Summary Cards */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <StatCard label="Total References" value={items.length} accent="text-indigo-700" />
          <StatCard
            label="Total Cases Referred"
            value={items.reduce((a, it) => a + it.totalCases, 0)}
            accent="text-slate-800"
          />
          <StatCard
            label="Total Disbursed"
            value={formatINR(items.reduce((a, it) => a + it.totalDisbursedAmount, 0))}
            accent="text-emerald-700"
          />
        </div>

        {/* Reference Partner List */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <button
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                      {(item.referenceName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{item.referenceName}</div>
                      {item.referencePhone && (
                        <div className="text-xs text-slate-500">{item.referencePhone}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Cases</div>
                    <div className="text-sm font-bold text-slate-800">{item.totalCases}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Disbursed</div>
                    <div className="text-sm font-bold text-emerald-700">{item.disbursedCases}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Amount</div>
                    <div className="text-sm font-bold tabular-nums text-slate-800">{formatINR(item.totalLoanAmount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total Payout</div>
                    <div className="text-sm font-bold text-slate-800">{formatINR(item.totalPayoutAmount)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Paid</div>
                    <div className="text-sm font-bold text-emerald-700">{formatINR(item.totalPaidPayout)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Pending</div>
                    <div className="text-sm font-bold text-red-600">{formatINR(item.totalPayoutAmount - item.totalPaidPayout)}</div>
                  </div>
                  <span className={`text-slate-400 transition ${expanded === idx ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>

              {expanded === idx && (
                <div className="border-t border-slate-200 px-5 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase text-slate-500">Referred Cases</div>
                    <button
                      onClick={() => {
                        const headers = ['Sr No', 'Customer Name', 'Phone', 'Bank', 'Status', 'Loan Amount', 'Disbursed Amount', 'Payout %', 'Payout Amount', 'Payout Status', 'Paid Date', 'Mode', 'Bank Name'];
                        const rows = item.cases.map(c => [
                          c.srNo,
                          `"${c.customerName || ''}"`,
                          c.phone || '',
                          `"${c.bankName || ''}"`,
                          c.currentStatus || '',
                          (c.loanAmount || 0) / 100,
                          (c.disbursedAmount || 0) / 100,
                          c.referralPayout?.percentage || 0,
                          (c.referralPayout?.amount || 0) / 100,
                          c.referralPayout?.status || '',
                          c.referralPayout?.date ? new Date(c.referralPayout.date).toISOString().split('T')[0] : '',
                          c.referralPayout?.mode || '',
                          `"${c.referralPayout?.bankName || ''}"`
                        ]);
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement('a');
                        link.setAttribute('href', encodedUri);
                        link.setAttribute('download', `${item.referenceName.replace(/[^a-zA-Z0-9]/g, '_')}_references.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="rounded bg-brand px-3 py-1.5 text-[10px] font-bold text-white hover:bg-brand-700"
                    >
                      Download CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-1.5 text-left">Sr No</th>
                          <th className="px-3 py-1.5 text-left">Customer</th>
                          <th className="px-3 py-1.5 text-left">Phone</th>
                          <th className="px-3 py-1.5 text-left">Bank</th>
                          <th className="px-3 py-1.5 text-left">Status</th>
                          <th className="px-3 py-1.5 text-right">Loan</th>
                          <th className="px-3 py-1.5 text-right">Payout %</th>
                          <th className="px-3 py-1.5 text-right">Payout Amt</th>
                          <th className="px-3 py-1.5 text-center">Payout Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.cases.map((c, ci) => {
                          const sc = STATUS_COLORS[c.currentStatus] || {};
                          return (
                            <tr key={ci} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-1.5 font-mono text-slate-500">#{c.srNo}</td>
                              <td className="px-3 py-1.5 font-medium text-slate-800">{c.customerName}</td>
                              <td className="px-3 py-1.5 text-slate-600">{c.phone}</td>
                              <td className="px-3 py-1.5 text-slate-600">{c.bankName || '—'}</td>
                              <td className="px-3 py-1.5">
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: sc.bg, color: sc.fg }}
                                >
                                  {c.currentStatus}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{formatINR(c.loanAmount)}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums">{c.referralPayout?.percentage ? `${c.referralPayout.percentage}%` : '—'}</td>
                              <td className="px-3 py-1.5 text-right tabular-nums font-semibold">{c.referralPayout?.amount ? formatINR(c.referralPayout.amount) : '—'}</td>
                              <td className="px-3 py-1.5 text-center">
                                {c.referralPayout?.status ? (
                                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                    c.referralPayout.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {c.referralPayout.status}
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && items.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              No reference partners found. Add a reference name in a case to see it here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
