-- Run this once in the Neon SQL Editor before using the onboarding feature.

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,        -- Clerk's user ID
  interests TEXT NOT NULL,         -- hobbies / things they're into
  background TEXT NOT NULL,        -- job / current occupation or field
  learning_goal TEXT NOT NULL,     -- what they want out of learning C#
  analogy_domain TEXT NOT NULL,    -- the single domain the AI should pull examples from
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
