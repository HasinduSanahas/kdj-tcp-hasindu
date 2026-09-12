import { Award, Upload, TrendingUp, BarChart2, X } from 'lucide-react';
import { useState } from 'react';

export default function Exams() {
  const [selectedReport, setSelectedReport] = useState(null);

  const dummyMarks = [
    { id: 1, student: 'Pasindu Kumara', marks: 92, rank: 1, trend: '+5', ai: "Outstanding performance! Pasindu has mastered organic chemistry equations. Keep up the good work." },
    { id: 2, student: 'YTP', marks: 88, rank: 2, trend: '+2', ai: "Great progress this month. Need to focus slightly more on time management during MCQs." },
    { id: 3, student: 'Nethmi Silva', marks: 75, rank: 3, trend: '-3', ai: "Marks dropped slightly due to the mechanics section. Recommending extra revision on Newton's laws." },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>🏆 Exam & Grading System</h1>
          <p>Monthly marks analysis and automated ranking (Demo Mode)</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("Excel uploaded successfully! AI is analyzing the marks...")}>
          <Upload size={16} />
          Upload Excel Marks
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Class Average</p>
          <h2 style={{ fontSize: 28, marginTop: 10, color: '#4f46e5' }}>85.0%</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Highest Mark</p>
          <h2 style={{ fontSize: 28, marginTop: 10, color: '#15803d' }}>92 (Pasindu)</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>AI Analysis Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
             <span className="badge badge-purple" style={{ fontSize: 13 }}>Processed</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>September Term Test Results</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Marks</th>
                <th>Grade</th>
                <th>Progress Trend</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dummyMarks.map(m => (
                <tr key={m.id}>
                  <td>
                    {m.rank === 1 ? '🥇 ' : m.rank === 2 ? '🥈 ' : m.rank === 3 ? '🥉 ' : ''} 
                    <span style={{ fontWeight: 800 }}>#{m.rank}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.student}</td>
                  <td style={{ fontSize: 16, fontWeight: 700 }}>{m.marks}</td>
                  <td>
                    <span className={`badge ${m.marks > 80 ? 'badge-green' : m.marks > 60 ? 'badge-purple' : ''}`}>
                       {m.marks > 80 ? 'A' : m.marks > 60 ? 'B' : 'C'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: m.trend.startsWith('+') ? '#15803d' : '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={14} style={{ transform: m.trend.startsWith('-') ? 'rotate(180deg)' : 'none' }} />
                      {m.trend}%
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setSelectedReport(m)}>
                       <BarChart2 size={14} style={{ display: 'inline', marginRight: 4 }}/> View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Report Modal */}
      {selectedReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, maxWidth: '90%', animation: 'slideIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, margin: 0 }}>📈 AI Performance Report</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setSelectedReport(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#0f172a' }}>{selectedReport.student}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Marks</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#4f46e5' }}>{selectedReport.marks}%</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Class Rank</p>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>#{selectedReport.rank}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Trend</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: selectedReport.trend.startsWith('+') ? '#15803d' : '#b91c1c' }}>
                    {selectedReport.trend}%
                  </p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>🤖 AI Generated Insight</p>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 24, padding: 12, background: '#fdf4ff', borderRadius: 8, borderLeft: '3px solid #d8b4fe' }}>
              {selectedReport.ai}
            </p>

            <button className="btn btn-primary w-full" onClick={() => setSelectedReport(null)}>
              Close Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
