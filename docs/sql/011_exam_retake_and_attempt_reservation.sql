-- Run this in the Neon SQL Editor (clear the box first).

-- Track attempts from the moment they START, not just when submitted.
-- This closes a real exploit: previously, closing the tab or reloading
-- mid-exam left no record at all, letting someone "practice" the MCQ
-- section endlessly for free as long as they never hit Submit.
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';
-- status is either 'in_progress' (reserved, not yet finished) or 'completed'.

-- A stable, permanent certificate identity per user - separate from
-- individual attempt rows, so retaking to improve a score never changes
-- the verification code others may already have seen/checked.
CREATE TABLE IF NOT EXISTS certificates (
  user_id TEXT PRIMARY KEY,
  verification_code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  first_passed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
