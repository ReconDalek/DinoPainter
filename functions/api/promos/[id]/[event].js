// POST /api/promos/:id/impression  and  /api/promos/:id/click
// Fire-and-forget counters. Only bump live promos.
import { json } from "../../_lib.js";

export async function onRequestPost({ params, env }) {
  const column = params.event === "impression" ? "impressions" : params.event === "click" ? "clicks" : null;
  if (!column) return json({ error: "Unknown event." }, 404);

  await env.DB.prepare(
    `UPDATE promos SET ${column} = ${column} + 1
      WHERE id = ? AND status = 'approved'`
  )
    .bind(params.id)
    .run();

  // 204 keeps sendBeacon happy and returns nothing.
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
