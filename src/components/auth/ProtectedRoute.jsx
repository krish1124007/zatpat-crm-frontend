import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/auth.js';

export default function ProtectedRoute({ children, roles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        Forbidden — your role ({user.role}) cannot access this page.
      </div>
    );
  }

  return children;
}
