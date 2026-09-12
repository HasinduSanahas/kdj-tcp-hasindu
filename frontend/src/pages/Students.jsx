import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api/api';
import { useModules } from '../context/ModuleContext';
import { UserPlus, Search, User, Edit2, Trash2, QrCode } from 'lucide-react';

export default function Students() {
  const { isAttached } = useModules();
  const [students, setStudents]       = useState([]);
  const [loading,  setLoading]        = useState(true);
  const [search,   setSearch]         = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [saving,   setSaving]         = useState(false);
  const [editId,   setEditId]         = useState(null);
  const [viewQr,   setViewQr]         = useState(null);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    guardian_name: '', guardian_email: '',
  });

  const load = () => {
    setLoading(true);
    getStudents()
      .then(r => setStudents(r.data.students || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateStudent(editId, form);
      } else {
        await createStudent(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ full_name: '', email: '', phone: '', guardian_name: '', guardian_email: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving student');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({ full_name: s.full_name, email: s.email, phone: s.phone, guardian_name: s.guardian_name, guardian_email: s.guardian_email });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteStudent(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting student');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>👨‍🎓 Students</h1>
          <p>Core module — always available regardless of attached modules</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditId(null);
          setForm({ full_name: '', email: '', phone: '', guardian_name: '', guardian_email: '' });
          setShowForm(f => !f);
        }}>
          <UserPlus size={16} />
          Add Student
        </button>
      </div>

      {/* ── Add/Edit Student Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>{editId ? 'Edit Student' : 'Register New Student'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div className="input-group">
                <label>Full Name *</label>
                <input className="input" required value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="e.g. Arjun Kumar" />
              </div>
              <div className="input-group">
                <label>Email *</label>
                <input className="input" type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@email.com" />
              </div>
              <div className="input-group">
                <label>Phone</label>
                <input className="input" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 20 }}>
              <div className="input-group">
                <label>Guardian Name</label>
                <input className="input" value={form.guardian_name}
                  onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))}
                  placeholder="Parent / Guardian name" />
              </div>
              <div className="input-group">
                <label>Guardian Email <span style={{ color: 'var(--primary)', fontSize: 11 }}>(AI reports sent here)</span></label>
                <input className="input" type="email" value={form.guardian_email}
                  onChange={e => setForm(f => ({ ...f, guardian_email: e.target.value }))}
                  placeholder="guardian@email.com" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Student' : 'Register Student'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input className="input" style={{ border: 'none', padding: 0, flex: 1, outline: 'none', fontSize: 14 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} students</span>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <User size={48} />
            <h3>No students found</h3>
            <p>Register your first student using the button above</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student (ID)</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Guardian</th>
                  {isAttached('groq_ai_insights') && <th>AI Report</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <span style={{ fontWeight: 600 }}>{s.full_name}</span>
                           <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted text-sm">{s.email}</td>
                    <td className="text-muted text-sm">{s.phone || '—'}</td>
                    <td style={{ fontSize: 13 }}>
                      {s.guardian_name || '—'}
                      {s.guardian_email && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.guardian_email}</div>
                      )}
                    </td>
                    {isAttached('groq_ai_insights') && (
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>
                          🤖 AI Ready
                        </span>
                      </td>
                    )}
                    <td>
                      <button className="btn btn-ghost" style={{ padding: 6, marginRight: 4, color: '#0ea5e9' }} onClick={() => setViewQr(s)} title="Download QR">
                        <QrCode size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: 6, marginRight: 4 }} onClick={() => handleEdit(s)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: 6, color: '#ef4444' }} onClick={() => handleDelete(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {viewQr && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 350, textAlign: 'center', animation: 'slideIn 0.2s ease-out' }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Student QR Card</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{viewQr.full_name}</p>
            
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, display: 'inline-block', marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${viewQr.id}`} 
                alt="QR Code" 
                style={{ width: 200, height: 200 }} 
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary w-full" onClick={() => {
                window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${viewQr.id}`, '_blank');
              }}>
                Open / Download QR
              </button>
              <button className="btn btn-ghost" onClick={() => setViewQr(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
