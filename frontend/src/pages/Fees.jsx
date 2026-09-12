import { useState } from 'react';
import { IndianRupee, CheckCircle, Clock, FileText, Check } from 'lucide-react';

export default function Fees() {
  const [invoices, setInvoices] = useState([
    { id: 'INV-001', student: 'Pasindu Kumara', class_name: '2026 A/L Science', month: 'September 2026', amount: 1500, status: 'paid', date: '2026-09-12' },
    { id: 'INV-002', student: 'YTP', class_name: '2027 A/L Physics', month: 'September 2026', amount: 1500, status: 'pending', date: '-' },
    { id: 'INV-003', student: 'Nethmi Silva', class_name: '2026 O/L Mathematics', month: 'September 2026', amount: 1500, status: 'paid', date: '2026-09-10' },
  ]);

  const [generating, setGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setShowSuccess(false);
    setTimeout(() => {
      setGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const handleMarkPaid = (id) => {
    setInvoices(invoices.map(inv => 
      inv.id === id 
        ? { ...inv, status: 'paid', date: new Date().toISOString().split('T')[0] } 
        : inv
    ));
  };

  const handleDownloadReceipt = (inv) => {
    const receiptHTML = `
      <html>
        <head>
          <title>Receipt - ${inv.id}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; alignItems: center; }
            .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
            .title { font-size: 20px; font-weight: 600; color: #64748b; letter-spacing: 1px; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; line-height: 1.6; }
            .amount-box { text-align: right; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; }
            .amount { font-size: 36px; font-weight: 800; color: #16a34a; margin-top: 5px; }
            .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; padding: 12px; text-align: left; color: #475569; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
            td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">📚 Hasi Tuition</div>
            <div class="title">PAYMENT RECEIPT</div>
          </div>
          <div class="details">
            <div>
              <p style="color: #64748b; margin-bottom: 4px;"><strong>Billed To:</strong></p>
              <p style="font-size: 18px; font-weight: 600; margin: 0;">${inv.student}</p>
              <p style="margin-top: 4px;">Student Account</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Receipt No:</strong> ${inv.id}<br/>
              <strong>Payment Date:</strong> ${inv.date}</p>
              <p><span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">PAID SECURELY</span></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tuition Fee - ${inv.month}<br/><span style="font-size: 12px; color: #64748b;">Class: ${inv.class_name} | Auto-Billing Module</span></td>
                <td style="text-align: right; font-weight: 600;">LKR ${inv.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div class="amount-box">
            <p style="margin: 0; color: #64748b; font-weight: 600;">Total Amount Paid</p>
            <div class="amount">LKR ${inv.amount.toLocaleString()}</div>
          </div>
          <div class="footer">
            <p>Thank you for your prompt payment.</p>
            <p>Generated automatically by Hasi Tuition Management System (EventBus Architecture)</p>
          </div>
          <script>
            window.onload = () => { window.print(); }
          </script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + b.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, b) => a + b.amount, 0);
  const collectionRate = Math.round((totalCollected / (totalCollected + totalPending)) * 100) || 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>💰 Fee Management</h1>
          <p>Digital invoice generation and fee tracking</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showSuccess && (
            <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, animation: 'slideIn 0.3s ease' }}>
              <Check size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/>
              Invoices Generated
            </span>
          )}
          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            <FileText size={16} />
            {generating ? 'Generating via EventBus...' : 'Generate Invoices'}
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Total Collected (Sept)</p>
          <h2 style={{ fontSize: 28, marginTop: 10, color: '#15803d' }}>LKR {totalCollected.toLocaleString()}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Pending Dues</p>
          <h2 style={{ fontSize: 28, marginTop: 10, color: '#b91c1c' }}>LKR {totalPending.toLocaleString()}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Collection Rate</p>
          <h2 style={{ fontSize: 28, marginTop: 10, color: '#4338ca' }}>{collectionRate}%</h2>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>Recent Invoices</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Student</th>
                <th>Class</th>
                <th>Month</th>
                <th>Amount (LKR)</th>
                <th>Status</th>
                <th>Paid On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.id}</td>
                  <td style={{ fontWeight: 600 }}>{inv.student}</td>
                  <td><span className="badge badge-purple">{inv.class_name}</span></td>
                  <td className="text-muted">{inv.month}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount.toLocaleString()}</td>
                  <td>
                    {inv.status === 'paid' ? (
                      <span className="badge badge-green"><CheckCircle size={12} style={{marginRight:4, display:'inline'}}/> Paid</span>
                    ) : (
                      <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}><Clock size={12} style={{marginRight:4, display:'inline'}}/> Pending</span>
                    )}
                  </td>
                  <td className="text-muted">{inv.date}</td>
                  <td>
                    {inv.status === 'paid' ? (
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDownloadReceipt(inv)}>
                        View Receipt
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleMarkPaid(inv.id)}>
                        Mark Paid
                      </button>
                    )}
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
