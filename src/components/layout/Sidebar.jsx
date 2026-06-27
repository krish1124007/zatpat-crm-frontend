import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { STATUS_COLORS, ACTIVE_PIPELINE_STATUSES } from '../../utils/constants.js';
import { dashboardService } from '../../services/dashboard.service.js';


// Disbursed leaves: filter by disbursementType (Full/Part) + a banker-stage flag.
function disbursedLeaves(type) {
  const base = `/cases/status/Disbursed?disbursementType=${type}`;
  return [
    { to: `${base}&handoverConfirmation=Done`, label: 'Handover Done' },
    { to: `${base}&handoverConfirmation=Pending`, label: 'Handover Pending' },
    { to: `${base}&bankerConfirmation=Done`, label: 'Banker Confirmation Done' },
    { to: `${base}&bankerConfirmation=Pending`, label: 'Banker Confirmation Pending' },
    { to: `${base}&invoiceStatus=Done`, label: 'Invoices Done' },
    { to: `${base}&invoiceStatus=Pending`, label: 'Invoices Pending' },
  ];
}

// Folder tree for the cases section. `status` is used for the count badge.
const CASE_NAV = [
  { type: 'link', to: '/cases/status/active', label: 'New Inquiry', icon: '🆕', statusSum: ACTIVE_PIPELINE_STATUSES },
  {
    type: 'folder', label: 'Login', icon: '📁',
    children: [
      { type: 'link', to: '/cases/status/Under Login Query', label: 'Under Login Query', status: 'Under Login Query' },
      { type: 'link', to: '/cases/status/Login done - under process', label: 'Login done - under process', status: 'Login done - under process' },
      { type: 'link', to: '/cases/status/Sanctioned', label: 'Sanctioned', status: 'Sanctioned' },
    ],
  },
  {
    type: 'folder', label: 'Disbursed', icon: '📁',
    children: [
      { type: 'folder', label: 'Full Disbursed', icon: '📂', children: disbursedLeaves('Full').map((l) => ({ type: 'link', ...l })) },
      { type: 'folder', label: 'Part Disbursed', icon: '📂', children: disbursedLeaves('Part').map((l) => ({ type: 'link', ...l })) },
    ],
  },
  {
    type: 'folder', label: 'Invoices', icon: '📁',
    children: [
      { type: 'link', to: '/cases/status/invoices?paymentStatus=done', label: 'Payment Done' },
      { type: 'link', to: '/cases/status/invoices?paymentStatus=pending', label: 'Payment Pending' },
      { type: 'link', to: '/cases/status/invoices?gstStatus=Received', label: 'GST Done' },
      { type: 'link', to: '/cases/status/invoices?gstStatus=Pending', label: 'GST Pending' },
    ],
  },
  {
    type: 'folder', label: 'NI', icon: '📁',
    children: [
      { type: 'link', to: '/cases/status/Rejected', label: 'Rejected', status: 'Rejected' },
      { type: 'link', to: '/cases/status/Not interested', label: 'Not interested', status: 'Not interested' },
    ],
  },
];

// Static links that live above / below the cases tree.
const TOP_NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/cases', label: 'All Cases', icon: '📋' },
  { to: '/recycle-bin', label: 'Recycle Bin', icon: '🗑️' },
];

