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

export const MAX_PROMO_NAME = 40;
export const MAX_URL = 500;
export const PROMO_REQUESTS_PER_DAY = 3;

function isSafeImageUrl(v) {
  if (typeof v !== "string" || v.length > MAX_URL) return false;
  if (/\s/.test(v)) return false;
  return v.startsWith("/promos/") || /^https:\/\/[^ ]+$/i.test(v);
}

function isSafeLinkUrl(v) {
  return typeof v === "string" && v.length <= MAX_URL && /^https:\/\/[^ ]+$/i.test(v);
}

export function slugId(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "promo";
  const suffix = [...crypto.getRandomValues(new Uint8Array(3))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${base}-${suffix}`;
}

// Validate a promo create/update body.
// opts.partial = true allows any subset of fields (for PATCH).
// Returns { ok, value } | { ok:false, error }.
export function validatePromo(body, opts = {}) {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };
  const partial = !!opts.partial;
  const out = {};

  const need = (field) => !partial || field in body;

  if (need("name")) {
    const name = typeof body.name === "string" ? body.name.replace(/<[^>]*>/g, "").trim() : "";
    if (!name) return { ok: false, error: "Name is required." };
    out.name = name.slice(0, MAX_PROMO_NAME);
  }
  if (need("image_url")) {
    if (!isSafeImageUrl(body.image_url)) {
      return { ok: false, error: "Image must be a /promos/… path or an https:// URL." };
    }
    out.image_url = body.image_url;
  }
  if (need("link_url")) {
    if (!isSafeLinkUrl(body.link_url)) return { ok: false, error: "Link must be an https:// URL." };
    out.link_url = body.link_url;
  }
  if ("weight" in body) {
    const w = Number(body.weight);
    if (!Number.isInteger(w) || w < 1 || w > 100) return { ok: false, error: "Weight must be 1–100." };
    out.weight = w;
  }
  if ("enabled" in body) out.enabled = body.enabled ? 1 : 0;
  if ("status" in body) {
    if (!["pending", "approved", "rejected"].includes(body.status)) {
      return { ok: false, error: "Bad status." };
    }
    out.status = body.status;
  }

  if (!partial && Object.keys(out).length < 3) {
    return { ok: false, error: "name, image_url and link_url are required." };
  }
  return { ok: true, value: out };
}

export const MAX_PALETTE_NAME = 30;
export const PALETTE_COLORS = 6;
export const PALETTE_SUBMISSIONS_PER_DAY = 5;

// Validate a palette create/update body.
// opts.partial = true for PATCH.
export function validatePalette(body, opts = {}) {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };
  const partial = !!opts.partial;
  const out = {};

  if (!partial || "name" in body) {
    const name = typeof body.name === "string" ? body.name.replace(/<[^>]*>/g, "").trim() : "";
    if (!name) return { ok: false, error: "Name is required." };
    out.name = name.slice(0, MAX_PALETTE_NAME);
  }
  if (!partial || "colors" in body) {
    const c = body.colors;
    if (!Array.isArray(c) || c.length !== PALETTE_COLORS) {
      return { ok: false, error: `Pick ${PALETTE_COLORS} colours.` };
    }
    const ids = c.map(Number);
    if (ids.some((n) => !Number.isInteger(n) || n < 1 || n > 255)) {
      return { ok: false, error: "Bad colour id." };
    }
    out.colors = ids;
  }
  if ("credit" in body) {
    out.credit =
      typeof body.credit === "string"
        ? body.credit.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_CREDIT) || null
        : null;
  }
  if ("status" in body) {
    if (!["pending", "approved", "rejected"].includes(body.status)) {
      return { ok: false, error: "Bad status." };
    }
    out.status = body.status;
  }

  if (!partial && (!out.name || !out.colors)) {
    return { ok: false, error: "name and colors are required." };
  }
  return { ok: true, value: out };
}

export function publicPalette(row) {
  return { id: row.id, name: row.name, colors: JSON.parse(row.colors), credit: row.credit || null };
}

export function adminPalette(row) {
  return {
    id: row.id,
    name: row.name,
    colors: JSON.parse(row.colors),
    credit: row.credit || null,
    status: row.status,
    created_at: row.created_at,
  };
}

export function publicPromo(row) {
  return {
    id: row.id,
    name: row.name,
    image_url: row.image_url,
    link_url: row.link_url,
    weight: row.weight || 1,
  };
}

export function adminPromo(row) {
  const ctr = row.impressions > 0 ? row.clicks / row.impressions : null;
  return {
    id: row.id,
    name: row.name,
    image_url: row.image_url,
    link_url: row.link_url,
    enabled: !!row.enabled,
    weight: row.weight || 1,
    status: row.status,
    impressions: row.impressions,
    clicks: row.clicks,
    ctr,
    created_at: row.created_at,
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
