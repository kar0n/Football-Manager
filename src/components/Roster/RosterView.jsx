import React from 'react';
import { PlayerList } from './PlayerList';
import { JoinButton } from './JoinButton';
import { getTargetGameDay } from '../../utils/timeUtils';
import { Users } from 'lucide-react';

export const RosterView = ({ 
  allPlayers, 
  capacity, 
  isAdmin, 
  addPlayer, 
  removePlayer, 
  handleMatchupAccess, 
  teamsFinalized 
}) => {
  const confirmedPlayers = allPlayers.slice(0, capacity);
  const waitlistPlayers = allPlayers.slice(capacity);
  const targetDay = getTargetGameDay();

  return (
    <div className="main-content">
      <div className="card">
        
        <div className="card-header">
          <div>
            <h2 className="card-title">
              {targetDay.full}
            </h2>
          </div>
          <div className="badge">
            {capacity / 2}v{capacity / 2} Format
          </div>
        </div>

        <JoinButton 
          isAdmin={isAdmin} 
          addPlayer={addPlayer} 
          disabled={teamsFinalized && !isAdmin} 
        />
      </div>

      <PlayerList 
        confirmedPlayers={confirmedPlayers}
        waitlistPlayers={waitlistPlayers}
        capacity={capacity}
        removePlayer={removePlayer}
      />

      <div style={{ textAlign: 'center', paddingTop: '1rem', paddingBottom: '3rem' }}>
        <button 
          onClick={handleMatchupAccess}
          style={{ background: 'none', border: 'none', borderBottom: '1px dashed var(--text-muted)', color: 'var(--text-muted)', paddingBottom: '0.2rem', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          {teamsFinalized ? "View Final Matchup" : "Admin: Generate Teams"}
        </button>
      </div>
    </div>
  );
};
