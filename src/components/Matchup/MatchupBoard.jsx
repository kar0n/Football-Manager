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
      <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <div className="flex items-center gap-2">
            <span 
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ background: teamData.color }}
            />
          </div>
        </div>
        
        <SortableContext 
          items={teamData.players.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="space-y-2 min-h-[200px]">
            {teamData.players.map((player, index) => (
              <SortablePlayerItem 
                key={player.id} 
                player={player} 
                index={index}
                teamColor={teamData.color}
                teamName={title}
                isAdmin={isAdmin && !teamsFinalized}
                isCompact={true}
              />
            ))}
            {teamData.players.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic py-8 border-2 border-dashed border-slate-200 rounded-xl">
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
