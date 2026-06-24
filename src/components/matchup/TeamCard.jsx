import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortablePlayerItem } from './SortablePlayerItem';

/**
 * A single team column within the matchup board.
 * Contains the team header and the sortable player grid.
 * Renders the exact same JSX as App.jsx lines 760–775 and 786–802.
 */
export const TeamCard = ({ team, isAdmin }) => {
  return (
    <div className="team-card" style={{ '--team-color': team.colorCode }}>
      <div className="team-header">
        <h2 className="team-name" style={{
          color: team.colorCode,
          textShadow: team.name === 'Team White' ? '-1px -1px 0 #0f172a, 1px -1px 0 #0f172a, -1px 1px 0 #0f172a, 1px 1px 0 #0f172a, 0 2px 4px rgba(0,0,0,0.5)' : 'none'
        }}>
          {team.name}
        </h2>
      </div>
      <SortableContext items={team.players.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="player-grid" id={team.id}>
          {team.players.map((player, idx) => (
            <SortablePlayerItem
              key={player.id}
              player={player}
              index={idx}
              teamColor={team.colorCode}
              teamName={team.name}
              isAdmin={isAdmin}
              isCompact={true}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
