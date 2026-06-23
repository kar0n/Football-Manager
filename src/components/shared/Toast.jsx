import React from 'react';
import { CheckCircle } from 'lucide-react';

export const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-emerald-500 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-emerald-500/30 flex items-center gap-2 animate-[slideUp_0.3s_ease-out]">
      <CheckCircle size={18} />
      {message}
    </div>
  );
};
