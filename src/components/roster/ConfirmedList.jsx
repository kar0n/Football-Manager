import { Users, Zap, ArrowRight } from 'lucide-react';
import { PlayerItem } from './PlayerItem';

/**
 * The "Confirmed" players card.
 * Renders the exact same JSX as App.jsx lines 876–925.
 */
export const ConfirmedList = ({
  confirmedPlayers,
  capacity,
  targetDay,
  matchup,
  onRemove,
  onMatchupAccess,
}) => {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Users size={24} />
          Confirmed - {targetDay.short}
        </h2>
        <span
          className="badge"
          style={confirmedPlayers.length === capacity ? { background: 'var(--accent-primary)', color: 'white', boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)' } : {}}
        >
          {confirmedPlayers.length} / {capacity}
          {capacity === 10 && ' (5v5)'}
          {capacity === 14 && ' (7v7)'}
          {capacity === 18 && ' (9v9)'}
        </span>
      </div>

      <div className="player-list">
        {confirmedPlayers.length === 0 ? (
          <p className="empty-state">No players confirmed yet.</p>
        ) : (
          confirmedPlayers.map((player, index) => (
            <PlayerItem
              key={player.id}
              player={player}
              index={index}
              label={index + 1}
              isWaitlist={false}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {confirmedPlayers.length === capacity && (
        <button className="action-btn" onClick={onMatchupAccess}>
          {matchup ? (
            <><ArrowRight size={20} /> View Matchup</>
          ) : (
            <><Zap size={20} /> Generate Teams</>
          )}
        </button>
      )}
    </section>
  );
};
