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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Users size={120} />
        </div>
        
        <div className="relative z-10 flex justify-between items-end mb-6">
          <div>
            <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-1">
              Next Game
            </p>
            <h2 className="text-2xl font-bold text-slate-800">
              {targetDay.full}
            </h2>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-semibold">
              {capacity / 2}v{capacity / 2} Format
            </span>
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

      <div className="pt-8 pb-12 text-center">
        <button 
          onClick={handleMatchupAccess}
          className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors border-b border-dashed border-slate-300 hover:border-slate-500 pb-0.5"
        >
          {teamsFinalized ? "View Final Matchup" : "Admin: Generate Teams"}
        </button>
      </div>
    </div>
  );
};
