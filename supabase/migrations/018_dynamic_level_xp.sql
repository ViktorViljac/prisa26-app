-- Migration 018: Add XP threshold column to levels and make level recalculation dynamic

-- 1. Add xp column to levels
ALTER TABLE levels ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;

-- 2. Seed default values based on levels
UPDATE levels SET xp = (level - 1) * 500;

-- 3. Update trigger function to dynamically fetch level from levels table
CREATE OR REPLACE FUNCTION recalc_profile_level()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
