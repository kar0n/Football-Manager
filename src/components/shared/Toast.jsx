import React from 'react';
import { CheckCircle } from 'lucide-react';

export const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
      padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600,
      zIndex: 9999, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      animation: 'fadeInDown 0.3s ease-out'
    }}>
      <CheckCircle size={18} />
      {message}
    </div>
  );
};
