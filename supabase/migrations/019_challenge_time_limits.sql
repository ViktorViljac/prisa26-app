-- Migration 019: Add time window restrictions and auto-complete on open option to challenges

-- 1. Add columns to challenges table
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS active_from_time time DEFAULT null;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS active_to_time time DEFAULT null;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS auto_complete_on_open boolean DEFAULT false;
