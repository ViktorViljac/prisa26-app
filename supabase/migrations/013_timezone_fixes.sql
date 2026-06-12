-- Migration 013: Adjust date calculations to Europe/Zagreb timezone
-- This ensures that UTC database server does not shift daily resets or streak calculations.

CREATE OR REPLACE FUNCTION award_xp(p_user_id uuid, p_xp_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual_xp integer;
  v_last_active date;
  v_current_streak integer;
  v_today date := (timezone('Europe/Zagreb', now()))::date;
BEGIN
  -- Get current active date and streak
  SELECT last_active_date, streak
  INTO v_last_active, v_current_streak
  FROM profiles WHERE id = p_user_id;

  v_actual_xp := p_xp_amount;

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

CREATE OR REPLACE FUNCTION reset_inactive_streaks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    streak = 0,
    updated_at = now()
  WHERE
    streak > 0
    AND (
      last_active_date IS NULL
      OR last_active_date < (timezone('Europe/Zagreb', now()))::date - INTERVAL '1 day'
    );
END;
$$;
