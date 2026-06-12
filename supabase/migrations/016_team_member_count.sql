-- Migration 016: Add trigger to sync team member count
-- This trigger automatically updates the member_count column in the teams table
-- whenever a profile's team_id is inserted, updated, or deleted.

CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_update_team_member_count ON profiles;

-- Create trigger
CREATE TRIGGER trg_update_team_member_count
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_team_member_count();
