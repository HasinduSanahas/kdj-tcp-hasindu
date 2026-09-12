import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, Calendar, Users, UserPlus, CheckCircle } from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([
    { id: '1be66268-09ae-4e06-9c3c-60cf02d2ff08', class_name: '2026 A/L Science - Theory', subject: 'Science', teacher: 'Pasindu Kumara', day: 'Sunday', time: '08:00 AM', capacity: 300, enrolled: 145 },
    { id: '2c5b3b9f-4d9a-4c9b-8e2a-7b3b9f4d9a4c', class_name: '2026 O/L Mathematics - Revision', subject: 'Mathematics', teacher: 'Kamal Perera', day: 'Saturday', time: '14:00 PM', capacity: 150, enrolled: 120 },
    { id: '3d6c4c0g-5e0b-5d0c-9f3b-8c4c0g5e0b5d', class_name: '2027 A/L Physics - Theory', subject: 'Physics', teacher: 'Nethmi Silva', day: 'Monday', time: '15:30 PM', capacity: 200, enrolled: 50 },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [enrollModal, setEnrollModal] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newClass = {
      id: 'c' + Date.now(),
      class_name: fd.get('class_name'),
      subject: fd.get('subject'),
      teacher: fd.get('teacher'),
      day: fd.get('day'),
      time: fd.get('time'),
      capacity: parseInt(fd.get('capacity') || '30'),
      enrolled: 0
    };
    setClasses([newClass, ...classes]);
    setShowForm(false);
  };

  const handleEnrollStudent = () => {
    setClasses(classes.map(c => 
      c.id === enrollModal.id ? { ...c, enrolled: c.enrolled + 1 } : c
    ));
    setEnrollModal(null);
    setShowSuccess(`Student successfully enrolled in ${enrollModal.class_name}!`);
    setTimeout(() => setShowSuccess(''), 4000);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🏫 Classes & Enrollments</h1>
          <p>Core Engine — Schedule classes, map teachers, and track enrollments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={16} /> Create Class
        </button>
      </div>

      {showSuccess && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <CheckCircle size={16} />
          {showSuccess}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 20, animation: 'slideIn 0.2s ease-out' }}>
          <h3 style={{ marginBottom: 16 }}>Create New Class</h3>
          <form onSubmit={handleAdd}>
            <div className="grid-2">
              <div className="input-group">
                <label>Class Name *</label>
                <input name="class_name" className="input" required placeholder="e.g. 2026 A/L IT" />
              </div>
              <div className="input-group">
                <label>Subject *</label>
                <input name="subject" className="input" required placeholder="e.g. IT" />
              </div>
              <div className="input-group">
                <label>Assign Teacher *</label>
                <select name="teacher" className="input" required>
                  <option value="Pasindu Kumara">Pasindu Kumara (Science)</option>
                  <option value="Kamal Perera">Kamal Perera (Mathematics)</option>
                  <option value="Nethmi Silva">Nethmi Silva (Physics)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Schedule Day</label>
                <select name="day" className="input">
                  <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
                  <option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
                </select>
              </div>
              <div className="input-group">
                <label>Time</label>
                <input name="time" type="time" className="input" required />
              </div>
              <div className="input-group">
                <label>Max Capacity</label>
                <input name="capacity" type="number" className="input" defaultValue="50" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" className="btn btn-primary">Save Class</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {enrollModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 400, animation: 'slideIn 0.2s ease-out' }}>
            <h3 style={{ marginBottom: 8 }}>Enroll Student</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Add a student to <strong>{enrollModal.class_name}</strong>
            </p>
            
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Select Student</label>
              <select className="input">
                <option>Pasindu Kumara (STU-001)</option>
                <option>Nethmi Silva (STU-002)</option>
                <option>YTP Demo (STU-003)</option>
                <option>Kasun Perera (STU-004)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary w-full" onClick={handleEnrollStudent}>
                <UserPlus size={16} /> Confirm Enrollment
              </button>
              <button className="btn btn-ghost" onClick={() => setEnrollModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="input-group" style={{ position: 'relative', width: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 36 }} 
              placeholder="Search classes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Class Info</th>
                <th>Teacher</th>
                <th>Schedule</th>
                <th>Enrollments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.filter(c => c.class_name.toLowerCase().includes(search.toLowerCase())).map(c => (
                <tr key={c.id}>
                  <td>
                    <p style={{ fontWeight: 600, color: 'var(--text)' }}>{c.class_name}</p>
                    <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>ID: {c.id}</p>
                  </td>
                  <td>
                    <span className="badge badge-purple">{c.teacher}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 13 }}>{c.day} at {c.time}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 13 }}>{c.enrolled} / {c.capacity}</span>
                    </div>
                    <div style={{ width: '100%', background: '#e2e8f0', height: 4, borderRadius: 2, marginTop: 6 }}>
                      <div style={{ width: `${(c.enrolled/c.capacity)*100}%`, background: '#3b82f6', height: '100%', borderRadius: 2 }}></div>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: 6, marginRight: 4, color: '#0ea5e9' }} onClick={() => setEnrollModal(c)} title="Enroll Student">
                      <UserPlus size={14} />
                    </button>
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
