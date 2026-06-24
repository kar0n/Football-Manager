import { DndContext, closestCenter, KeyboardSensor, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TeamCard } from './TeamCard';
import { PlayerItemVisual } from './PlayerItemVisual';

/**
 * The full matchup area — DndContext wrapping both TeamCards, the VS badge,
 * and the "Game On" title banner.
 *
 * Renders the exact same JSX as App.jsx lines 755–820.
 */
export const MatchupBoard = ({
  matchup,
  targetDay,
  isAdmin,
  activeId,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find the active player's info for the DragOverlay ghost
  const getActivePlayerInfo = (id) => {
    if (!matchup) return null;
    let idx = matchup.teamA.players.findIndex(p => p.id === id);
    if (idx !== -1) return { player: matchup.teamA.players[idx], index: idx, teamColor: matchup.teamA.colorCode, teamName: matchup.teamA.name };
    idx = matchup.teamB.players.findIndex(p => p.id === id);
    if (idx !== -1) return { player: matchup.teamB.players[idx], index: idx, teamColor: matchup.teamB.colorCode, teamName: matchup.teamB.name };
    return null;
  };

  const activeInfo = activeId ? getActivePlayerInfo(activeId) : null;

  return (
    <DndContext
      sensors={isAdmin ? sensors : []}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div id="matchup-capture-area" style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '0 -0.5rem' }}>
        <div style={{ textAlign: 'center', color: '#f8fafc', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '-0.25rem', marginBottom: '-0.75rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Game On: {matchup.gameDay || targetDay.full}
        </div>

        <TeamCard team={matchup.teamA} isAdmin={isAdmin} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '-1rem 0', zIndex: 10 }}>
          <div style={{ height: '3px', width: '130px', background: 'linear-gradient(to left, rgba(255,255,255,0.7), transparent)', transform: 'rotate(-8deg)', borderRadius: '4px' }}></div>
          <div className="vs-badge">
            <span>VS</span>
          </div>
          <div style={{ height: '3px', width: '130px', background: 'linear-gradient(to right, rgba(255,255,255,0.7), transparent)', transform: 'rotate(-8deg)', borderRadius: '4px' }}></div>
        </div>

        <TeamCard team={matchup.teamB} isAdmin={isAdmin} />

        {isAdmin && (
          <DragOverlay>
            {activeInfo ? (
              <PlayerItemVisual
                player={activeInfo.player}
                index={activeInfo.index}
                teamColor={activeInfo.teamColor}
                teamName={activeInfo.teamName}
                isOverlay={true}
                isAdmin={isAdmin}
                isCompact={true}
              />
            ) : null}
          </DragOverlay>
        )}
      </div>
    </DndContext>
  );
};
