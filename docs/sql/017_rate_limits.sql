-- Run this in the Neon SQL Editor (clear the box first).
-- Backs a simple, DB-persisted rate limiter. A plain in-memory limiter
-- won't work reliably here since Vercel serverless functions are stateless
-- between invocations - this needs to live somewhere shared and durable.

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL,
  PRIMARY KEY (user_id, action)
);
