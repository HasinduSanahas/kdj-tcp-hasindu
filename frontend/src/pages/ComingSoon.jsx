import { Construction } from 'lucide-react';

export default function ComingSoon({ title }) {
  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        <p>Future Module</p>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '80px 20px', marginTop: 20 }}>
        <Construction size={56} style={{ color: '#8b5cf6', marginBottom: 20, margin: '0 auto' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Under Construction</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
          This module is currently in development and will be unlocked in the final production release.
        </p>
      </div>
    </div>
  );
}
