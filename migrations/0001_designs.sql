-- Community-submitted creature colour designs.
CREATE TABLE IF NOT EXISTS designs (
  id         TEXT PRIMARY KEY,
  dino       TEXT NOT NULL,
  colors     TEXT NOT NULL,                     -- JSON: { "0": 14, "1": 17, ... }
  title      TEXT,
  credit     TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  ip_hash    TEXT,
  created_at INTEGER NOT NULL                    -- unix ms
);

CREATE INDEX IF NOT EXISTS idx_designs_feed ON designs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_ratelimit ON designs (ip_hash, created_at);
