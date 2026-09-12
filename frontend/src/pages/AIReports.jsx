// src/pages/AIReports.jsx — Groq AI Insights Module Page
import { useState, useEffect } from 'react';
import { getAIJobs, testGroqApi } from '../api/api';
import { BrainCircuit, RefreshCw, Zap, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AIReports() {
  const [jobs,     setJobs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [testing,  setTesting]  = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    getAIJobs()
      .then(r => setJobs(r.data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleTestGroq = async () => {
    setTesting(true); setPreview(null);
    try {
      const res = await testGroqApi();
      setPreview(res.data.preview);
    } catch (err) {
      alert(err.response?.data?.message || 'Groq test failed');
    } finally { setTesting(false); }
  };

  const statusIcon = (s) => {
    if (s === 'completed') return <CheckCircle size={14} style={{ color: 'var(--success)' }} />;
    if (s === 'failed')    return <XCircle     size={14} style={{ color: 'var(--danger)' }} />;
    return <Clock size={14} style={{ color: 'var(--warning)' }} />;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><span className="ai-glow">🤖 Groq AI Insights</span></h1>
          <p>AI-generated personalised progress reports dispatched to parents via email</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleTestGroq} disabled={testing}>
            <Zap size={14} />
            {testing ? 'Generating...' : 'Test Groq API'}
          </button>
        </div>
      </div>

      {/* ── Groq Test Preview ── */}
      {preview && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg,#1e1b4b,#312e81)', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <BrainCircuit size={20} style={{ color: '#a5b4fc' }} />
            <h3 style={{ color: '#e0e7ff', fontSize: 15, fontWeight: 700 }}>
              ✅ Live Groq AI Output — {preview.model}
            </h3>
            <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>
              {preview.tokensUsed} tokens
            </span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: '#818cf8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Subject</p>
            <p style={{ color: '#e0e7ff', fontWeight: 600, fontSize: 14 }}>{preview.subject}</p>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '14px 0' }} />
          <p style={{ fontSize: 11, color: '#818cf8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Email Body</p>
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 16,
            color: '#c7d2fe', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap',
          }}>
            {preview.body}
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Jobs',   value: jobs.length,                                          color: '#6366f1', bg: '#ede9fe' },
          { label: 'Completed',    value: jobs.filter(j => j.status === 'completed').length,    color: '#10b981', bg: '#d1fae5' },
          { label: 'Failed',       value: jobs.filter(j => j.status === 'failed').length,       color: '#ef4444', bg: '#fee2e2' },
          { label: 'Processing',   value: jobs.filter(j => j.status === 'processing').length,   color: '#f59e0b', bg: '#fef3c7' },
        ].map(({ label, value, color, bg }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}>
              <BrainCircuit size={20} style={{ color }} />
            </div>
            <div>
              <div className="value" style={{ color }}>{value}</div>
              <div className="label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Jobs Table ── */}
      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Report Jobs</h3>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <BrainCircuit size={40} />
              <h3>No AI jobs yet</h3>
              <p>Attach Attendance module and check in a student to trigger a job</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Trigger</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}
                      style={{ cursor: 'pointer', background: selected?.id === job.id ? '#f0f4ff' : '' }}
                      onClick={() => setSelected(selected?.id === job.id ? null : job)}
                    >
                      <td style={{ fontWeight: 600 }}>{job.student_name}</td>
                      <td><span className="badge badge-purple" style={{ fontSize: 10 }}>{job.trigger_event}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {statusIcon(job.status)}
                          <span className={`badge ${
                            job.status === 'completed' ? 'badge-green' :
                            job.status === 'failed'    ? 'badge-red'   : 'badge-yellow'
                          }`} style={{ fontSize: 10 }}>{job.status}</span>
                        </div>
                      </td>
                      <td className="text-muted text-sm">
                        {new Date(job.triggered_at).toLocaleTimeString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Selected Job AI Content ── */}
        <div className="card">
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Report Content</h3>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>STUDENT</p>
                <p style={{ fontWeight: 700 }}>{selected.student_name}</p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>TRIGGER EVENT</p>
                <span className="badge badge-purple">{selected.trigger_event}</span>
              </div>
              {selected.groq_response ? (
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>AI-GENERATED EMAIL</p>
                  <div style={{
                    background: '#f8fafc', border: '1px solid var(--border)',
                    borderRadius: 10, padding: 16, fontSize: 13, lineHeight: 1.8,
                    whiteSpace: 'pre-wrap', color: 'var(--text)', maxHeight: 320, overflowY: 'auto',
                  }}>
                    {selected.groq_response}
                  </div>
                </div>
              ) : selected.error_message ? (
                <div style={{ background: '#fee2e2', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 12, color: '#991b1b' }}>❌ Error: {selected.error_message}</p>
                </div>
              ) : (
                <p className="text-muted text-sm">Processing...</p>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <BrainCircuit size={40} />
              <h3>Select a job</h3>
              <p>Click any row to view its AI-generated email content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
