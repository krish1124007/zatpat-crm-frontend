import { NavLink } from 'react-router-dom';
import { STATUS_COLORS } from '../../utils/constants.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/cases', label: 'All Cases', icon: '📋' },
  { type: 'divider', label: 'By Status' },
  { to: '/cases/status/Query', label: 'Query', icon: '🔵', statusDot: 'Query' },
  { to: '/cases/status/ReadyLogin', label: 'Ready Login', icon: '🔷', statusDot: 'ReadyLogin' },
  { to: '/cases/status/Hold', label: 'Hold', icon: '🟡', statusDot: 'Hold' },
  { to: '/cases/status/LoginDone', label: 'Login Done', icon: '🔹', statusDot: 'LoginDone' },
  { to: '/cases/status/UnderProcess', label: 'Under Process', icon: '🟠', statusDot: 'UnderProcess' },
  { to: '/cases/status/BankFinalized', label: 'Bank Finalized', icon: '🔵', statusDot: 'BankFinalized' },
  { to: '/cases/status/Sanctioned', label: 'Sanctioned', icon: '🟢', statusDot: 'Sanctioned' },
  { to: '/cases/status/Disbursed', label: 'Disbursed', icon: '✅', statusDot: 'Disbursed' },
  { to: '/cases/status/Rejected', label: 'Rejected', icon: '🔴', statusDot: 'Rejected' },
  { to: '/cases/status/Cancelled', label: 'Cancelled', icon: '⭕', statusDot: 'Cancelled' },
  { to: '/cases/status/NotInterested', label: 'Not Interested', icon: '⬜', statusDot: 'NotInterested' },
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

export default function Sidebar({ open, onClose }) {
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
          {NAV.map((item, i) => {
            if (item.type === 'divider') {
              return (
                <div key={i} className="mb-0.5 mt-3 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {item.label}
                </div>
              );
            }
            const sc = item.statusDot ? STATUS_COLORS[item.statusDot] : null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition ${
                    isActive
                      ? 'bg-brand-50 font-semibold text-brand'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {sc ? (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: sc.fg }}
                  />
                ) : (
                  <span className="text-sm">{item.icon}</span>
                )}
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
