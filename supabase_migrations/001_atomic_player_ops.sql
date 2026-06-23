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
-- Only clears the matchup if the new total crosses a capacity threshold
-- (10→14 or 14→18), which changes the game format (5v5 → 7v7 → 9v9).
CREATE OR REPLACE FUNCTION add_player(player_data jsonb, device_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  current_count int;
  new_count int;
  old_capacity int;
  new_capacity int;
BEGIN
  SELECT jsonb_array_length(COALESCE(all_players, '[]'::jsonb))
  INTO current_count
  FROM game_state WHERE id = 1;

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

  -- Add the player
  IF old_capacity != new_capacity THEN
    UPDATE game_state
    SET all_players = COALESCE(all_players, '[]'::jsonb) || jsonb_build_array(player_data),
        matchup = NULL,
        teams_finalized = false
    WHERE id = 1;
  ELSE
    UPDATE game_state
    SET all_players = COALESCE(all_players, '[]'::jsonb) || jsonb_build_array(player_data)
    WHERE id = 1;
  END IF;

  -- Log the action
  INSERT INTO activity_log (action, player_name, player_id, device_id)
  VALUES ('join', player_data->>'name', player_data->>'id', device_id);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ATOMIC REMOVE PLAYER (with logging)
-- =============================================
-- Only clears the matchup if the removal crosses a capacity threshold
-- (18→14 or 14→10), which changes the game format (9v9 → 7v7 → 5v5).
CREATE OR REPLACE FUNCTION remove_player(player_id text, device_id text DEFAULT NULL)
RETURNS void AS $$
DECLARE
  current_count int;
  new_count int;
  old_capacity int;
  new_capacity int;
  removed_name text;
BEGIN
  SELECT jsonb_array_length(COALESCE(all_players, '[]'::jsonb))
  INTO current_count
  FROM game_state WHERE id = 1;

  -- Get the name of the player being removed (for the log)
  SELECT elem->>'name' INTO removed_name
  FROM game_state, jsonb_array_elements(all_players) elem
  WHERE id = 1 AND elem->>'id' = player_id;

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

  -- Remove the player
  IF old_capacity != new_capacity THEN
    UPDATE game_state 
    SET all_players = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(all_players) elem
      WHERE elem->>'id' != player_id
    ),
    matchup = NULL,
    teams_finalized = false
    WHERE id = 1;
  ELSE
    UPDATE game_state 
    SET all_players = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(all_players) elem
      WHERE elem->>'id' != player_id
    )
    WHERE id = 1;
  END IF;

  -- Log the action
  INSERT INTO activity_log (action, player_name, player_id, device_id)
  VALUES ('remove', removed_name, player_id, device_id);
END;
$$ LANGUAGE plpgsql;
