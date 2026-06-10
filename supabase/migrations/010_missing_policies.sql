-- ==========================================================================
-- Migration 010: Fix Missing RLS Policies & Settings
-- Run this in your Supabase SQL Editor
-- ==========================================================================

-- 1. Fix missing INSERT policy on arena_boss_damage
--    Without this, the trigger (SECURITY DEFINER) works fine, but direct
--    inserts from the client would fail. The trigger handles it, so this
--    is mainly a safety add.
DROP POLICY IF EXISTS "arena_boss_damage_insert" ON arena_boss_damage;
CREATE POLICY "arena_boss_damage_insert" ON arena_boss_damage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "arena_boss_damage_update" ON arena_boss_damage;
CREATE POLICY "arena_boss_damage_update" ON arena_boss_damage
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 2. Fix arena_enabled setting format
--    The seed inserted raw 'false' but the app reads value->>'enabled'.
--    Normalize it to the correct JSON object format.
INSERT INTO app_settings (key, value)
VALUES ('arena_enabled', '{"enabled": false}')
ON CONFLICT (key) DO UPDATE
  SET value = CASE
    -- If it's already an object with 'enabled' key, leave it alone
    WHEN app_settings.value ? 'enabled' THEN app_settings.value
    -- Otherwise normalize the raw boolean to the object format
    ELSE jsonb_build_object('enabled', (app_settings.value)::boolean)
  END;

-- 3. Ensure storage UPDATE policy allows upsert (overwriting existing files)
--    This is needed for the deterministic daily photo filename to work with upsert:true
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
