-- Migration 017: Automatically sync profile levels and team scores
-- This ensures manual updates to profile XP directly recalculate user levels
-- and keep the overall team scores synchronized.

-- 1. Trigger function for profiles Level recalculation
CREATE OR REPLACE FUNCTION recalc_profile_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := FLOOR(NEW.xp / 500) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_recalc_profile_level ON profiles;

-- Create trigger
CREATE TRIGGER trg_recalc_profile_level
BEFORE INSERT OR UPDATE OF xp ON profiles
FOR EACH ROW EXECUTE FUNCTION recalc_profile_level();


-- 2. Trigger function for teams score synchronization
CREATE OR REPLACE FUNCTION sync_team_scores()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_sync_team_scores ON profiles;

-- Create trigger
CREATE TRIGGER trg_sync_team_scores
AFTER INSERT OR UPDATE OF xp, team_id, is_banned, hide_from_leaderboard OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_team_scores();
