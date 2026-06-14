-- ==========================================================================
-- Migration 023: Allow Authenticated Users to Update Achievement Codes (Redeem)
-- Run this in your Supabase SQL Editor
-- ==========================================================================

-- Drop update policy if it already exists
DROP POLICY IF EXISTS "codes_update" ON achievement_codes;

-- Create UPDATE policy for authenticated users
-- Allows a user to mark a code as used ONLY IF:
-- 1. The code is currently unused (is_used = false)
-- 2. The update marks it as used (is_used = true) and sets used_by to their own ID
CREATE POLICY "codes_update" ON achievement_codes
  FOR UPDATE TO authenticated
  USING (is_used = false)
  WITH CHECK (is_used = true AND used_by = auth.uid());
