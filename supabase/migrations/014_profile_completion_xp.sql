-- Migration 014: Lower profile details completion reward from 100 XP to 50 XP

CREATE OR REPLACE FUNCTION check_profile_details_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.has_completed_details = false AND 
     NEW.age IS NOT NULL AND 
     NEW.gender IS NOT NULL AND NEW.gender <> '' AND
     NEW.city IS NOT NULL AND NEW.city <> '' AND
     NEW.school_or_college IS NOT NULL AND NEW.school_or_college <> '' THEN
    
    NEW.has_completed_details := true;
    NEW.xp := NEW.xp + 50;
    NEW.level := FLOOR(NEW.xp / 500) + 1;
    
    -- Update team score
    IF NEW.team_id IS NOT NULL THEN
      UPDATE teams t
      SET score = score + 50
      WHERE t.id = NEW.team_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
