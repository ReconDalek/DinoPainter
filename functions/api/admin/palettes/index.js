// GET  /api/admin/palettes  -> every palette
// POST /api/admin/palettes  -> create (status='approved')
import { json, badRequest, requireAdmin, validatePalette, slugId, adminPalette } from "../../_lib.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    `SELECT * FROM palettes ORDER BY
       CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       created_at DESC`
  ).all();
  return json({ palettes: (results || []).map(adminPalette) });
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

  const check = validatePalette(body);
  if (!check.ok) return badRequest(check.error);

  const id = slugId(check.value.name);
  await env.DB.prepare(
    `INSERT INTO palettes (id, name, colors, credit, status, created_at)
     VALUES (?, ?, ?, ?, 'approved', ?)`
  )
    .bind(id, check.value.name, JSON.stringify(check.value.colors), check.value.credit ?? null, Date.now())
    .run();

  return json({ ok: true, id }, 201);
}
