-- ==========================================================================
-- PRIŠA 2026 — Database Schema Updates (V1)
-- Run this in your Supabase SQL Editor
-- ==========================================================================

-- 1. Add column to profiles for hiding from leaderboard
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_from_leaderboard boolean DEFAULT false;

-- 2. Add column to challenges for custom input questions
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS input_question text;

-- 3. Update visibility constraint on challenges
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_visibility_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_visibility_check CHECK (visibility IN ('visible', 'coming_soon', 'hidden', 'mystery'));

-- 4. Create App Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

-- Seed app settings (Arena disabled by default)
INSERT INTO app_settings (key, value) VALUES ('arena_enabled', 'false') ON CONFLICT DO NOTHING;

-- 5. Create Levels table
CREATE TABLE IF NOT EXISTS levels (
  level integer PRIMARY KEY,
  name text NOT NULL,
  icon text DEFAULT '⭐',
  created_at timestamptz DEFAULT now()
);

-- Seed default level titles and icons
INSERT INTO levels (level, name, icon) VALUES
  (1, 'Početnik', '🐣'),
  (2, 'Tragač', '🔍'),
  (3, 'Učenik', '📚'),
  (4, 'Navigator', '🧭'),
  (5, 'Strijelac', '🏹'),
  (6, 'Ratnik', '⚔️'),
  (7, 'Majstor', '🎓'),
  (8, 'Prvak', '🏆'),
  (9, 'Legenda', '👑'),
  (10, 'Besmrtnik', '🌌')
ON CONFLICT (level) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 6. Create Achievement Codes table (for single-use code redemption)
CREATE TABLE IF NOT EXISTS achievement_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "settings_select" ON app_settings;
DROP POLICY IF EXISTS "settings_admin" ON app_settings;
DROP POLICY IF EXISTS "levels_select" ON levels;
DROP POLICY IF EXISTS "levels_admin" ON levels;
DROP POLICY IF EXISTS "codes_select" ON achievement_codes;
DROP POLICY IF EXISTS "codes_admin" ON achievement_codes;

-- Create RLS Policies
CREATE POLICY "settings_select" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_admin" ON app_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "levels_select" ON levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "levels_admin" ON levels FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "codes_select" ON achievement_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "codes_admin" ON achievement_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. Simplify award_xp function (remove multiplier logic)
CREATE OR REPLACE FUNCTION award_xp(p_user_id uuid, p_xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual_xp integer;
  v_last_active date;
  v_current_streak integer;
  v_today date := CURRENT_DATE;
BEGIN
  -- Get current active date and streak
  SELECT last_active_date, streak
  INTO v_last_active, v_current_streak
  FROM profiles WHERE id = p_user_id;

  v_actual_xp := p_xp_amount; -- Multiplier removed

  -- Update profile
  UPDATE profiles
  SET
    xp = xp + v_actual_xp,
    level = FLOOR((xp + v_actual_xp) / 500) + 1,
    streak = CASE
      WHEN v_last_active = v_today THEN v_current_streak
      WHEN v_last_active = v_today - 1 THEN v_current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      longest_streak,
      CASE
        WHEN v_last_active = v_today THEN v_current_streak
        WHEN v_last_active = v_today - 1 THEN v_current_streak + 1
        ELSE 1
      END
    ),
    last_active_date = v_today,
    updated_at = now()
  WHERE id = p_user_id;

  -- Update team score
  UPDATE teams t
  SET score = score + v_actual_xp
  FROM profiles p
  WHERE p.id = p_user_id AND p.team_id = t.id;
END;
$$;

-- 8. Add trigger function for automatic achievements unlocking
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

      -- Award XP
      PERFORM award_xp(NEW.user_id, v_ach.xp_reward);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_auto_achievements ON user_challenges;
CREATE TRIGGER trigger_check_auto_achievements
  AFTER INSERT OR UPDATE OF is_completed ON user_challenges
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION check_auto_achievements();
