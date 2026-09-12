// src/components/Sidebar.jsx
// ★ THE DYNAMIC SIDEBAR — Heart of the Frontend Architecture
// Reads attachedModules from context → renders nav items conditionally
import { NavLink, useLocation } from 'react-router-dom';
import { useModules } from '../context/ModuleContext';
import {
  LayoutDashboard, Users, Settings, ScanBarcode,
  BrainCircuit, IndianRupee, Puzzle, Wifi,
  Award, BookOpen, Ticket, Briefcase, PieChart,
  GraduationCap, CalendarDays
} from 'lucide-react';

// Icon map — matches module_registry.icon values
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

// CORE nav items — always visible (no module check)
const CORE_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users,           label: 'Students' },
  { to: '/teachers', icon: GraduationCap,   label: 'Teachers' },
  { to: '/classes',  icon: CalendarDays,    label: 'Classes & Enrollments' },
];

export default function Sidebar() {
  const { attachedModules, modules, loading } = useModules();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 18 }}>📚</span>
          </div>
          <div>
            <h1>Hasi Tuition</h1>
            <p>Class Management</p>
          </div>
        </div>
      </div>

      {/* ── Core Navigation ── */}
      <div className="sidebar-section-label">Core</div>
      {CORE_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}

      {/* ── Dynamic Module Navigation ── */}
      <div className="sidebar-section-label" style={{ marginTop: 8 }}>
        Active Modules
        {loading && <span className="pulse" style={{ marginLeft: 6 }}>⟳</span>}
      </div>

      {/* ★ KEY FEATURE: Only render nav items for ATTACHED modules */}
      {attachedModules.length === 0 && !loading && (
        <div style={{ padding: '8px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
          No modules attached yet.
          <br />Go to <strong>Settings</strong> to activate.
        </div>
      )}

      {attachedModules.map((mod) => {
        const IconComponent = ICON_MAP[mod.icon] || Puzzle;
        return (
          <NavLink
            key={mod.module_key}
            to={mod.frontend_route}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <IconComponent size={17} />
            {mod.display_name}
            <span className="module-chip">ON</span>
          </NavLink>
        );
      })}

      {/* ── Settings (always visible) ── */}
      <div style={{ marginTop: 'auto' }}>
        <div className="sidebar-section-label">System</div>
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={17} />
          Module Settings
          {modules.length > 0 && (
            <span className="nav-badge">{modules.length}</span>
          )}
        </NavLink>

        {/* Online indicator */}
        <div style={{
          margin: '16px 20px 20px',
          padding: '10px 14px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Wifi size={14} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>
            Backend Online
          </span>
        </div>
      </div>
    </aside>
  );
}
