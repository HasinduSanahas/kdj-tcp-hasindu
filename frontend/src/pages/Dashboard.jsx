// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useModules } from '../context/ModuleContext';
import { getStudents, getAIJobs } from '../api/api';
import { Users, Puzzle, BrainCircuit, TrendingUp, Activity, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { modules, attachedModules, isAttached } = useModules();
  const [students, setStudents] = useState([]);
  const [aiJobs,   setAIJobs]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getStudents().then(r => setStudents(r.data.students || [])),
      isAttached('groq_ai_insights')
        ? getAIJobs().then(r => setAIJobs(r.data.jobs || []))
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, []);

  const activeCount  = attachedModules.length;
  const totalModules = modules.length;
  const aiJobsDone   = aiJobs.filter(j => j.status === 'completed').length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <h1>👋 Welcome to Hasi Tuition</h1>
        <p>Event-Driven Modular Class Management System</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe' }}>
            <Users size={22} style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <div className="value">{loading ? '—' : students.length}</div>
            <div className="label">Total Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <Puzzle size={22} style={{ color: '#059669' }} />
          </div>
          <div>
            <div className="value" style={{ color: 'var(--success)' }}>
              {activeCount}/{totalModules}
            </div>
            <div className="label">Modules Active</div>
          </div>
        </div>

        {isAttached('groq_ai_insights') && (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fce7f3' }}>
              <BrainCircuit size={22} style={{ color: '#be185d' }} />
            </div>
            <div>
              <div className="value" style={{ color: '#be185d' }}>{aiJobsDone}</div>
              <div className="label">AI Reports Sent</div>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Zap size={22} style={{ color: '#d97706' }} />
          </div>
          <div>
            <div className="value" style={{ color: '#d97706' }}>Live</div>
            <div className="label">Event Bus Status</div>
          </div>
        </div>
      </div>

      {/* ── Two column grid ── */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Module Status Panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Module Registry</h2>
            <Link to="/settings" className="btn btn-ghost btn-sm">Manage →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {modules.map(mod => (
              <div key={mod.module_key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: mod.status === 'attached' ? '#f0fdf4' : '#f8fafc',
                borderRadius: 10,
                border: `1px solid ${mod.status === 'attached' ? '#bbf7d0' : 'var(--border)'}`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: mod.status === 'attached' ? 'var(--success)' : '#cbd5e1',
                  boxShadow: mod.status === 'attached' ? '0 0 6px var(--success)' : 'none',
                }} />
                <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{mod.display_name}</span>
                <span className={`badge ${mod.status === 'attached' ? 'badge-green' : 'badge-yellow'}`}>
                  {mod.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Info */}
        <div className="card" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', border: 'none' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#c7d2fe', marginBottom: 16 }}>
            ⚡ Event-Driven Architecture
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🎯', label: 'Student checks in via QR', color: '#a5b4fc' },
              { icon: '📡', label: 'EventBus emits attendance_logged', color: '#818cf8' },
              { icon: '🔍', label: 'Registry checks: is groq_ai_insights attached?', color: '#6366f1' },
              { icon: '🤖', label: 'Groq AI generates progress email', color: '#4f46e5' },
              { icon: '📧', label: 'NodeMailer sends to guardian', color: '#4338ca' },
            ].map(({ icon, label, color }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, color, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 20, padding: '12px 14px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 10, fontSize: 12, color: '#a5b4fc',
            fontFamily: 'monospace',
          }}>
            EventBus.emit("attendance_logged", payload)<br />
            → registry.isAttached("groq_ai_insights")<br />
            → groqAI.handleAttendanceLogged(payload)
          </div>
        </div>
      </div>

      {/* ── Recent AI Jobs ── */}
      {isAttached('groq_ai_insights') && aiJobs.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              <span className="ai-glow">🤖 Recent AI Reports</span>
            </h2>
            <Link to="/ai-reports" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Triggered By</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {aiJobs.slice(0, 5).map(job => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 600 }}>{job.student_name}</td>
                    <td><span className="badge badge-purple">{job.trigger_event}</span></td>
                    <td>
                      <span className={`badge ${
                        job.status === 'completed' ? 'badge-green' :
                        job.status === 'failed'    ? 'badge-red'   : 'badge-yellow'
                      }`}>{job.status}</span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(job.triggered_at).toLocaleTimeString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
