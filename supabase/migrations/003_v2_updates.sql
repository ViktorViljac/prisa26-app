-- ==========================================================================
-- PRIŠA 2026 — Database Schema Updates V2
-- Run this in your Supabase SQL Editor
-- ==========================================================================

-- 1. Add columns to profiles for personal details
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_or_college text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_details boolean DEFAULT false;

-- 2. Add columns to achievements for visibility and starting date
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'visible';
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_visibility_check;
ALTER TABLE achievements ADD CONSTRAINT achievements_visibility_check CHECK (visibility IN ('visible', 'coming_soon', 'hidden', 'mystery'));
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS start_date date;

-- 3. Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  rating integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "feedbacks_insert" ON feedbacks;
DROP POLICY IF EXISTS "feedbacks_admin" ON feedbacks;

-- Create RLS Policies
CREATE POLICY "feedbacks_insert" ON feedbacks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedbacks_admin" ON feedbacks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Trigger function for automatic 100 XP details completion reward
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
    NEW.xp := NEW.xp + 100;
    NEW.level := FLOOR(NEW.xp / 500) + 1;
    
    -- Update team score
    IF NEW.team_id IS NOT NULL THEN
      UPDATE teams t
      SET score = score + 100
      WHERE t.id = NEW.team_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_profile_details ON profiles;
CREATE TRIGGER trigger_check_profile_details
  BEFORE UPDATE OF age, gender, city, school_or_college ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_details_completed();
