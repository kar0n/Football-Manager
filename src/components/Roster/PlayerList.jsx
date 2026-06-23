import React from 'react';
import { X } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';

export const PlayerList = ({ confirmedPlayers, waitlistPlayers, capacity, removePlayer }) => {
  
  const renderPlayer = (player, index, isWaitlist = false) => (
    <div 
      key={player.id} 
      className={`player-item ${isWaitlist ? '' : 'confirmed'}`}
      style={isWaitlist ? { opacity: 0.7, borderStyle: 'dashed' } : {}}
    >
      <div className="player-info">
        <span className="player-number">
          {isWaitlist ? (capacity + index + 1) : (index + 1)}
        </span>
        <div className="player-details">
          <span className="player-name">
            {player.name}
          </span>
          <div className="player-meta">
            Joined {formatTime(player.joinedAt)}
          </div>
        </div>
      </div>
      <button 
        onClick={() => removePlayer(player.id)}
        className="remove-btn"
        title="Remove player"
      >
        <X size={18} />
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Confirmed Playing</h2>
          <span className="badge">
            {confirmedPlayers.length} / {capacity}
          </span>
        </div>
        
        {confirmedPlayers.length === 0 ? (
          <div className="empty-state">
            No players joined yet. Be the first!
          </div>
        ) : (
          <div className="player-list">
            {confirmedPlayers.map((p, i) => renderPlayer(p, i, false))}
          </div>
        )}
      </div>

      {waitlistPlayers.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ color: 'var(--text-muted)' }}>Waitlist ({waitlistPlayers.length})</h2>
          </div>
          <div className="player-list">
            {waitlistPlayers.map((p, i) => renderPlayer(p, i, true))}
          </div>
        </div>
      )}
    </div>
  );
};
