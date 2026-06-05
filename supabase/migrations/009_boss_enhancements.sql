-- Add death_message column to arena_bosses
ALTER TABLE arena_bosses ADD COLUMN IF NOT EXISTS death_message text;

-- Add a helper function to activate a boss and deactivate all others
CREATE OR REPLACE FUNCTION set_active_boss(p_boss_id uuid)
RETURNS void AS $$
BEGIN
  -- Deactivate all bosses
  UPDATE arena_bosses SET is_active = false;
  
  -- Activate the selected one
  IF p_boss_id IS NOT NULL THEN
    UPDATE arena_bosses SET is_active = true WHERE id = p_boss_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
