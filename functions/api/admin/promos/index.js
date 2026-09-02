// GET  /api/admin/promos   -> every promo, with stats
// POST /api/admin/promos   -> create a promo (status='approved')
import { json, badRequest, requireAdmin, validatePromo, slugId, adminPromo } from "../../_lib.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    `SELECT * FROM promos ORDER BY
       CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       created_at DESC`
  ).all();

  return json({ promos: (results || []).map(adminPromo) });
}

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const check = validatePromo(body);
  if (!check.ok) return badRequest(check.error);

  const v = check.value;
  const id = slugId(v.name);
  await env.DB.prepare(
    `INSERT INTO promos (id, name, image_url, link_url, enabled, weight, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)`
  )
    .bind(id, v.name, v.image_url, v.link_url, v.enabled ?? 1, v.weight ?? 1, Date.now())
    .run();

  return json({ ok: true, id }, 201);
}
