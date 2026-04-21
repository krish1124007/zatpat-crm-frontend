import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth.js';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { login, status, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await login(identifier, password);
    if (ok) navigate(from, { replace: true });
  }

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg ring-1 ring-slate-200"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand">ZatpatLoans CRM</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>

        <label className="mb-3 block">
          <span className="text-sm font-medium text-slate-700">Email or Phone</span>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>

        <label className="mb-4 block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>

        {error && (
          <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
