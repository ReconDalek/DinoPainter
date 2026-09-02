-- Server promo banners: managed from the admin panel, requestable by the public.
CREATE TABLE IF NOT EXISTS promos (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  image_url   TEXT NOT NULL,                    -- /promos/x.webp or https://...
  link_url    TEXT NOT NULL,                    -- https://...
  enabled     INTEGER NOT NULL DEFAULT 1,       -- 0 | 1  (owner on/off switch)
  weight      INTEGER NOT NULL DEFAULT 1,       -- rotation weighting
  status      TEXT NOT NULL DEFAULT 'approved', -- pending | approved | rejected
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  ip_hash     TEXT,                             -- rate-limit key for public requests
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promos_live ON promos (status, enabled);

-- Seed the promos that were previously hardcoded in promos/promos.js.
INSERT OR IGNORE INTO promos (id, name, image_url, link_url, enabled, weight, status, created_at) VALUES
  ('server1', 'Xavii ASA', '/promos/Xavii_ASA.png', 'https://discord.gg/d2ShE3RDwq', 1, 1, 'approved', 0),
  ('server2', 'TGP ASA',   '/promos/TGP_ASA.webp',  'https://discord.gg/4tpdPKBuHE', 1, 1, 'approved', 0),
  ('server3', 'ExArk',     '/promos/ExArk.webp',    'https://discord.gg/NnxGD2wNZV', 1, 1, 'approved', 0);
