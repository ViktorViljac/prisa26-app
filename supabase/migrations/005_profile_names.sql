-- Migration 005: Add first_name and last_name to profiles
-- These fields allow users to specify their real first and last name separately
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
