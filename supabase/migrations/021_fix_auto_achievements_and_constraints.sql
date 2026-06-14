-- Migration 021: Fix auto achievements trigger race conditions and update arena_bosses foreign keys for cascade deletion

-- 1. Drop existing restricted foreign key constraints on arena_bosses if they exist
ALTER TABLE arena_bosses DROP CONSTRAINT IF EXISTS arena_bosses_reward_achievement_id_fkey;
ALTER TABLE arena_bosses DROP CONSTRAINT IF EXISTS arena_bosses_challenge_id_fkey;

-- 2. Add constraints with ON DELETE SET NULL to allow deleting challenges and achievements
ALTER TABLE arena_bosses
  ADD CONSTRAINT arena_bosses_reward_achievement_id_fkey
  FOREIGN KEY (reward_achievement_id)
  REFERENCES achievements(id)
  ON DELETE SET NULL;

ALTER TABLE arena_bosses
  ADD CONSTRAINT arena_bosses_challenge_id_fkey
  FOREIGN KEY (challenge_id)
  REFERENCES challenges(id)
  ON DELETE SET NULL;

-- 3. Re-create the check_auto_achievements function to use IF FOUND to prevent duplicate XP on double/race triggers
CREATE OR REPLACE FUNCTION check_auto_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_completed_count integer;
  v_ach record;
BEGIN
  -- Count how many distinct challenges the user has completed
  SELECT count(DISTINCT challenge_id)
  INTO v_completed_count
  FROM user_challenges
  WHERE user_id = NEW.user_id AND is_completed = true;

  -- Loop through auto achievements that the user hasn't unlocked yet
  FOR v_ach IN
    SELECT * FROM achievements a
    WHERE a.condition_type = 'auto'
      AND (a.condition_value->>'type') = 'total_completed'
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = NEW.user_id AND ua.achievement_id = a.id
      )
  LOOP
    -- Check if count condition is met
    IF v_completed_count >= (v_ach.condition_value->>'count')::integer THEN
      -- Unlock achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (NEW.user_id, v_ach.id)
      ON CONFLICT DO NOTHING;

      -- Award XP (ONLY if the row was actually inserted!)
      IF FOUND THEN
        PERFORM award_xp(NEW.user_id, v_ach.xp_reward);
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
