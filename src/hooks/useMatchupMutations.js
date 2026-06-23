import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { getDeviceId } from '../utils/deviceUtils';

export const useMatchupMutations = () => {
  const queryClient = useQueryClient();

  const addPlayer = useMutation({
    mutationFn: async (playerData) => {
      const { error } = await supabase.rpc('add_player', { 
        player_data: playerData, 
        device_id: getDeviceId() 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Force fetch to instantly get state
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    }
  });

  const removePlayer = useMutation({
    mutationFn: async (playerId) => {
      const { error } = await supabase.rpc('remove_player', { 
        player_id: playerId, 
        device_id: getDeviceId() 
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    }
  });

  const finalizeTeams = useMutation({
    mutationFn: async (matchup) => {
      const { error } = await supabase.from('game_state').update({ 
        matchup, 
        teams_finalized: true 
      }).eq('id', 1);
      
      if (error) throw error;

      await supabase.from('activity_log').insert({
        action: 'finalize',
        device_id: getDeviceId()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    }
  });

  return { addPlayer, removePlayer, finalizeTeams };
};
