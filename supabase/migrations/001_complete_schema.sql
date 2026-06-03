-- ==========================================================================
-- PRIŠA 2026 — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ==========================================================================

-- 1. Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#f07147',
  icon text DEFAULT '🏳️',
  score integer DEFAULT 0,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO teams (name, color, icon) VALUES
  ('Zvijezdani', '#facc15', '⭐'),
  ('Zeleni', '#0d9488', '🌿'),
  ('Plavi', '#3b82f6', '💎'),
  ('Žuti', '#f59e0b', '☀️')
ON CONFLICT DO NOTHING;

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  avatar_url text,
  team_id uuid REFERENCES teams(id),
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  elo integer DEFAULT 1200,
  gems integer DEFAULT 0,
  xp_multiplier decimal DEFAULT 1.0,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Challenge Categories
CREATE TABLE IF NOT EXISTS challenge_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  gradient_start text DEFAULT '#f07147',
  gradient_end text DEFAULT '#ff9f43',
  sort_order integer DEFAULT 0
);

INSERT INTO challenge_categories (name, icon, gradient_start, gradient_end, sort_order) VALUES
  ('Zdravlje', 'FavoriteIcon', '#ef4444', '#f87171', 1),
  ('Fitness', 'FitnessCenterIcon', '#f07147', '#ff9f43', 2),
  ('Financije', 'SavingsIcon', '#0d9488', '#14b8a6', 3),
  ('Učenje', 'SchoolIcon', '#3b82f6', '#60a5fa', 4),
  ('Društvo', 'GroupsIcon', '#8b5cf6', '#a78bfa', 5),
  ('Mindfulness', 'SelfImprovementIcon', '#06b6d4', '#22d3ee', 6),
  ('Čitanje', 'AutoStoriesIcon', '#d97706', '#f59e0b', 7),
  ('Prehrana', 'RestaurantIcon', '#16a34a', '#4ade80', 8)
ON CONFLICT DO NOTHING;

-- 4. Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES challenge_categories(id),
  title text NOT NULL,
  description text,
  xp_reward integer DEFAULT 10,
  target_count integer DEFAULT 1,
  unit text DEFAULT 'puta',
  verification_type text DEFAULT 'self_report' CHECK (verification_type IN ('self_report', 'field_input', 'photo_upload')),
  visibility text DEFAULT 'visible' CHECK (visibility IN ('visible', 'coming_soon', 'hidden')),
  start_date date,
  end_date date,
  is_daily boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. User Challenges (progress tracking)
CREATE TABLE IF NOT EXISTS user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  proof_url text,
  admin_approved boolean,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id, date)
);

-- 6. Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT '🏅',
  xp_reward integer DEFAULT 0,
  unlock_code text,
  condition_type text DEFAULT 'code' CHECK (condition_type IN ('auto', 'code', 'admin')),
  condition_value jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- 8. Arena Battles (demo structure)
CREATE TABLE IF NOT EXISTS arena_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid REFERENCES profiles(id),
  player2_id uuid REFERENCES profiles(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  winner_id uuid REFERENCES profiles(id),
  player1_xp integer DEFAULT 0,
  player2_xp integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ends_at timestamptz
);

-- 9. Arena Moves
CREATE TABLE IF NOT EXISTS arena_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid REFERENCES arena_battles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  category text,
  xp_earned integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 10. Daily Quotes
CREATE TABLE IF NOT EXISTS daily_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text,
  scheduled_date date,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

INSERT INTO daily_quotes (text, author, sort_order) VALUES
  ('Svaki dan je nova prilika da postaneš bolja verzija sebe.', NULL, 1),
  ('Promjena počinje jednim korakom.', 'Lao Tzu', 2),
  ('Disciplina je most između ciljeva i uspjeha.', 'Jim Rohn', 3),
  ('Ne brini se o brzini, samo nastavi.', NULL, 4),
  ('Tvoje navike oblikuju tvoju budućnost.', NULL, 5),
  ('Uspjeh nije konačan, neuspjeh nije fatalan.', 'Winston Churchill', 6),
  ('Budi promjena koju želiš vidjeti u svijetu.', 'Mahatma Gandhi', 7)
ON CONFLICT DO NOTHING;

-- 11. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  keys jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 12. Award XP function
CREATE OR REPLACE FUNCTION award_xp(p_user_id uuid, p_xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_multiplier decimal;
  v_actual_xp integer;
  v_new_xp integer;
  v_last_active date;
  v_current_streak integer;
  v_today date := CURRENT_DATE;
BEGIN
  -- Get current multiplier and streak info
  SELECT xp_multiplier, last_active_date, streak
  INTO v_multiplier, v_last_active, v_current_streak
  FROM profiles WHERE id = p_user_id;

  -- Calculate actual XP with multiplier
  v_actual_xp := CEIL(p_xp_amount * COALESCE(v_multiplier, 1.0));

  -- Update XP and level
  UPDATE profiles
  SET
    xp = xp + v_actual_xp,
    level = FLOOR((xp + v_actual_xp) / 500) + 1,
    -- Streak logic
    streak = CASE
      WHEN v_last_active = v_today THEN v_current_streak -- Already active today
      WHEN v_last_active = v_today - 1 THEN v_current_streak + 1 -- Continue streak
      ELSE 1 -- Reset streak
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

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- TEAMS
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_update_admin" ON teams FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- CHALLENGE CATEGORIES
CREATE POLICY "categories_select" ON challenge_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_admin" ON challenge_categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- CHALLENGES
CREATE POLICY "challenges_select" ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "challenges_admin" ON challenges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- USER CHALLENGES
CREATE POLICY "user_challenges_select_own" ON user_challenges FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_challenges_insert_own" ON user_challenges FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_challenges_update_own" ON user_challenges FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_challenges_admin" ON user_challenges FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ACHIEVEMENTS
CREATE POLICY "achievements_select" ON achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "achievements_admin" ON achievements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- USER ACHIEVEMENTS
CREATE POLICY "user_achievements_select_own" ON user_achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_achievements_admin" ON user_achievements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ARENA
CREATE POLICY "arena_battles_select" ON arena_battles FOR SELECT TO authenticated USING (true);
CREATE POLICY "arena_moves_select" ON arena_moves FOR SELECT TO authenticated USING (true);

-- DAILY QUOTES
CREATE POLICY "quotes_select" ON daily_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotes_admin" ON daily_quotes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- PUSH SUBSCRIPTIONS
CREATE POLICY "push_select_own" ON push_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "push_insert_own" ON push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "push_delete_own" ON push_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ==========================================================================
-- ENABLE REALTIME
-- ==========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ==========================================================================
-- STORAGE: Create avatars bucket
-- ==========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
