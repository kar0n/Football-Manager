import React from 'react';
import { ShieldAlert, Users } from 'lucide-react';

export const Header = () => {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <ShieldAlert className="header-icon" size={36} />
        <h1 className="title">Weekday Football</h1>
      </div>
      <p className="subtitle">Assemble the squad. Create a team</p>
    </header>
  );
};
