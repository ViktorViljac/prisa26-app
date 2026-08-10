-- Migration 023: Fix trigger_deal_boss_damage to support target_all and target_category_id alongside search_path security

CREATE OR REPLACE FUNCTION public.trigger_deal_boss_damage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_boss record;
  v_damage integer;
  v_challenge_category uuid;
BEGIN
  -- Calculate damage based on progress increment
  IF TG_OP = 'INSERT' THEN
    v_damage := NEW.progress;
  ELSIF TG_OP = 'UPDATE' THEN
    v_damage := NEW.progress - COALESCE(OLD.progress, 0);
  END IF;

  IF v_damage > 0 THEN
    -- Get the category of the challenge the user just made progress on
    SELECT category_id INTO v_challenge_category FROM public.challenges WHERE id = NEW.challenge_id;

    -- Find active bosses that are targeted by this action
    FOR v_boss IN 
      SELECT * FROM public.arena_bosses 
      WHERE is_active = true AND current_hp > 0
      AND (
        target_all = true 
        OR challenge_id = NEW.challenge_id 
        OR (target_category_id IS NOT NULL AND target_category_id = v_challenge_category)
      )
    LOOP
      -- Deal damage to boss
      UPDATE public.arena_bosses 
      SET current_hp = GREATEST(0, current_hp - v_damage)
      WHERE id = v_boss.id;

      -- Record user damage
      INSERT INTO public.arena_boss_damage (boss_id, user_id, damage_dealt, last_damage_at)
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
