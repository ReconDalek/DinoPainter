// /api/designs/:id  ->  one approved design (used by design.html for remote ids)
import { json, publicRow } from "../_lib.js";

export async function onRequestGet({ params, env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, dino, colors, title, credit, created_at
       FROM designs
      WHERE id = ? AND status = 'approved'
      LIMIT 1`
  )
    .bind(params.id)
    .all();

  if (!results || !results.length) {
    return json({ error: "Not found." }, 404);
  }
  return json(publicRow(results[0]), 200, { "cache-control": "public, max-age=300" });
}
