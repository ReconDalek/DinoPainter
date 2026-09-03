-- Community colour palettes: submitted by players, approved in the admin panel,
-- shown alongside the built-in PRESETS in the painter's Presets dropdown.
CREATE TABLE IF NOT EXISTS palettes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  colors     TEXT NOT NULL,                    -- JSON array of 6 colour IDs
  credit     TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  ip_hash    TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_palettes_status ON palettes (status, created_at DESC);

-- A few featured palettes to start the section off.
INSERT OR IGNORE INTO palettes (id, name, colors, credit, status, created_at) VALUES
  ('seed-twilight',   'Twilight',      '[203,202,219,68,187,18]',   'DinoPainter', 'approved', 0),
  ('seed-moss-stone', 'Moss & Stone',  '[160,161,13,8,167,14]',     'DinoPainter', 'approved', 0),
  ('seed-ember-glow', 'Ember Glow',    '[42,43,44,245,224,79]',     'DinoPainter', 'approved', 0),
  ('seed-arctic-fox', 'Arctic Fox',    '[18,181,197,232,8,13]',     'DinoPainter', 'approved', 0),
  ('seed-venom',      'Venom',         '[155,154,16,83,224,79]',    'DinoPainter', 'approved', 0);
