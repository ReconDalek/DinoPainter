// Shared helpers for the /api Functions.
import DINO_KEYS from "../_data/dino-keys.json";

const DINO_SET = new Set(DINO_KEYS);

export const MAX_TITLE = 40;
export const MAX_CREDIT = 24;
export const RATE_LIMIT_PER_HOUR = 8;

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export function badRequest(message) {
  return json({ error: message }, 400);
}

// Short, URL-safe, non-guessable id.
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

export async function hashIp(ip, salt) {
  const data = new TextEncoder().encode(`${salt || ""}:${ip || "unknown"}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Strip anything that isn't plain text; collapse whitespace.
function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const stripped = value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (!stripped) return null;
  return stripped.slice(0, max);
}

// Validate and normalise an incoming submission body.
// Returns { ok: true, value } or { ok: false, error }.
export function validateSubmission(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };

  const dino = body.dino;
  if (typeof dino !== "string" || !DINO_SET.has(dino)) {
    return { ok: false, error: "Unknown creature." };
  }

  const colorsIn = body.colors;
  if (!colorsIn || typeof colorsIn !== "object") {
    return { ok: false, error: "Missing colours." };
  }

  const colors = {};
  for (const [region, id] of Object.entries(colorsIn)) {
    const r = Number(region);
    const c = Number(id);
    if (!Number.isInteger(r) || r < 0 || r > 5) return { ok: false, error: "Bad region." };
    if (!Number.isInteger(c) || c < 1 || c > 255) return { ok: false, error: "Bad colour id." };
    colors[r] = c;
  }
  const regionCount = Object.keys(colors).length;
  if (regionCount < 1 || regionCount > 6) {
    return { ok: false, error: "A design needs 1–6 coloured regions." };
  }

  return {
    ok: true,
    value: {
      dino,
      colors,
      title: cleanText(body.title, MAX_TITLE),
      credit: cleanText(body.credit, MAX_CREDIT),
    },
  };
}

// Returns null when authorised, or a 401 Response when not.
export function requireAdmin(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = env.ADMIN_TOKEN || "";
  if (!expected || token.length !== expected.length) {
    return json({ error: "Unauthorised." }, 401);
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? null : json({ error: "Unauthorised." }, 401);
}

// Shape a DB row for the public API.
export function publicRow(row) {
  return {
    id: row.id,
    dino: row.dino,
    colors: JSON.parse(row.colors),
    title: row.title || null,
    credit: row.credit || null,
    created_at: row.created_at,
  };
}
