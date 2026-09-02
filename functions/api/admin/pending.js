// /api/admin/pending  ->  list designs awaiting moderation (bearer auth)
import { json, requireAdmin, publicRow } from "../_lib.js";

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    `SELECT id, dino, colors, title, credit, created_at
       FROM designs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 200`
  ).all();

  return json({ designs: (results || []).map(publicRow) });
}
