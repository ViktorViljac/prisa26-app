-- Migration 022: Fix database trigger search paths to prevent unexpected database errors on user signup/import

-- 1. Redefine handle_new_user with SET search_path = public
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- 2. Redefine recalc_profile_level with SET search_path = public
CREATE OR REPLACE FUNCTION public.recalc_profile_level()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_level integer;
BEGIN
  SELECT level INTO v_level
  FROM levels
  WHERE xp <= NEW.xp
  ORDER BY level DESC
  LIMIT 1;

  IF v_level IS NULL THEN
    v_level := 1;
  END IF;

  NEW.level := v_level;
  RETURN NEW;
END;
$$;

-- 3. Redefine update_team_member_count with SET search_path = public
CREATE OR REPLACE FUNCTION public.update_team_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.team_id IS NOT NULL THEN
      UPDATE teams SET member_count = member_count + 1 WHERE id = NEW.team_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      IF OLD.team_id IS NOT NULL THEN
        UPDATE teams SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.team_id;
      END IF;
      IF NEW.team_id IS NOT NULL THEN
        UPDATE teams SET member_count = member_count + 1 WHERE id = NEW.team_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.team_id IS NOT NULL THEN
      UPDATE teams SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.team_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Redefine sync_team_scores with SET search_path = public
CREATE OR REPLACE FUNCTION public.sync_team_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_xp_diff integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.team_id IS NOT NULL AND NEW.is_banned = false AND NEW.hide_from_leaderboard = false THEN
      UPDATE teams SET score = score + NEW.xp WHERE id = NEW.team_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Calculate difference in XP
    v_xp_diff := NEW.xp - OLD.xp;
    
    -- If team_id or status (banned/hidden) changed
    IF OLD.team_id IS DISTINCT FROM NEW.team_id OR OLD.is_banned IS DISTINCT FROM NEW.is_banned OR OLD.hide_from_leaderboard IS DISTINCT FROM NEW.hide_from_leaderboard THEN
      -- Subtract old XP from old team if it was active
      IF OLD.team_id IS NOT NULL AND OLD.is_banned = false AND OLD.hide_from_leaderboard = false THEN
        UPDATE teams SET score = GREATEST(0, score - OLD.xp) WHERE id = OLD.team_id;
      END IF;
      -- Add new XP to new team if it is active
      IF NEW.team_id IS NOT NULL AND NEW.is_banned = false AND NEW.hide_from_leaderboard = false THEN
        UPDATE teams SET score = score + NEW.xp WHERE id = NEW.team_id;
      END IF;
    -- If team stayed the same but XP changed
    ELSIF v_xp_diff <> 0 AND NEW.team_id IS NOT NULL AND NEW.is_banned = false AND NEW.hide_from_leaderboard = false THEN
      UPDATE teams SET score = score + v_xp_diff WHERE id = NEW.team_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.team_id IS NOT NULL AND OLD.is_banned = false AND OLD.hide_from_leaderboard = false THEN
      UPDATE teams SET score = GREATEST(0, score - OLD.xp) WHERE id = OLD.team_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- 5. Redefine check_auto_achievements with SET search_path = public
CREATE OR REPLACE FUNCTION public.check_auto_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- 6. Redefine trigger_deal_boss_damage with SET search_path = public
CREATE OR REPLACE FUNCTION public.trigger_deal_boss_damage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_boss record;
  v_damage integer;
BEGIN
  -- Calculate damage based on progress increment
  IF TG_OP = 'INSERT' THEN
    v_damage := NEW.progress;
  ELSIF TG_OP = 'UPDATE' THEN
    v_damage := NEW.progress - COALESCE(OLD.progress, 0);
  END IF;

  IF v_damage > 0 THEN
    -- Find active boss tied to this challenge
    FOR v_boss IN 
      SELECT * FROM arena_bosses 
      WHERE challenge_id = NEW.challenge_id AND is_active = true AND current_hp > 0
    LOOP
      -- Deal damage to boss
      UPDATE arena_bosses 
      SET current_hp = GREATEST(0, current_hp - v_damage)
      WHERE id = v_boss.id;

      -- Record user damage
      INSERT INTO arena_boss_damage (boss_id, user_id, damage_dealt, last_damage_at)
      VALUES (v_boss.id, NEW.user_id, v_damage, now())
      ON CONFLICT (boss_id, user_id) 
      DO UPDATE SET 
        damage_dealt = arena_boss_damage.damage_dealt + EXCLUDED.damage_dealt,
        last_damage_at = EXCLUDED.last_damage_at;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Redefine award_xp with SET search_path = public
CREATE OR REPLACE FUNCTION public.award_xp(p_user_id uuid, p_xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actual_xp integer;
  v_last_active date;
  v_today date;
  v_streak_increment integer := 0;
BEGIN
  -- 1. Get user status
  SELECT xp, last_active_date, streak 
  INTO v_actual_xp, v_last_active, v_streak_increment
  FROM profiles 
  WHERE id = p_user_id;

  -- 2. Local date in Croatia
  v_today := (timezone('Europe/Zagreb', now()))::date;

  -- 3. Calculate streak updates
  IF v_last_active IS NULL THEN
    v_streak_increment := 1;
  ELSIF v_today - v_last_active = 1 THEN
    v_streak_increment := v_streak_increment + 1;
  ELSIF v_today - v_last_active > 1 THEN
    v_streak_increment := 1;
  END IF;

  -- 4. Actual XP reward
  v_actual_xp := p_xp_amount;

  -- 5. Update profile
  UPDATE profiles
  SET 
    xp = xp + v_actual_xp,
    streak = COALESCE(v_streak_increment, streak, 1),
    last_active_date = v_today,
    updated_at = now()
  WHERE id = p_user_id;

  -- 6. Update team score
  UPDATE teams t
  SET score = score + v_actual_xp
  FROM profiles p
  WHERE p.id = p_user_id AND p.team_id = t.id;
END;
$$;
