import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getISTDate } from '../utils/timeUtils';

export const useGameState = (hasUnsavedChangesRef) => {
  const queryClient = useQueryClient();

  const { data: gameState, isLoading, error } = useQuery({
    queryKey: ['gameState'],
    queryFn: async () => {
      const { data, error } = await supabase.from('game_state').select('*').eq('id', 1).single();
      if (error) throw error;
      
      let currentPlayers = data.all_players || [];
      const { dateString, weekdayStr } = getISTDate();
      
      // Lazy rollover logic
      let needsRolloverUpdate = false;
      let newMatchup = data.matchup;
      let newTeamsFinalized = data.teams_finalized;

      if (data.last_rollover_date && dateString > data.last_rollover_date) {
        const gameDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        if (gameDays.includes(weekdayStr)) {
          if (data.teams_finalized && data.matchup) {
            currentPlayers = [
              ...data.matchup.teamA.players,
              ...data.matchup.teamB.players
            ];
          } else {
            const cap = (currentPlayers.length >= 18) ? 18 : (currentPlayers.length >= 14 ? 14 : 10);
            currentPlayers = currentPlayers.slice(0, cap);
          }
        }
        needsRolloverUpdate = true;
        newMatchup = null;
        newTeamsFinalized = false;
      } else if (!data.last_rollover_date) {
        needsRolloverUpdate = true;
      }

      if (needsRolloverUpdate) {
        await supabase.from('game_state').update({
          all_players: currentPlayers,
          matchup: newMatchup,
          teams_finalized: newTeamsFinalized,
          last_rollover_date: dateString
        }).eq('id', 1);
      }

      return {
        allPlayers: currentPlayers,
        matchup: newMatchup,
        teamsFinalized: newTeamsFinalized || false,
      };
    },
  });

  // Supabase Realtime Subscription
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_state' }, (payload) => {
        
        queryClient.setQueryData(['gameState'], (oldData) => {
          if (!oldData) return oldData;

          const newData = {
            allPlayers: payload.new.all_players || [],
            matchup: payload.new.matchup,
            teamsFinalized: payload.new.teams_finalized || false,
          };

          // Alerts for concurrent admin actions
          if (payload.new.teams_finalized && payload.new.matchup) {
             if (hasUnsavedChangesRef?.current) {
                 alert("Another admin has finalized a team matchup. Your view will now refresh.");
             }
          } else {
             if (payload.new.matchup === null && hasUnsavedChangesRef?.current && oldData.matchup) {
                alert("The roster has changed! Your team draft has been reset.");
             }
          }
          return newData;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, hasUnsavedChangesRef]);

  return { gameState, isLoading, error };
};
