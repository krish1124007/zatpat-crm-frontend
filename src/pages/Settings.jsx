import { useEffect, useState } from 'react';
import { adminService } from '../services/admin.service.js';
import { formatDateTime } from '../utils/format.js';
import { useAuth } from '../store/auth.js';

const TABS = [
  { key: 'staff', label: 'Staff Management', icon: '👥' },
  { key: 'whitelist', label: 'IP Whitelist', icon: '🛡️' },
  { key: 'audit', label: 'Audit Log', icon: '📜' },
  { key: 'backup', label: 'Backup', icon: '💾' },
];

const ROLES = ['Employee', 'Manager', 'Admin'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('staff');

  const isAdmin = user && (user.role === 'Admin' || user.role === 'SuperAdmin');

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          Settings require Admin or SuperAdmin role.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mb-4 text-sm text-slate-500">Staff management, security, audit, and data tools</p>

        <div className="mb-4 flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'border-b-2 border-brand text-brand'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'staff' && <StaffTab />}
        {tab === 'whitelist' && <IPWhitelistTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'backup' && <BackupTab />}
      </div>
    </div>
  );
}

function StaffTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await adminService.listUsers();
      setUsers(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(u) {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(u._id);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete');
    }
  }

  async function handleToggleActive(u) {
    try {
      await adminService.updateUser(u._id, { isActive: !u.isActive });
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{users.length} staff member{users.length === 1 ? '' : 's'}</div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Add Staff Member
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Last Login</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="p-4 text-slate-500">Loading…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={7} className="p-4 text-slate-500">No users.</td></tr>}
            {users.map((u) => (
              <tr key={u._id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{u.phone}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    u.role === 'SuperAdmin' ? 'bg-red-50 text-red-700' :
                    u.role === 'Admin' ? 'bg-purple-50 text-purple-700' :
                    u.role === 'Manager' ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleToggleActive(u)}
                    disabled={u.role === 'SuperAdmin'}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    } ${u.role === 'SuperAdmin' ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {u.isActive ? '● Active' : '○ Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  {u.role !== 'SuperAdmin' && (
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => { setEditing(u); setShowForm(true); }}
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <StaffModal
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function StaffModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    password: '',
    role: initial?.role || 'Employee',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await adminService.updateUser(initial._id, payload);
      } else {
        await adminService.createUser(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-2 py-0.5 text-sm text-slate-600 hover:bg-slate-50">✕</button>
        </div>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-slate-600">Full Name *</span>
            <input required value={form.name} onChange={set('name')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Email *</span>
            <input required type="email" value={form.email} onChange={set('email')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Phone *</span>
            <input required value={form.phone} onChange={set('phone')} className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Password {isEdit ? '(leave blank to keep)' : '*'}
            </span>
            <input
              type="password"
              required={!isEdit}
              minLength={6}
              value={form.password}
              onChange={set('password')}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              placeholder={isEdit ? '••••••' : 'Min 6 characters'}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Role *</span>
            <select value={form.role} onChange={set('role')} className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
          Login credentials: staff will use their <strong>email</strong> + <strong>password</strong> to sign in.
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {submitting ? 'Saving…' : isEdit ? 'Update' : 'Create Staff'}
          </button>
        </div>
      </form>
    </div>
  );
}

function IPWhitelistTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ip: '', label: '' });
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await adminService.listIPs();
      setItems(r.items);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.ip) return;
    try {
      await adminService.addIP({ ip: form.ip, label: form.label });
      setForm({ ip: '', label: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add');
    }
  }

  async function toggle(item) {
    await adminService.updateIP(item._id, { isActive: !item.isActive });
    load();
  }

  async function remove(item) {
    if (!confirm(`Remove IP ${item.ip}?`)) return;
    await adminService.removeIP(item._id);
    load();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="grid grid-cols-12 gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <input placeholder="IP address" value={form.ip} onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))} className="col-span-5 rounded-md border border-slate-300 px-2 py-1.5 text-sm font-mono" />
        <input placeholder="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="col-span-5 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <button type="submit" className="col-span-2 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">+ Add</button>
      </form>

      {error && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}

      <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {loading && <div className="p-4 text-sm text-slate-500">Loading…</div>}
        {!loading && items.length === 0 && <div className="p-4 text-sm text-slate-500">No IPs whitelisted.</div>}
        {items.map((it) => (
          <div key={it._id} className="flex items-center justify-between border-b border-slate-100 p-3 last:border-0">
            <div>
              <div className="font-mono text-sm font-medium text-slate-800">{it.ip}</div>
              <div className="text-xs text-slate-500">{it.label || '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(it)} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${it.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {it.isActive ? '● Active' : '○ Disabled'}
              </button>
              <button onClick={() => remove(it)} className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTab() {
  const [items, setItems] = useState([]);
  const [actions, setActions] = useState([]);
  const [filter, setFilter] = useState({ action: '', userEmail: '', status: '' });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filter.action) params.action = filter.action;
      if (filter.userEmail) params.userEmail = filter.userEmail;
      if (filter.status) params.status = filter.status;
      const r = await adminService.auditLogs(params);
      setItems(r.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { adminService.auditFacets().then((r) => setActions(r.actions)); }, []);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select value={filter.action} onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <option value="">All actions</option>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
        <input placeholder="Filter by email" value={filter.userEmail} onChange={(e) => setFilter((f) => ({ ...f, userEmail: e.target.value }))} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failure">Failures</option>
        </select>
        <span className="ml-auto self-center text-xs text-slate-500">{items.length} entries</span>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Resource</th>
              <th className="px-3 py-2 text-left">IP</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3 text-slate-500" colSpan={6}>Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td className="p-3 text-slate-500" colSpan={6}>No entries.</td></tr>}
            {items.map((it) => (
              <tr key={it._id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-1.5 tabular-nums text-slate-600">{formatDateTime(it.createdAt)}</td>
                <td className="px-3 py-1.5 text-slate-800">{it.userEmail || '—'}</td>
                <td className="px-3 py-1.5 font-medium text-slate-700">{it.action}</td>
                <td className="px-3 py-1.5 text-slate-600">{it.resource || '—'}</td>
                <td className="px-3 py-1.5 font-mono text-slate-500">{it.ip || '—'}</td>
                <td className="px-3 py-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${it.status === 'failure' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {it.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BackupTab() {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Backups contain <strong>all customer data</strong>. Store securely.
      </div>
      <div className="rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <div className="text-4xl">💾</div>
        <h3 className="mt-2 text-lg font-semibold text-slate-800">Full Database Snapshot</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Downloads a JSON file containing every collection.
        </p>
        <a
          href={adminService.backupUrl()}
          className="mt-4 inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          download
        >
          Download Backup (.json)
        </a>
      </div>
    </div>
  );
}
