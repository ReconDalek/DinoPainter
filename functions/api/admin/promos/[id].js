// PATCH  /api/admin/promos/:id  -> update fields (name, image_url, link_url,
//                                  enabled, weight, status) and/or reset_stats
// DELETE /api/admin/promos/:id  -> remove
import { json, badRequest, requireAdmin, validatePromo } from "../../_lib.js";

export async function onRequestPatch({ request, params, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const sets = [];
  const binds = [];

  if (Object.keys(body).some((k) => k !== "reset_stats")) {
    const check = validatePromo(body, { partial: true });
    if (!check.ok) return badRequest(check.error);
    for (const [k, val] of Object.entries(check.value)) {
      sets.push(`${k} = ?`);
      binds.push(val);
    }
  }

  if (body.reset_stats) {
    sets.push("impressions = 0", "clicks = 0");
  }

  if (!sets.length) return badRequest("Nothing to update.");

  binds.push(params.id);
  const res = await env.DB.prepare(`UPDATE promos SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  if (!res.meta || res.meta.changes === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true, id: params.id });
}

export async function onRequestDelete({ request, params, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const res = await env.DB.prepare(`DELETE FROM promos WHERE id = ?`).bind(params.id).run();
  if (!res.meta || res.meta.changes === 0) return json({ error: "Not found." }, 404);
  return json({ ok: true, id: params.id });
}
