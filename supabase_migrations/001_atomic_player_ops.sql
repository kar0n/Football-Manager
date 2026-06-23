-- =============================================
-- ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,          -- 'join', 'remove', 'finalize'
  player_name TEXT,              -- name of player affected
  player_id TEXT,                -- app-level ID of the player
  device_id TEXT,                -- localStorage UUID of the person performing the action
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow the anon role to insert logs (app uses anon key)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow inserts" ON activity_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow reads" ON activity_log FOR SELECT TO anon USING (true);

-- =============================================
-- ATOMIC ADD PLAYER (with logging)
-- =============================================
CREATE OR REPLACE FUNCTION add_player(player_data jsonb, device_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_game_state record;
  current_count int;
  new_count int;
  old_capacity int;
  new_capacity int;
BEGIN
  -- 1. Lock the row to prevent concurrent reads/writes from calculating stale capacities
  SELECT * INTO v_game_state
  FROM game_state WHERE id = 1 FOR UPDATE;

  current_count := jsonb_array_length(COALESCE(v_game_state.all_players, '[]'::jsonb));
  new_count := current_count + 1;

  old_capacity := CASE
    WHEN current_count >= 18 THEN 18
    WHEN current_count >= 14 THEN 14
    ELSE 10
  END;

  new_capacity := CASE
    WHEN new_count >= 18 THEN 18
    WHEN new_count >= 14 THEN 14
    ELSE 10
  END;

  -- 2. Add the player. Clear matchup if capacity crossed.
  IF old_capacity != new_capacity THEN
    UPDATE game_state
    SET all_players = COALESCE(v_game_state.all_players, '[]'::jsonb) || jsonb_build_array(player_data),
        matchup = NULL,
        teams_finalized = false
    WHERE id = 1;
  ELSE
    UPDATE game_state
    SET all_players = COALESCE(v_game_state.all_players, '[]'::jsonb) || jsonb_build_array(player_data)
    WHERE id = 1;
  END IF;

  -- 3. Log the action
  INSERT INTO activity_log (action, player_name, player_id, device_id)
  VALUES ('join', player_data->>'name', player_data->>'id', device_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ATOMIC REMOVE PLAYER (with logging)
-- =============================================
CREATE OR REPLACE FUNCTION remove_player(player_id text, device_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_game_state record;
  removed_name text;
  new_all_players jsonb;
  current_count int;
  new_count int;
  old_capacity int;
  new_capacity int;
BEGIN
  -- 1. Lock the row to prevent concurrent reads/writes from calculating stale capacities
  SELECT * INTO v_game_state
  FROM game_state WHERE id = 1 FOR UPDATE;

  current_count := jsonb_array_length(COALESCE(v_game_state.all_players, '[]'::jsonb));

  -- 2. Verify player exists and get their name
  SELECT elem->>'name' INTO removed_name
  FROM jsonb_array_elements(v_game_state.all_players) elem
  WHERE elem->>'id' = player_id;

  IF removed_name IS NULL THEN
    -- Player not found, nothing to do (prevents false capacity changes)
    RETURN;
  END IF;

  -- 3. Build the new array without the player
  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO new_all_players
  FROM jsonb_array_elements(v_game_state.all_players) elem
  WHERE elem->>'id' != player_id;

  new_count := current_count - 1;

  old_capacity := CASE
    WHEN current_count >= 18 THEN 18
    WHEN current_count >= 14 THEN 14
    ELSE 10
  END;

  new_capacity := CASE
    WHEN new_count >= 18 THEN 18
    WHEN new_count >= 14 THEN 14
    ELSE 10
  END;

  -- 4. Remove the player. Clear matchup if capacity crossed.
  IF old_capacity != new_capacity THEN
    UPDATE game_state 
    SET all_players = new_all_players,
        matchup = NULL,
        teams_finalized = false
    WHERE id = 1;
  ELSE
    UPDATE game_state 
    SET all_players = new_all_players
    WHERE id = 1;
  END IF;

  -- 5. Log the action
  INSERT INTO activity_log (action, player_name, player_id, device_id)
  VALUES ('remove', removed_name, player_id, device_id);
END;
$$ LANGUAGE plpgsql;
