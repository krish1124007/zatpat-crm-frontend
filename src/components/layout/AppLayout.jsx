import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import SuperSearch from '../common/SuperSearch.jsx';
import { useAuth } from '../../store/auth.js';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm md:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="text-sm text-slate-500">
              Welcome, <span className="font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 md:flex md:items-center md:gap-1"
              title="Open command palette (⌘K)"
            >
              <span>🔍</span>
              <span>Search</span>
              <kbd className="ml-1 rounded border border-slate-200 bg-slate-50 px-1 text-[10px]">⌘K</kbd>
            </button>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand">
              {user?.role}
            </span>
            <button
              onClick={logout}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden bg-slate-50">
          <Outlet />
        </main>
      </div>
      <SuperSearch />
    </div>
  );
}
