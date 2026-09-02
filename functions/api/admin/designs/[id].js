// /api/admin/designs/:id
//   POST { action: "approve" | "reject" }  -> set status
//   also accepts optional { title, credit } to tidy up on approval
import { json, badRequest, requireAdmin, MAX_TITLE, MAX_CREDIT } from "../../_lib.js";

export async function onRequestPost({ request, params, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected JSON.");
  }

  const status = body.action === "approve" ? "approved" : body.action === "reject" ? "rejected" : null;
  if (!status) return badRequest('action must be "approve" or "reject".');

  const title =
    typeof body.title === "string" ? body.title.replace(/<[^>]*>/g, "").trim().slice(0, MAX_TITLE) : null;
  const credit =
    typeof body.credit === "string" ? body.credit.replace(/<[^>]*>/g, "").trim().slice(0, MAX_CREDIT) : null;

  const result = await env.DB.prepare(
    `UPDATE designs
        SET status = ?,
            title  = COALESCE(?, title),
            credit = COALESCE(?, credit)
      WHERE id = ?`
  )
    .bind(status, title, credit, params.id)
    .run();

  if (!result.meta || result.meta.changes === 0) {
    return json({ error: "Not found." }, 404);
  }
  return json({ ok: true, id: params.id, status });
}
