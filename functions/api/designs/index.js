// /api/designs
//   GET  -> recent approved designs (newest first)
//   POST -> submit a new design (stored as 'pending')
import {
  json,
  badRequest,
  newId,
  hashIp,
  validateSubmission,
  publicRow,
  RATE_LIMIT_PER_HOUR,
} from "../_lib.js";

const MAX_LIMIT = 60;
const DEFAULT_LIMIT = 24;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") || DEFAULT_LIMIT, 10) || DEFAULT_LIMIT)
  );

  const { results } = await env.DB.prepare(
    `SELECT id, dino, colors, title, credit, created_at
       FROM designs
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT ?`
  )
    .bind(limit)
    .all();

  return json(
    { designs: (results || []).map(publicRow) },
    200,
    { "cache-control": "public, max-age=60" }
  );
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const check = validateSubmission(body);
  if (!check.ok) return badRequest(check.error);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = await hashIp(ip, env.IP_SALT);

  // Rate limit: N submissions per rolling hour per hashed IP.
  const since = Date.now() - 60 * 60 * 1000;
  const { results: recent } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM designs WHERE ip_hash = ? AND created_at > ?`
  )
    .bind(ipHash, since)
    .all();
  if ((recent?.[0]?.n || 0) >= RATE_LIMIT_PER_HOUR) {
    return json({ error: "You're submitting too fast. Try again later." }, 429);
  }

  const id = newId();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO designs (id, dino, colors, title, credit, status, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(
      id,
      check.value.dino,
      JSON.stringify(check.value.colors),
      check.value.title,
      check.value.credit,
      ipHash,
      now
    )
    .run();

  return json({ ok: true, id, status: "pending" }, 201);
}
