-- Add link_url to achievements table
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS link_url text;
