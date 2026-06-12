-- Migration 012: Reset streaks for inactive users
-- This function checks ALL users and resets streak to 0
-- if they haven't been active yesterday or today.
-- Run manually from Supabase SQL Editor whenever needed,
-- OR set up pg_cron to run it every night at midnight.

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
      OR last_active_date < CURRENT_DATE - INTERVAL '1 day'
    );
END;
$$;

-- Grant execute to authenticated users (admin can call it)
GRANT EXECUTE ON FUNCTION reset_inactive_streaks() TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- OPTIONAL: Set up pg_cron to run automatically every night
-- (requires pg_cron extension enabled in Supabase Dashboard
--  → Database → Extensions → pg_cron)
--
-- SELECT cron.schedule(
--   'reset-streaks-nightly',
--   '0 2 * * *',   -- every day at 02:00 UTC (04:00 Zagreb time)
--   'SELECT reset_inactive_streaks()'
-- );
-- ─────────────────────────────────────────────────────────────
