-- Run this in the Neon SQL Editor (clear the box first).

-- A single settings row - the admin toggle flips this, and it's checked
-- everywhere before showing any pricing/paywall UI or applying Pro limits.
-- Defaults to false (fully free) - nothing monetization-related shows up
-- anywhere until this is explicitly turned on from the admin panel.
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  monetization_enabled BOOLEAN NOT NULL DEFAULT false,
  CHECK (id = 1)
);
INSERT INTO app_settings (id, monetization_enabled) VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
