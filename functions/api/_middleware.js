// Wraps every /api route so failures return readable JSON instead of a bare
// Cloudflare 1101 page.
export async function onRequest(context) {
  const { env } = context;

  if (!env.DB) {
    return json({ error: "Server misconfigured: D1 binding 'DB' is missing." }, 500);
  }

  try {
    return await context.next();
  } catch (e) {
    return json({ error: "Server error.", detail: String((e && e.message) || e) }, 500);
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
