import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NEW_INQUIRY_STATUSES } from '../../utils/constants.js';
import { dashboardService } from '../../services/dashboard.service.js';


// Each pipeline entry is one page; the former folder sub-tabs are now in-page
// filters (see CasesByStatus). `statusSum` drives the count badge where it can
// be summed from the status breakdown.
const CASE_NAV = [
  { to: '/cases/status/active', label: 'New Inquiry', icon: '🆕', statusSum: NEW_INQUIRY_STATUSES },
  { to: '/followups', label: 'Follow-ups', icon: '🔔' },
  { to: '/cases/status/login', label: 'Login', icon: '📁', statusSum: ['Under Login Query', 'Login done - under process', 'Sanctioned'] },
  { to: '/cases/status/disbursed', label: 'Disbursed', icon: '✅', statusSum: ['Disbursed'] },
  { to: '/cases/status/ni', label: 'NI', icon: '🚫', statusSum: ['Rejected', 'Not interested'] },
];

// Static links that live above / below the cases section.
const TOP_NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/cases', label: 'All Cases', icon: '📋' },
  { to: '/recycle-bin', label: 'Recycle Bin', icon: '🗑️' },
];

const BOTTOM_NAV = [
  { type: 'divider', label: 'Tracking' },
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

const linkClass = ({ isActive }) =>
  `mb-0.5 flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition ${
    isActive ? 'bg-brand-50 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-100'
  }`;

export default function Sidebar({ open, onClose }) {
  const [counts, setCounts] = useState({});

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
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose} className={linkClass}>
              <span className="text-sm">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}

          {/* Pipeline group pages */}
          <div className="mb-0.5 mt-3 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Pipeline
          </div>
          {CASE_NAV.map((item) => {
            const badge = item.statusSum
              ? item.statusSum.reduce((a, s) => a + (counts[s] || 0), 0)
              : undefined;
            return (
              <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
                <span className="text-sm">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                    {badge}
                  </span>
                )}
              </NavLink>
            );
          })}

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
              <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
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
