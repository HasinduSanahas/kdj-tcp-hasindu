// src/App.jsx — Root router + layout shell
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModuleProvider, useModules } from './context/ModuleContext';
import Sidebar   from './components/Sidebar';
import Toast     from './components/Toast';
import Dashboard from './pages/Dashboard';
import Students  from './pages/Students';
import Teachers  from './pages/Teachers';
import Classes   from './pages/Classes';
import Settings  from './pages/Settings';
import Attendance from './pages/Attendance';
import AIReports  from './pages/AIReports';
import Fees       from './pages/Fees';
import Exams      from './pages/Exams';
import ComingSoon from './pages/ComingSoon';

// ── Module-Gated Route ────────────────────────────────────────────────────────
// Renders a "module not active" message if the required module is detached
function ModuleRoute({ moduleKey, children }) {
  const { isAttached, loading } = useModules();
  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div>;
  if (!isAttached(moduleKey)) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 32px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Module Not Active</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          The <strong>{moduleKey.replace(/_/g, ' ')}</strong> module is currently{' '}
          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>detached</span>.
          Go to Settings to activate it.
        </p>
        <a href="/settings" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          ⚙️ Go to Module Settings
        </a>
      </div>
    );
  }
  return children;
}

// ── App Shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/classes"  element={<Classes />} />
          <Route path="/settings" element={<Settings />} />

          {/* Module-gated routes */}
          <Route path="/attendance" element={ <ModuleRoute moduleKey="attendance"><Attendance /></ModuleRoute> } />
          <Route path="/ai-reports" element={ <ModuleRoute moduleKey="groq_ai_insights"><AIReports /></ModuleRoute> } />
          <Route path="/fees"       element={ <ModuleRoute moduleKey="fee_management"><Fees /></ModuleRoute> } />
          <Route path="/exams"      element={ <ModuleRoute moduleKey="exam_grading"><Exams /></ModuleRoute> } />
          <Route path="/lms"          element={ <ModuleRoute moduleKey="lms_materials"><ComingSoon title="📚 LMS & Material Hub" /></ModuleRoute> } />
          <Route path="/seat-booking" element={ <ModuleRoute moduleKey="seat_booking"><ComingSoon title="🎟️ Seat Booking Engine" /></ModuleRoute> } />
          <Route path="/staff"        element={ <ModuleRoute moduleKey="staff_payroll"><ComingSoon title="💼 Staff & Payroll" /></ModuleRoute> } />
          <Route path="/expenses"     element={ <ModuleRoute moduleKey="expense_tracker"><ComingSoon title="📈 Expense & Profit Tracker" /></ModuleRoute> } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ModuleProvider>
        <AppShell />
      </ModuleProvider>
    </BrowserRouter>
  );
}
