-- Migration 020: Enable deleting achievements and challenges referenced by arena bosses

-- 1. Drop existing restricted foreign key constraints if they exist
ALTER TABLE arena_bosses DROP CONSTRAINT IF EXISTS arena_bosses_reward_achievement_id_fkey;
ALTER TABLE arena_bosses DROP CONSTRAINT IF EXISTS arena_bosses_challenge_id_fkey;

-- 2. Add constraints with ON DELETE SET NULL
ALTER TABLE arena_bosses
  ADD CONSTRAINT arena_bosses_reward_achievement_id_fkey
  FOREIGN KEY (reward_achievement_id)
  REFERENCES achievements(id)
  ON DELETE SET NULL;

ALTER TABLE arena_bosses
  ADD CONSTRAINT arena_bosses_challenge_id_fkey
  FOREIGN KEY (challenge_id)
  REFERENCES challenges(id)
  ON DELETE SET NULL;
