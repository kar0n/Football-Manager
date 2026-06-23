import React from 'react';
import { ShieldAlert, Users } from 'lucide-react';

export const Header = () => {
  return (
    <header className="mb-8 text-center pt-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
          <ShieldAlert className="text-white" size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
          Weekday Football
        </h1>
      </div>
      <p className="text-slate-500 text-lg">Assemble the squad. Create a team</p>
    </header>
  );
};
