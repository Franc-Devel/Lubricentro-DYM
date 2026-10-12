import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAuth();

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#47664F" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'error':
        return <AlertCircle size={18} color="#ef4444" />;
      default:
        return <Info size={18} color="#895522" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type || 'info'}`}>
          {getIcon(toast.type)}
          <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
