import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { PlayerItemVisual, SortablePlayerItem } from './PlayerItem';

export const MatchupBoard = ({ 
  matchup, 
  activeId, 
  isAdmin, 
  teamsFinalized, 
  handleDragStart, 
  handleDragEnd 
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const renderTeam = (teamData, teamKey, title) => {
    return (
      <div className="team-card" style={{ flex: 1, '--team-color': teamData.colorCode }}>
        <div className="team-header">
          <h3 className="team-name" style={{ color: teamData.colorCode }}>{title}</h3>
        </div>
        
        <SortableContext 
          items={teamData.players.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="player-list" style={{ minHeight: '200px' }}>
            {teamData.players.map((player, index) => (
              <SortablePlayerItem 
                key={player.id} 
                player={player} 
                index={index}
                teamColor={teamData.colorCode}
                teamName={title}
                isAdmin={isAdmin && !teamsFinalized}
                isCompact={true}
              />
            ))}
            {teamData.players.length === 0 && (
              <div className="empty-state" style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px' }}>
                Drop players here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

  const getActivePlayer = () => {
    if (!activeId) return null;
    const pA = matchup.teamA.players.find(p => p.id === activeId);
    if (pA) return { player: pA, team: matchup.teamA, name: 'Team Dark' };
    const pB = matchup.teamB.players.find(p => p.id === activeId);
    if (pB) return { player: pB, team: matchup.teamB, name: 'Team White' };
    return null;
  };

  const activeData = getActivePlayer();

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div id="matchup-capture" className="flex gap-4 relative">
        {renderTeam(matchup.teamA, 'teamA', 'Team Dark')}
        {renderTeam(matchup.teamB, 'teamB', 'Team White')}
      </div>

      {isAdmin && !teamsFinalized && (
        <DragOverlay zIndex={9999}>
          {activeData ? (
            <PlayerItemVisual 
              player={activeData.player}
              index={0} // Index doesn't matter for overlay
              teamColor={activeData.team.color}
              teamName={activeData.name}
              isOverlay={true}
              isAdmin={true}
              isCompact={true}
            />
          ) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
};
