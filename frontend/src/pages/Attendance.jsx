import { useState, useEffect } from 'react';
import { openSession, closeSession, checkIn, getSessionLogs } from '../api/api';
import { useModules } from '../context/ModuleContext';
import { ScanBarcode, UserCheck, XCircle, CheckCircle, Users } from 'lucide-react';

export default function Attendance() {
  const { isAttached } = useModules();

  const [session,     setSession]     = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [classId,     setClassId]     = useState('1be66268-09ae-4e06-9c3c-60cf02d2ff08'); // Dummy Demo Class
  const [studentId,   setStudentId]   = useState('');
  const [checkMethod, setMethod]      = useState('qr');
  const [loading,     setLoading]     = useState(false);
  const [closing,     setClosing]     = useState(false);
  const [status,      setStatus]      = useState('');
  const [statusType,  setStatusType]  = useState('success');
  const [eventStream, setEventStream] = useState([]);
  const [scanning,    setScanning]    = useState(false);

  const DUMMY_CLASSES = [
    { id: '1be66268-09ae-4e06-9c3c-60cf02d2ff08', name: '2026 A/L Science - Theory (Pasindu Sir)' },
    { id: '2c5b3b9f-4d9a-4c9b-8e2a-7b3b9f4d9a4c', name: '2026 O/L Mathematics - Revision (Nethmi)' },
    { id: '3d6c4c0g-5e0b-5d0c-9f3b-8c4c0g5e0b5d', name: '2027 A/L Physics - Theory (Kamal)' }
  ];

  // Poll for logs if session is active
  useEffect(() => {
    let interval;
    if (session) {
      interval = setInterval(async () => {
        try {
          const res = await getSessionLogs(session.id);
          setLogs(res.data.logs);
        } catch (err) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [session]);

  // Handle QR Scanner
  useEffect(() => {
    if (!scanning) return;
    
    const scanner = new window.Html5QrcodeScanner("reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 10 
    }, false);

    scanner.render((text) => {
      scanner.clear();
      setScanning(false);
      
      if (!session) {
        setClassId(text);
      } else {
        setStudentId(text);
        setMethod('qr');
      }
    }, (err) => {
      // ignore continuous scan errors
    });

    return () => {
      try {
        scanner.clear();
      } catch (e) {}
    };
  }, [scanning, session]);

  const showStatus = (msg, type = 'success') => {
    setStatus(msg); setStatusType(type);
    setTimeout(() => setStatus(''), 4000);
  };

  const handleOpenSession = async () => {
    if (!classId.trim()) return showStatus('Please enter a Class ID', 'error');
    setLoading(true);
    try {
      const res = await openSession(classId.trim());
      setSession(res.data.session);
      const logsRes = await getSessionLogs(res.data.session.id);
      setLogs(logsRes.data.logs || []);
      showStatus(res.data.message);
    } catch (err) {
      showStatus(err.response?.data?.message || 'Failed to open session', 'error');
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    if (!studentId.trim()) return showStatus('Please enter a Student ID', 'error');
    setLoading(true);
    setEventStream([]); // Reset stream
    try {
      const res = await checkIn(session.id, studentId.trim(), checkMethod);
      showStatus(res.data.message);
      setStudentId('');
      
      // Refresh logs
      const logsRes = await getSessionLogs(session.id);
      setLogs(logsRes.data.logs || []);

      // ✨ NEXT LEVEL DEMO EFFECT: Simulate the EventBus firing across all modules
      const steps = [
        { icon: '📡', text: 'Core emitted "attendance_logged" event', delay: 200 },
        { icon: '🤖', text: 'Groq AI generating personalized progress report...', delay: 800 },
        { icon: '✉️', text: 'NodeMailer dispatched email to Guardian', delay: 1500 },
        { icon: '💰', text: 'Fee Management: LKR 1000 deducted from monthly balance', delay: 2100 },
        { icon: '📚', text: "LMS Hub: Unlocked today's PDF notes & video for student", delay: 2800 },
        { icon: '🏆', text: 'Exam System: +5 attendance points added to leaderboard', delay: 3500 },
      ];

      steps.forEach((step) => {
        setTimeout(() => {
          setEventStream(prev => [...prev, step]);
        }, step.delay);
      });

    } catch (err) {
      showStatus(err.response?.data?.message || 'Check-in failed', 'error');
    } finally { setLoading(false); }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const res = await closeSession(session.id);
      showStatus(res.data.message);
      setSession(null); setLogs([]); setEventStream([]);
    } catch (err) {
      showStatus(err.response?.data?.message || 'Failed to close', 'error');
    } finally { setClosing(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>📋 Attendance Tracker</h1>
        <p>Open a session, scan QR / enter Student ID to check in — fires the EventBus on every check-in</p>
      </div>

      {/* Status message */}
      {status && (
        <div className={`alert ${statusType === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ marginBottom: 20 }}>
          {statusType === 'error'
            ? <XCircle size={16} />
            : <CheckCircle size={16} />}
          {status}
        </div>
      )}

      <div className="grid-2" style={{ gap: 24 }}>
        {/* ── Left: Session Control ── */}
        <div>
          {!session ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Open Attendance Session</h3>
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 8px', color: '#0ea5e9' }} onClick={() => setScanning(!scanning)}>
                  <ScanBarcode size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {scanning ? 'Hide Scanner' : 'Use Camera'}
                </button>
              </div>

              {scanning ? (
                <div style={{ marginBottom: 20 }}>
                  <div id="reader" style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}></div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                    Point camera at Student QR Card
                  </p>
                </div>
              ) : (
                <div className="input-group" style={{ marginBottom: 16 }}>
                  <label>Select Class</label>
                  <select className="input" value={classId} onChange={e => setClassId(e.target.value)}>
                    {DUMMY_CLASSES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {!scanning && (
                <button className="btn btn-primary w-full" onClick={handleOpenSession} disabled={loading}>
                  <ScanBarcode size={16} />
                  {loading ? 'Opening...' : 'Open Session for Today'}
                </button>
              )}
            </div>
          ) : (
            <div className="card">
              {/* Session active header */}
              <div style={{
                background: 'linear-gradient(135deg,#10b981,#059669)',
                margin: '-24px -24px 20px', padding: '16px 20px', borderRadius: '14px 14px 0 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#d1fae5', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>SESSION ACTIVE</p>
                    <p style={{ color: '#fff', fontSize: 13 }}>
                      {new Date(session.session_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 18 }}>🟢</span>
                  </div>
                </div>
              </div>

              {/* Check-in form */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Student ID</label>
                <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 6px', color: '#0ea5e9' }} onClick={() => setScanning(!scanning)}>
                  {scanning ? 'Hide Scanner' : 'Use Camera'}
                </button>
              </div>

              {scanning && (
                 <div style={{ marginBottom: 12 }}>
                   <div id="reader" style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}></div>
                 </div>
              )}

              <div className="input-group" style={{ marginBottom: 12 }}>
                <input className="input" value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
                  placeholder="Paste student UUID or scan barcode..." />
              </div>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <select className="input" value={checkMethod} onChange={e => setMethod(e.target.value)}>
                  <option value="qr">QR Code</option>
                  <option value="barcode">Barcode</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <button className="btn btn-primary w-full" style={{ marginBottom: 10 }}
                onClick={handleCheckIn} disabled={loading}>
                <UserCheck size={16} />
                {loading ? 'Processing...' : '⚡ Check In (fires EventBus event)'}
              </button>

              <button className="btn btn-ghost w-full" onClick={handleClose} disabled={closing}>
                {closing ? 'Closing...' : 'Close Session'}
              </button>
            </div>
          )}

          {/* EventBus Magic Visualizer */}
          <div className="card" style={{ marginTop: 16, background: '#1e1b4b', color: '#fff', border: '1px solid #3730a3' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 12 }}>
              ⚡ EventBus Live Stream
            </p>
            {eventStream.length === 0 ? (
              <p style={{ fontSize: 12, color: '#6366f1', fontStyle: 'italic' }}>
                Waiting for check-in to trigger events...
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {eventStream.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    animation: 'slideIn 0.3s ease-out forwards',
                    padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
                    borderRadius: 8, borderLeft: '3px solid #818cf8'
                  }}>
                    <span style={{ fontSize: 16 }}>{ev.icon}</span>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#e0e7ff' }}>{ev.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Check-in Logs ── */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              <Users size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Today's Check-ins
            </h3>
            <span className="badge badge-green">{logs.length} present</span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <UserCheck size={36} />
              <h3 style={{ fontSize: 15 }}>No check-ins yet</h3>
              <p>Students will appear here as they check in</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: '#f0fdf4',
                  borderRadius: 10, border: '1px solid #bbf7d0',
                  animation: 'slideIn 0.2s ease',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#10b981,#059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{log.student_name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.student_email}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>{log.method}</span>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(log.checked_in_at).toLocaleTimeString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
