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
      className={`bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between shadow-sm transition-all ${isCompact ? 'p-2 mb-1.5' : 'mb-2'}`}
      style={overlayStyle}
    >
      <div className="flex items-center flex-1">
        {isAdmin && !isCompact && (
          <div 
            className="text-slate-300 hover:text-slate-500 transition-colors p-1 -ml-1 mr-1"
            style={{ cursor: isOverlay ? 'grabbing' : 'grab', touchAction: 'none' }}
            {...dragAttributes}
            {...dragListeners}
          >
            <GripVertical size={18} />
          </div>
        )}
        <span 
          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-3 shadow-sm"
          style={{ background: teamColor, color: teamName === 'Team White' ? '#0f172a' : 'white' }}
        >
          {index + 1}
        </span>
        <span className={`font-medium ${isCompact ? 'text-sm' : 'text-base'} text-slate-800 truncate flex-1`}>
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
