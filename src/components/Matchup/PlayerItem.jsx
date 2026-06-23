import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export const PlayerItemVisual = ({ player, index, teamColor, teamName, isOverlay, isAdmin, dragListeners, dragAttributes, isCompact }) => {
  const overlayStyle = isOverlay ? {
    boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
    transform: 'scale(1.02)',
    cursor: 'grabbing',
    opacity: 1,
    zIndex: 9999
  } : {};

  return (
    <div 
      className={`player-item ${isCompact ? 'player-item-compact' : ''}`}
      style={overlayStyle}
    >
      <div className="player-info">
        {isAdmin && !isCompact && (
          <div 
            className="drag-handle"
            style={{ cursor: isOverlay ? 'grabbing' : 'grab' }}
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical size={18} />
          </div>
        )}
        <span 
          className="player-number"
          style={{ background: teamColor, color: teamName === 'Team White' ? '#0f172a' : 'white' }}
        >
          {index + 1}
        </span>
        <span className="player-name">
          {player.name}
        </span>
      </div>
    </div>
  );
};

export const SortablePlayerItem = ({ player, index, teamColor, teamName, isAdmin, isCompact }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isCompact && isAdmin ? 'grab' : 'default'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...(isCompact && isAdmin ? attributes : {})} 
      {...(isCompact && isAdmin ? listeners : {})}
    >
      <PlayerItemVisual 
        player={player} 
        index={index} 
        teamColor={teamColor} 
        teamName={teamName} 
        isAdmin={isAdmin}
        isCompact={isCompact}
        dragListeners={!isCompact && isAdmin ? listeners : undefined}
        dragAttributes={!isCompact && isAdmin ? attributes : undefined}
      />
    </div>
  );
};
