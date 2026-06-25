import { GripVertical } from 'lucide-react';

/**
 * A pure visual representation of a player chip in the matchup grid.
 * Used both as the inline item and as the DragOverlay ghost.
 * Renders the exact same JSX as the original App.jsx lines 10–38.
 */
export const PlayerItemVisual = ({ player, index, teamColor, teamName, isOverlay, isAdmin, dragListeners, dragAttributes, isCompact }) => {
  const overlayStyle = isOverlay ? {
    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
    transform: 'scale(1.02)',
    cursor: 'grabbing',
    opacity: 1,
    zIndex: 9999
  } : {};

  return (
    <div className={`player-item ${isCompact ? 'player-item-compact' : ''}`} style={overlayStyle}>
      <div className="player-info">
        {isAdmin && !isCompact && (
          <div
            className="drag-handle"
            style={{ cursor: isOverlay ? 'grabbing' : 'grab', touchAction: 'none', padding: '0.5rem', margin: '-0.5rem 0.5rem -0.5rem -0.25rem' }}
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical size={18} />
          </div>
        )}
        <span className="player-number" style={{ background: teamColor, color: teamName === 'Team White' ? '#0f172a' : 'white', border: teamName === 'Team White' ? '1.5px solid #0f172a' : '1.5px solid transparent' }}>{index + 1}</span>
        <span className="player-name">{player.name}</span>
      </div>
    </div>
  );
};
