import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth.js';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Cases from './pages/Cases.jsx';
import CasesByStatus from './pages/CasesByStatus.jsx';
import Partners from './pages/Partners.jsx';
import Invoices from './pages/Invoices.jsx';
import Expenses from './pages/Expenses.jsx';
import Salary from './pages/Salary.jsx';
import Reports from './pages/Reports.jsx';
import Insurance from './pages/Insurance.jsx';
import Contests from './pages/Contests.jsx';
import FollowUps from './pages/FollowUps.jsx';
import Settings from './pages/Settings.jsx';
import ReferencePartners from './pages/ReferencePartners.jsx';
import PartPayments from './pages/PartPayments.jsx';
import DisbursementTrackers from './pages/DisbursementTrackers.jsx';


export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/status/:status" element={<CasesByStatus />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/salary" element={<Salary />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/followups" element={<FollowUps />} />
        <Route path="/insurance" element={<Insurance />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reference-partners" element={<ReferencePartners />} />
        <Route path="/part-payments" element={<PartPayments />} />
        <Route path="/disbursement-trackers" element={<DisbursementTrackers />} />

      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
