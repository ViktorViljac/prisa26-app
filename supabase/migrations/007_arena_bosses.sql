CREATE TABLE IF NOT EXISTS arena_bosses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  max_hp integer NOT NULL DEFAULT 1000,
  current_hp integer NOT NULL DEFAULT 1000,
  challenge_id uuid REFERENCES challenges(id),
  reward_xp integer DEFAULT 0,
  reward_achievement_id uuid REFERENCES achievements(id),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table to track which users dealt damage to the boss (for rewards later)
CREATE TABLE IF NOT EXISTS arena_boss_damage (
  boss_id uuid REFERENCES arena_bosses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  damage_dealt integer DEFAULT 0,
  last_damage_at timestamptz DEFAULT now(),
  PRIMARY KEY (boss_id, user_id)
);

ALTER TABLE arena_bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arena_bosses_select" ON arena_bosses FOR SELECT TO authenticated USING (true);
CREATE POLICY "arena_bosses_admin" ON arena_bosses FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE arena_boss_damage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arena_boss_damage_select" ON arena_boss_damage FOR SELECT TO authenticated USING (true);

-- Trigger to automatically deal damage when user makes progress on the tied challenge
CREATE OR REPLACE FUNCTION trigger_deal_boss_damage()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS deal_boss_damage_trigger ON user_challenges;
CREATE TRIGGER deal_boss_damage_trigger
AFTER INSERT OR UPDATE ON user_challenges
FOR EACH ROW
EXECUTE FUNCTION trigger_deal_boss_damage();
