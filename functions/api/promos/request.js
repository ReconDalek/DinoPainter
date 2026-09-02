// POST /api/promos/request  ->  a public "advertise my server" submission.
// Stored as status='pending' for the owner to review in the admin panel.
import { json, badRequest, newId, hashIp, validatePromo, PROMO_REQUESTS_PER_DAY } from "../_lib.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const check = validatePromo(body); // full validation, name+image+link required
  if (!check.ok) return badRequest(check.error);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = await hashIp(ip, env.IP_SALT);

  const since = Date.now() - 24 * 60 * 60 * 1000;
  const { results: recent } = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM promos WHERE ip_hash = ? AND created_at > ?`
  )
    .bind(ipHash, since)
    .all();
  if ((recent?.[0]?.n || 0) >= PROMO_REQUESTS_PER_DAY) {
    return json({ error: "You've already submitted a few requests today. Try again tomorrow." }, 429);
  }

  const id = newId();
  await env.DB.prepare(
    `INSERT INTO promos (id, name, image_url, link_url, enabled, weight, status, ip_hash, created_at)
     VALUES (?, ?, ?, ?, 1, 1, 'pending', ?, ?)`
  )
    .bind(id, check.value.name, check.value.image_url, check.value.link_url, ipHash, Date.now())
    .run();

  return json({ ok: true, id, status: "pending" }, 201);
}
