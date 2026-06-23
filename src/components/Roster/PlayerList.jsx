import React from 'react';
import { X } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';

export const PlayerList = ({ confirmedPlayers, waitlistPlayers, capacity, removePlayer }) => {
  
  const renderPlayer = (player, index, isWaitlist = false) => (
    <div 
      key={player.id} 
      className={`flex items-center justify-between p-4 rounded-xl mb-3 border transition-all hover:translate-x-1 ${
        isWaitlist 
          ? 'bg-slate-50 border-slate-200' 
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          isWaitlist ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {isWaitlist ? (capacity + index + 1) : (index + 1)}
        </span>
        <div>
          <span className={`font-semibold ${isWaitlist ? 'text-slate-600' : 'text-slate-800'}`}>
            {player.name}
          </span>
          <div className="text-xs text-slate-400 mt-0.5">
            Joined {formatTime(player.joinedAt)}
          </div>
        </div>
      </div>
      <button 
        onClick={() => removePlayer(player.id)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Remove player"
      >
        <X size={18} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-bold text-slate-800">Confirmed Playing</h2>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
            {confirmedPlayers.length} / {capacity}
          </span>
        </div>
        
        {confirmedPlayers.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            No players joined yet. Be the first!
          </div>
        ) : (
          <div className="player-list">
            {confirmedPlayers.map((p, i) => renderPlayer(p, i, false))}
          </div>
        )}
      </div>

      {waitlistPlayers.length > 0 && (
        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-50 px-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Waitlist ({waitlistPlayers.length})
            </span>
          </div>
          <div className="mt-6">
            {waitlistPlayers.map((p, i) => renderPlayer(p, i, true))}
          </div>
        </div>
      )}
    </div>
  );
};
