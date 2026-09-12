import { useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, BookOpen } from 'lucide-react';

export default function Teachers() {
  const [teachers, setTeachers] = useState([
    { id: 't1', full_name: 'Pasindu Kumara', email: 'pasindu@hasi.com', phone: '0771234567', subject: 'Science', status: 'Active' },
    { id: 't2', full_name: 'Kamal Perera', email: 'kamal@hasi.com', phone: '0719876543', subject: 'Mathematics', status: 'Active' },
    { id: 't3', full_name: 'Nethmi Silva', email: 'nethmi@hasi.com', phone: '0701122334', subject: 'Physics', status: 'Active' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newTeacher = {
      id: 't' + Date.now(),
      full_name: fd.get('full_name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      subject: fd.get('subject'),
      status: 'Active'
    };
    setTeachers([newTeacher, ...teachers]);
    setShowForm(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>👨‍🏫 Teachers</h1>
          <p>Core Engine — Manage academic staff and subject allocations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={16} /> Add Teacher
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, animation: 'slideIn 0.2s ease-out' }}>
          <h3 style={{ marginBottom: 16 }}>Register New Teacher</h3>
          <form onSubmit={handleAdd}>
            <div className="grid-2">
              <div className="input-group">
                <label>Full Name *</label>
                <input name="full_name" className="input" required placeholder="e.g. Dr. Sunil" />
              </div>
              <div className="input-group">
                <label>Subject Specialization *</label>
                <input name="subject" className="input" required placeholder="e.g. Chemistry" />
              </div>
              <div className="input-group">
                <label>Email *</label>
                <input name="email" type="email" className="input" required placeholder="teacher@email.com" />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input name="phone" className="input" placeholder="077..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary">Save Teacher</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="input-group" style={{ position: 'relative', width: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 36 }} 
              placeholder="Search teachers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Teacher Profile</th>
                <th>Subject</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.filter(t => t.full_name.toLowerCase().includes(search.toLowerCase())).map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--text)' }}>{t.full_name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>ID: {t.id}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{t.subject}</span></td>
                  <td>
                    <p style={{ fontSize: 13 }}>{t.email}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.phone}</p>
                  </td>
                  <td><span className="badge badge-green">{t.status}</span></td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: 6, marginRight: 4 }}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: 6, color: '#ef4444' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
