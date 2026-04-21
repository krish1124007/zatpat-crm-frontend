import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service.js';
import { formatINR, formatDate } from '../../utils/format.js';

// Global command palette. Mounted once in AppLayout. Open via Cmd/Ctrl+K.
export default function SuperSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Cmd/Ctrl+K to toggle, Esc to close.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQ('');
      setGroups([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setGroups([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      adminService
        .search(q.trim())
        .then((r) => {
          setGroups(r.groups || []);
          setActiveIdx(0);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  // Flatten for arrow-key navigation.
  const flat = [];
  for (const g of groups) for (const it of g.items) flat.push({ group: g.type, item: it });

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && flat[activeIdx]) {
      e.preventDefault();
      go(flat[activeIdx]);
    }
  }

  function go(entry) {
    const path = {
      case: '/cases',
      partner: '/partners',
      invoice: '/invoices',
      insurance: '/insurance',
    }[entry.group];
    if (path) navigate(path);
    setOpen(false);
  }

  if (!open) return null;

  let runningIdx = 0;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 p-3">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search cases, partners, invoices, insurance…"
            className="w-full bg-transparent px-2 py-1 text-base outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && <div className="p-4 text-center text-sm text-slate-500">Searching…</div>}
          {!loading && q.length < 2 && (
            <div className="p-4 text-center text-xs text-slate-400">
              Type at least 2 characters. <kbd className="rounded border border-slate-300 px-1">↑</kbd>{' '}
              <kbd className="rounded border border-slate-300 px-1">↓</kbd> to navigate,{' '}
              <kbd className="rounded border border-slate-300 px-1">↵</kbd> to open.
            </div>
          )}
          {!loading && q.length >= 2 && groups.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">No matches.</div>
          )}
          {groups.map((g) => (
            <div key={g.type}>
              <div className="bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {g.label}
              </div>
              {g.items.map((it) => {
                const idx = runningIdx++;
                const active = idx === activeIdx;
                return (
                  <button
                    key={`${g.type}-${it._id}`}
                    onClick={() => go({ group: g.type, item: it })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                      active ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {renderResult(g.type, it)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderResult(type, it) {
  if (type === 'case') {
    return (
      <>
        <span>
          <span className="font-mono text-xs text-slate-400">#{it.srNo}</span>{' '}
          <span className="font-medium text-slate-800">{it.customerName}</span>{' '}
          <span className="text-xs text-slate-500">{it.phone}</span>
        </span>
        <span className="text-xs text-slate-500">{it.bankName} · {it.currentStatus}</span>
      </>
    );
  }
  if (type === 'partner') {
    return (
      <>
        <span className="font-medium text-slate-800">{it.name}</span>
        <span className="text-xs text-slate-500">
          {it.phone} · {it.commissionPercent || 0}% {it.isActive ? '' : '(inactive)'}
        </span>
      </>
    );
  }
  if (type === 'invoice') {
    return (
      <>
        <span>
          <span className="font-mono text-xs text-slate-700">{it.invoiceNo}</span>{' '}
          <span className="text-slate-600">{it.snapshot?.partnerName || '—'}</span>
        </span>
        <span className="text-xs text-slate-500">
          {formatDate(it.date)} · {formatINR(it.totalAmount)} · {it.status}
        </span>
      </>
    );
  }
  if (type === 'insurance') {
    return (
      <>
        <span className="font-medium text-slate-800">{it.customerName}</span>
        <span className="text-xs text-slate-500">
          {it.type} · {it.insurer} · {it.status}
        </span>
      </>
    );
  }
  return null;
}
