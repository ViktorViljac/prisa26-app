-- Migration 011: Add link_url to achievements table
-- This enables achievements to link to external content (e.g. a challenge video, registration form)
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS link_url text;
