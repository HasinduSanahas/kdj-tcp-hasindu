// src/components/Toast.jsx
import { useModules } from '../context/ModuleContext';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toasts } = useModules();
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(({ id, message, type }) => (
        <div key={id} className={`toast ${type}`}>
          {type === 'success' && <CheckCircle size={16} />}
          {type === 'error'   && <XCircle    size={16} />}
          {type === 'info'    && <Info       size={16} />}
          {message}
        </div>
      ))}
    </div>
  );
}
