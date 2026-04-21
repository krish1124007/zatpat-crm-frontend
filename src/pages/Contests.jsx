import { useEffect, useState } from 'react';
import { contestsService } from '../services/dashboard.service.js';
import { salaryService as employeesSvc } from '../services/finance.service.js';
import { formatINR, formatDate, toDateInput, rupeesToPaisa } from '../utils/format.js';

const STATUS_COLORS = {
  Draft:  'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-50 text-emerald-700',
  Closed: 'bg-blue-50 text-blue-700',
};

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [meta, setMeta] = useState({ metrics: [], statuses: [] });
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await contestsService.list();
      setContests(r.items);
      if (r.items.length && !selected) setSelected(r.items[0]);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load contests');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    contestsService.meta().then(setMeta);
    employeesSvc.employees().then((r) => setEmployees(r.items));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) { setLeaderboard(null); return; }
    contestsService.leaderboard(selected._id).then(setLeaderboard);
  }, [selected]);

  async function handleDelete(c) {
    if (!confirm(`Delete contest "${c.name}"?`)) return;
    await contestsService.remove(c._id);
    if (selected?._id === c._id) setSelected(null);
    load();
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bank Contests & Leaderboards</h1>
            <p className="text-sm text-slate-500">Track bank contests for loan consulting and watch live leaderboards</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + New Contest
          </button>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Contests {loading && <span className="text-xs text-slate-400">loading…</span>}
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {contests.length === 0 && <div className="p-4 text-sm text-slate-500">No contests yet.</div>}
                {contests.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setSelected(c)}
                    className={`flex w-full items-start justify-between border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50 ${
                      selected?._id === c._id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <span>
                      <div className="font-medium text-slate-800">{c.name}</div>
                      {c.bankName && (
                        <div className="text-xs text-blue-700 font-medium">{c.bankName} {c.productName ? `· ${c.productName}` : ''}</div>
                      )}
                      <div className="text-xs text-slate-500">
                        {formatDate(c.startDate)} → {formatDate(c.endDate)}
                      </div>
                      {c.contestPercentage > 0 && (
                        <div className="text-xs text-emerald-700">{c.contestPercentage}% payout</div>
                      )}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!selected && (
              <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                Select a contest to see its leaderboard.
              </div>
            )}
            {selected && leaderboard && (
              <LeaderboardCard data={leaderboard} contest={selected} onDelete={() => handleDelete(selected)} />
            )}
          </div>
        </div>

        {creating && (
          <CreateContestModal
            meta={meta}
            employees={employees}
            onClose={() => setCreating(false)}
            onCreated={() => { setCreating(false); load(); }}
          />
        )}
      </div>
    </div>
  );
}

function metricLabel(m) {
  if (m === 'DisbursedAmount') return 'Disbursed Amount';
  if (m === 'CommissionEarned') return 'Commission Earned';
  return 'Disbursed Count';
}

function formatScore(metric, score) {
  if (metric === 'DisbursedAmount' || metric === 'CommissionEarned') return formatINR(score);
  return String(score);
}

function LeaderboardCard({ data, contest, onDelete }) {
  const { contest: c, rows } = data;
  const totalScore = rows.reduce((a, r) => a + r.score, 0);
  const targetReached = c.target > 0 ? Math.min(100, Math.round((totalScore / c.target) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{c.name}</h2>
            <p className="text-xs text-slate-500">
              {metricLabel(c.metric)} · {formatDate(c.startDate)} → {formatDate(c.endDate)}
            </p>
            {/* Bank Contest Details */}
            {(contest.bankName || contest.productName) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {contest.bankName && (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    🏦 {contest.bankName}
                  </span>
                )}
                {contest.productName && (
                  <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                    📦 {contest.productName}
                  </span>
                )}
                {contest.contestPercentage > 0 && (
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {contest.contestPercentage}% payout
                  </span>
                )}
              </div>
            )}
            {contest.contestDetails && (
              <p className="mt-2 text-xs text-slate-600">{contest.contestDetails}</p>
            )}
            {contest.description && !contest.contestDetails && (
              <p className="mt-2 text-xs text-slate-600">{contest.description}</p>
            )}
          </div>
          <button onClick={onDelete} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">
            Delete
          </button>
        </div>
        {c.target > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-600">Team total: <strong>{formatScore(c.metric, totalScore)}</strong></span>
              <span className="text-slate-600">Target: <strong>{formatScore(c.metric, c.target)}</strong> ({targetReached}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: `${targetReached}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 text-sm font-semibold text-slate-700">Leaderboard</div>
        {rows.length === 0 && <div className="text-sm text-slate-500">No participants have scored yet.</div>}
        <div className="space-y-1">
          {rows.map((r) => {
            const prize = c.prizes?.find((p) => p.rank === r.rank);
            return (
              <div key={r.userId} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <RankBadge rank={r.rank} />
                  <div>
                    <div className="font-medium text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold tabular-nums text-slate-800">{formatScore(c.metric, r.score)}</div>
                    <div className="text-[10px] text-slate-500">{r.disbursedCount} cases · {formatINR(r.disbursedAmount)}</div>
                  </div>
                  {prize && (
                    <div className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      🏆 {prize.title || `Rank ${prize.rank}`}
                      {prize.rewardAmount > 0 && <> · {formatINR(prize.rewardAmount)}</>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const styles = {
    1: 'bg-yellow-100 text-yellow-800',
    2: 'bg-slate-200 text-slate-700',
    3: 'bg-orange-100 text-orange-800',
  };
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${styles[rank] || 'bg-slate-100 text-slate-600'}`}>
      {rank}
    </div>
  );
}

function CreateContestModal({ meta, employees, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    bankName: '',
    productName: '',
    contestPercentage: '',
    contestDetails: '',
    startDate: toDateInput(new Date()),
    endDate: toDateInput(new Date(Date.now() + 30 * 86400000)),
    metric: 'DisbursedCount',
    target: '',
    participants: [],
    prizes: [
      { rank: 1, title: '1st Place', rewardAmount: '' },
      { rank: 2, title: '2nd Place', rewardAmount: '' },
      { rank: 3, title: '3rd Place', rewardAmount: '' },
    ],
    status: 'Active',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleParticipant(id) {
    setForm((f) => ({
      ...f,
      participants: f.participants.includes(id)
        ? f.participants.filter((p) => p !== id)
        : [...f.participants, id],
    }));
  }

  function setPrize(i, field, value) {
    setForm((f) => {
      const prizes = [...f.prizes];
      prizes[i] = { ...prizes[i], [field]: value };
      return { ...f, prizes };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const target = form.metric === 'DisbursedCount'
        ? parseInt(form.target, 10) || 0
        : rupeesToPaisa(parseFloat(form.target) || 0);
      await contestsService.create({
        name: form.name,
        description: form.description,
        bankName: form.bankName,
        productName: form.productName,
        contestPercentage: parseFloat(form.contestPercentage) || 0,
        contestDetails: form.contestDetails,
        startDate: form.startDate,
        endDate: form.endDate,
        metric: form.metric,
        target,
        participants: form.participants,
        prizes: form.prizes.map((p) => ({
          rank: p.rank,
          title: p.title,
          rewardAmount: rupeesToPaisa(parseFloat(p.rewardAmount) || 0),
        })),
        status: form.status,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">New Bank Contest</h2>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-50">✕</button>
        </div>

        {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Contest Name *</span>
            <input required value={form.name} onChange={set('name')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>

          {/* Bank Contest Info */}
          <Field label="Bank Name">
            <input value={form.bankName} onChange={set('bankName')} placeholder="e.g. HDFC, SBI, ICICI" className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </Field>
          <Field label="Product Name">
            <input value={form.productName} onChange={set('productName')} placeholder="e.g. Home Loan, LAP" className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </Field>
          <Field label="Contest Percentage (%)">
            <input type="number" step="0.01" value={form.contestPercentage} onChange={set('contestPercentage')} placeholder="e.g. 0.5" className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={set('status')} className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
              {meta.statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Contest Details & Description</span>
            <textarea rows={2} value={form.contestDetails} onChange={set('contestDetails')} placeholder="Describe the contest rules, eligibility, and reward details" className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>

          <Field label="Start Date *">
            <input type="date" required value={form.startDate} onChange={set('startDate')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </Field>
          <Field label="End Date *">
            <input type="date" required value={form.endDate} onChange={set('endDate')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </Field>
          <Field label="Metric">
            <select value={form.metric} onChange={set('metric')} className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
              {meta.metrics.map((m) => <option key={m} value={m}>{metricLabel(m)}</option>)}
            </select>
          </Field>
          <Field label={form.metric === 'DisbursedCount' ? 'Target (count)' : 'Target (₹)'}>
            <input type="number" step={form.metric === 'DisbursedCount' ? '1' : '0.01'} value={form.target} onChange={set('target')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </Field>

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Description (internal notes)</span>
            <textarea rows={2} value={form.description} onChange={set('description')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>

          <div className="col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">Participants {form.participants.length > 0 && `(${form.participants.length})`}</div>
            <div className="max-h-28 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
              {employees.length === 0 && <div className="text-xs text-slate-500">No employees found.</div>}
              <div className="grid grid-cols-2 gap-1">
                {employees.map((e) => (
                  <label key={e._id} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={form.participants.includes(e._id)} onChange={() => toggleParticipant(e._id)} />
                    <span className="truncate">{e.name} ({e.role})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-2">
            <div className="mb-1 text-xs font-medium text-slate-600">Prizes</div>
            <div className="space-y-1">
              {form.prizes.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-1">
                  <div className="col-span-1 flex items-center justify-center text-xs font-bold text-slate-500">#{p.rank}</div>
                  <input placeholder="Title" value={p.title} onChange={(e) => setPrize(i, 'title', e.target.value)} className="col-span-7 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                  <input type="number" step="0.01" placeholder="Reward (₹)" value={p.rewardAmount} onChange={(e) => setPrize(i, 'rewardAmount', e.target.value)} className="col-span-4 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {submitting ? 'Creating…' : 'Create Contest'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
