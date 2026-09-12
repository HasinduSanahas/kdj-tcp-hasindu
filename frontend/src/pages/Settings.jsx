// src/pages/Settings.jsx — Module Admin Panel (Attach/Detach)
// ★ THE KEY PAGE: Toggle switches attach/detach modules in real-time
import { useModules } from '../context/ModuleContext';
import { useState } from 'react';
import { RefreshCw, Puzzle, ScanBarcode, BrainCircuit, IndianRupee,
         CheckCircle, XCircle, Info, Award, BookOpen, Ticket, Briefcase, PieChart } from 'lucide-react';

const ICON_MAP = {
  'scan-barcode':  ScanBarcode,
  'indian-rupee':  IndianRupee,
  'brain-circuit': BrainCircuit,
  'award':         Award,
  'book-open':     BookOpen,
  'ticket':        Ticket,
  'briefcase':     Briefcase,
  'pie-chart':     PieChart,
  'puzzle':        Puzzle,
};

const MODULE_COLORS = {
  attendance:      { bg: '#dbeafe', icon: '#1d4ed8', grad: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
  fee_management:  { bg: '#fef3c7', icon: '#b45309', grad: 'linear-gradient(135deg,#f59e0b,#b45309)' },
  groq_ai_insights:{ bg: '#fce7f3', icon: '#be185d', grad: 'linear-gradient(135deg,#ec4899,#be185d)' },
  exam_grading:    { bg: '#fef08a', icon: '#ca8a04', grad: 'linear-gradient(135deg,#eab308,#ca8a04)' },
  lms_materials:   { bg: '#e0e7ff', icon: '#4f46e5', grad: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  seat_booking:    { bg: '#ffedd5', icon: '#ea580c', grad: 'linear-gradient(135deg,#f97316,#ea580c)' },
  staff_payroll:   { bg: '#ccfbf1', icon: '#0d9488', grad: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  expense_tracker: { bg: '#f3e8ff', icon: '#9333ea', grad: 'linear-gradient(135deg,#a855f7,#9333ea)' },
};

export default function Settings() {
  const { modules, attach, detach, refresh, loading } = useModules();
  const [pending, setPending] = useState({});   // tracks which module is mid-toggle

  const handleToggle = async (mod) => {
    setPending(p => ({ ...p, [mod.module_key]: true }));
    try {
      if (mod.status === 'attached') {
        await detach(mod.module_key);
      } else {
        await attach(mod.module_key);
      }
    } finally {
      setPending(p => ({ ...p, [mod.module_key]: false }));
    }
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>⚙️ Module Settings</h1>
          <p>Attach or detach modules in real-time — zero server restart needed</p>
        </div>
        <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
          <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* ── Architecture Explainer ── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg,#f0f4ff,#faf5ff)',
        border: '1px solid #c7d2fe',
        marginBottom: 28,
        display: 'flex', gap: 16, alignItems: 'flex-start',
      }}>
        <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
            How Attach / Detach Works
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Toggling a module updates its <code style={{ background: '#e0e7ff', padding: '1px 5px', borderRadius: 4 }}>status</code> in
            the <strong>module_registry</strong> table. The backend EventBus reads this before every event dispatch.
            When <strong>detached</strong>, the module's handlers are silently skipped — the Core never crashes.
            The sidebar navigation automatically updates to reflect the current state.
          </p>
        </div>
      </div>

      {/* ── Module Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {modules.map(mod => {
          const IconComponent = ICON_MAP[mod.icon] || Puzzle;
          const colors   = MODULE_COLORS[mod.module_key] || MODULE_COLORS.attendance;
          const attached = mod.status === 'attached';
          const busy     = pending[mod.module_key];
          
          const isComingSoon = ['lms_materials', 'seat_booking', 'staff_payroll', 'expense_tracker'].includes(mod.module_key);

          return (
            <div key={mod.module_key} className={`module-card ${attached ? 'attached' : 'detached'}`} style={{ opacity: isComingSoon ? 0.7 : 1 }}>
              {/* Icon */}
              <div className="module-icon" style={{ background: attached ? colors.grad : isComingSoon ? '#e2e8f0' : '#f1f5f9' }}>
                <IconComponent size={22} style={{ color: attached ? '#fff' : '#94a3b8' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{mod.display_name}</h3>
                  <span className={`badge ${isComingSoon ? 'badge-purple' : attached ? 'badge-green' : 'badge-yellow'}`}>
                    {isComingSoon ? '🚧 coming soon' : attached ? '● attached' : '○ detached'}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>
                    v{mod.version}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {mod.description}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <code style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: '#f1f5f9', color: 'var(--text-muted)',
                  }}>
                    key: {mod.module_key}
                  </code>
                  <code style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 6,
                    background: '#f1f5f9', color: 'var(--text-muted)',
                  }}>
                    route: {mod.frontend_route}
                  </code>
                </div>
              </div>

              {/* ★ Toggle Switch */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 50 }}>
                <label className="toggle" style={{ opacity: busy || isComingSoon ? 0.5 : 1, cursor: isComingSoon ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={attached}
                    disabled={busy || isComingSoon}
                    onChange={() => handleToggle(mod)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
                  {isComingSoon ? 'SOON' : busy ? '...' : attached ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DB Raw Query Preview ── */}
      <div className="card" style={{ marginTop: 28, background: '#0f172a', border: 'none' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          -- What happens in PostgreSQL when you toggle:
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#7dd3fc', lineHeight: 1.9 }}>
          <span style={{ color: '#f472b6' }}>UPDATE</span>{' '}
          <span style={{ color: '#86efac' }}>module_registry</span><br />
          <span style={{ color: '#f472b6' }}>SET</span>{' '}
          <span style={{ color: '#fbbf24' }}>status</span> = <span style={{ color: '#a78bfa' }}>'attached'</span>,{' '}
          <span style={{ color: '#fbbf24' }}>attached_at</span> = <span style={{ color: '#a78bfa' }}>NOW()</span><br />
          <span style={{ color: '#f472b6' }}>WHERE</span>{' '}
          <span style={{ color: '#fbbf24' }}>module_key</span> = <span style={{ color: '#a78bfa' }}>'groq_ai_insights'</span>;
        </p>
      </div>
    </div>
  );
}