const BOTTOM_NAV = [
  { type: 'divider', label: 'Tracking' },
  { to: '/followups', label: 'Follow-ups', icon: '🔔' },
  { to: '/reference-partners', label: 'Reference Partners', icon: '👥' },
  { type: 'divider', label: 'Finance' },
  { to: '/partners', label: 'Partners', icon: '🤝' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/expenses', label: 'Expenses', icon: '💸' },
  { to: '/salary', label: 'Salary', icon: '💰' },
  { to: '/reports', label: 'Reports (P&L · GST)', icon: '📈' },
  { type: 'divider', label: 'More' },
  { to: '/insurance', label: 'Insurance', icon: '🛡️' },
  { to: '/contests', label: 'Contests', icon: '🏆' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

// Pure active check that also understands query-string sub-filters.
function isActiveLink(to, loc) {
  const [path, query = ''] = to.split('?');
  if (decodeURIComponent(loc.pathname) !== path) return false;
  if (!query) return true;
  const cur = new URLSearchParams(loc.search);
  const want = new URLSearchParams(query);
  for (const [k, v] of want) {
    if (cur.get(k) !== v) return false;
  }
  return true;
}

function subtreeHasActive(node, loc) {
  if (node.type === 'link') return isActiveLink(node.to, loc);
  return (node.children || []).some((c) => subtreeHasActive(c, loc));
}

function LeafLink({ item, depth, counts, loc, onClose }) {
  const active = isActiveLink(item.to, loc);
  const sc = item.status ? STATUS_COLORS[item.status] : null;
  // Badge count: a single status, or the sum across a group of statuses.
  let badge;
  if (item.status && counts[item.status] !== undefined) {
    badge = counts[item.status];
  } else if (item.statusSum) {
    const total = item.statusSum.reduce((a, s) => a + (counts[s] || 0), 0);
    if (total > 0) badge = total;
  }
  return (
    <Link
      to={item.to}
      onClick={onClose}
      style={{ paddingLeft: 12 + depth * 14 }}
      className={`mb-0.5 flex items-center gap-2 rounded-md py-1.5 pr-3 text-[13px] transition ${
        active ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {sc ? (
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sc.fg }} />
      ) : item.icon ? (
        <span className="text-sm">{item.icon}</span>
      ) : (
        <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
      )}
      <span className="truncate">{item.label}</span>
      {badge !== undefined && (
        <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
          {badge}
        </span>
      )}
    </Link>
  );
}

function FolderNode({ node, depth, counts, loc, onClose }) {
  const containsActive = subtreeHasActive(node, loc);
  const [open, setOpen] = useState(containsActive);

  // Auto-open when navigation lands inside this folder.
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ paddingLeft: 12 + depth * 14 }}
        className={`mb-0.5 flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-[13px] transition ${
          containsActive ? 'font-semibold text-brand' : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span className="text-sm">{node.icon || '📁'}</span>
        <span className="truncate">{node.label}</span>
        <span className={`ml-auto text-[10px] text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={child.to || child.label || i} node={child} depth={depth + 1} counts={counts} loc={loc} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, depth, counts, loc, onClose }) {
  if (node.type === 'folder') {
    return <FolderNode node={node} depth={depth} counts={counts} loc={loc} onClose={onClose} />;
  }
  return <LeafLink item={node} depth={depth} counts={counts} loc={loc} onClose={onClose} />;
}

export default function Sidebar({ open, onClose }) {
  const [counts, setCounts] = useState({});
  const loc = useLocation();

  useEffect(() => {
    dashboardService.statusBreakdown().then((res) => {
      const map = {};
      (res.items || []).forEach((it) => {
        map[it.status] = it.count;
      });
      setCounts(map);
    }).catch(console.error);
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-60 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="text-lg font-bold text-brand">ZatpatLoans</div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Loan CRM</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {/* Top static links */}
          {TOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `mb-0.5 flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition ${
                  isActive ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span className="text-sm">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}

          {/* Cases folder tree */}
          <div className="mb-0.5 mt-3 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Pipeline
          </div>
          {CASE_NAV.map((node, i) => (
            <TreeNode key={node.to || node.label || i} node={node} depth={0} counts={counts} loc={loc} onClose={onClose} />
          ))}

          {/* Bottom static links */}
          {BOTTOM_NAV.map((item, i) => {
            if (item.type === 'divider') {
              return (
                <div key={`d-${i}`} className="mb-0.5 mt-3 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {item.label}
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition ${
                    isActive ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <span className="text-sm">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 px-3 py-2 text-[10px] text-slate-400">
          Press <kbd className="rounded border border-slate-300 px-1">⌘K</kbd> to search
        </div>
      </aside>
    </>
  );
}
