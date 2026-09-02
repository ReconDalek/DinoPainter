// GET /api/promos  ->  the live rotation (approved + enabled), no stats exposed.
import { json, publicPromo } from "../_lib.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, image_url, link_url, weight
       FROM promos
      WHERE status = 'approved' AND enabled = 1
      ORDER BY created_at ASC`
  ).all();

  return json(
    { promos: (results || []).map(publicPromo) },
    200,
    { "cache-control": "public, max-age=120" }
  );
}
