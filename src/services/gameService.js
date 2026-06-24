/**
 * Game state service layer.
 * All Supabase database interactions are centralized here.
 * Components and hooks call these functions instead of touching supabase directly.
 */
import { supabase } from '../lib/supabase';
import { GAME_STATE_ROW_ID } from '../config/constants';

/**
 * Fetches the full game state row from the database.
 * Returns the data object or null on error.
 */
export const fetchGameState = async () => {
  const { data, error } = await supabase
    .from('game_state')
    .select('*')
    .eq('id', GAME_STATE_ROW_ID)
    .single();

  if (error) {
    console.error('Error fetching game state:', error);
    return null;
  }
  return data;
};

/**
 * Fetches only the matchup and finalization status.
 * Used when entering the matchup view to get the freshest data.
 */
export const fetchMatchupState = async () => {
  const { data, error } = await supabase
    .from('game_state')
    .select('matchup, teams_finalized')
    .eq('id', GAME_STATE_ROW_ID)
    .single();

  if (error) {
    console.error('Error fetching matchup state:', error);
    return null;
  }
  return data;
};

/**
 * Fetches players, matchup, and finalization status.
 * Used after mutations to refresh all local state from the DB.
 */
export const fetchPlayerState = async () => {
  const { data, error } = await supabase
    .from('game_state')
    .select('all_players, matchup, teams_finalized')
    .eq('id', GAME_STATE_ROW_ID)
    .single();

  if (error) {
    console.error('Error fetching player state:', error);
    return null;
  }
  return data;
};

/**
 * Updates arbitrary columns on the game_state row.
 * @param {Object} updates - key/value pairs to update (e.g. { matchup: {...}, teams_finalized: true })
 */
export const updateGameState = async (updates) => {
  try {
    await supabase.from('game_state').update(updates).eq('id', GAME_STATE_ROW_ID);
  } catch (err) {
    console.error('Error updating game state:', err);
  }
};

/**
 * Atomically adds a player via the database RPC function.
 * The RPC also handles matchup clearing when capacity thresholds are crossed.
 * @returns {{ error: object|null }}
 */
export const addPlayer = async (playerData, deviceId) => {
  const { error } = await supabase.rpc('add_player', {
    player_data: playerData,
    device_id: deviceId,
  });
  return { error };
};

/**
 * Atomically removes a player via the database RPC function.
 * The RPC also handles matchup clearing when capacity thresholds are crossed.
 * @returns {{ error: object|null }}
 */
export const removePlayer = async (playerId, deviceId) => {
  const { error } = await supabase.rpc('remove_player', {
    player_id: playerId,
    device_id: deviceId,
  });
  return { error };
};

/**
 * Logs an action to the activity_log table for audit purposes.
 */
export const logActivity = async (action, deviceId) => {
  await supabase.from('activity_log').insert({
    action,
    player_name: null,
    player_id: null,
    device_id: deviceId,
  });
};

/**
 * Subscribes to realtime changes on the game_state table.
 * @param {Function} callback - called with the payload on each UPDATE event.
 * @returns {Function} unsubscribe - call this to remove the channel.
 */
export const subscribeToChanges = (callback) => {
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_state' },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Fetches just the matchup column (used by handleBackClick to revert local state).
 */
export const fetchMatchupOnly = async () => {
  const { data } = await supabase
    .from('game_state')
    .select('matchup')
    .eq('id', GAME_STATE_ROW_ID)
    .single();
  return data;
};
