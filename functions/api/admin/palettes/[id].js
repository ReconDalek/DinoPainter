// PATCH  /api/admin/palettes/:id  -> name, colors, credit, status
// DELETE /api/admin/palettes/:id
import { json, badRequest, requireAdmin, validatePalette } from "../../_lib.js";

export async function onRequestPatch({ request, params, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const check = validatePalette(body, { partial: true });
  if (!check.ok) return badRequest(check.error);

  const sets = [];
  const binds = [];
  for (const [k, v] of Object.entries(check.value)) {
    sets.push(`${k} = ?`);
    binds.push(k === "colors" ? JSON.stringify(v) : v);
  }
  if (!sets.length) return badRequest("Nothing to update.");

  binds.push(params.id);
  const res = await env.DB.prepare(`UPDATE palettes SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();
  if (!res.meta || res.meta.changes === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true, id: params.id });
}

export async function onRequestDelete({ request, params, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const res = await env.DB.prepare(`DELETE FROM palettes WHERE id = ?`).bind(params.id).run();
  if (!res.meta || res.meta.changes === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true, id: params.id });
}
