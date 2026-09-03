// GET  /api/palettes  ->  approved community palettes
// POST /api/palettes  ->  public submission (stored as pending)
import {
  json,
  badRequest,
  newId,
  hashIp,
  validatePalette,
  publicPalette,
  PALETTE_SUBMISSIONS_PER_DAY,
} from "../_lib.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, colors, credit FROM palettes
      WHERE status = 'approved'
      ORDER BY created_at DESC`
  ).all();
  return json(
    { palettes: (results || []).map(publicPalette) },
    200,
    { "cache-control": "public, max-age=120" }
  );
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const check = validatePalette(body);
  if (!check.ok) return badRequest(check.error);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = await hashIp(ip, env.IP_SALT);

  const since = Date.now() - 24 * 60 * 60 * 1000;
  const { results: recent } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM palettes WHERE ip_hash = ? AND created_at > ?`
  )
    .bind(ipHash, since)
    .all();
  if ((recent?.[0]?.n || 0) >= PALETTE_SUBMISSIONS_PER_DAY) {
    return json({ error: "You've submitted a few palettes today already. Try again tomorrow." }, 429);
  }

  const id = newId();
  await env.DB.prepare(
    `INSERT INTO palettes (id, name, colors, credit, status, ip_hash, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(id, check.value.name, JSON.stringify(check.value.colors), check.value.credit ?? null, ipHash, Date.now())
    .run();

  return json({ ok: true, id, status: "pending" }, 201);
}
