import { X } from 'lucide-react';
import { formatTime } from '../../utils/time';

/**
 * A single player row in the roster list.
 * Used by both ConfirmedList and WaitlistCard.
 *
 * Renders the exact same JSX and CSS classes as App.jsx lines 857–870 (waitlist)
 * and lines 898–911 (confirmed).
 */
export const PlayerItem = ({ player, index, label, isWaitlist, onRemove }) => {
  return (
    <div className="player-item" style={isWaitlist ? { opacity: 0.85 } : {}}>
      <div className="player-info">
        <span className="player-number" style={{ fontSize: '0.75rem' }}>
          {label}
        </span>
        <div className="player-details">
          <span className="player-name">{player.name}</span>
          <span className="player-meta">
            Joined at {formatTime(player.joinedAt)}
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(player.id, player.name)}
        className="remove-btn"
        title="Remove Player"
      >
        <X size={18} />
      </button>
    </div>
  );
};
