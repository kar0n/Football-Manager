import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayerItemVisual } from './PlayerItemVisual';

/**
 * The sortable wrapper around PlayerItemVisual.
 * Handles the dnd-kit hooks and passes drag listeners down.
 * Renders the exact same JSX as the original App.jsx lines 41–69.
 */
export const SortablePlayerItem = ({ player, index, teamColor, teamName, isAdmin, isCompact }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // Dim the original item while dragging
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
