import { ShieldAlert } from 'lucide-react';
import { PlayerItem } from './PlayerItem';

/**
 * The "Waitlist" card — only renders when there are waitlisted players.
 * Renders the exact same JSX as App.jsx lines 843–874.
 */
export const WaitlistCard = ({ waitlistPlayers, onRemove }) => {
  if (waitlistPlayers.length === 0) return null;

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">
          <ShieldAlert size={24} style={{ color: 'var(--warning)' }} />
          Waitlist
        </h2>
        <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: 'var(--warning)' }}>
          {waitlistPlayers.length}
        </span>
      </div>

      <div className="player-list">
        {waitlistPlayers.map((player, index) => (
          <PlayerItem
            key={player.id}
            player={player}
            index={index}
            label={`WL${index + 1}`}
            isWaitlist={true}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
};
