// Client for the community-designs API. Fails soft: if the API is unreachable
// (e.g. running from plain GitHub Pages), callers just get an empty list.

async function fetchRemoteDesigns(limit = 24) {
  try {
    const res = await fetch(`${API_BASE}/api/designs?limit=${encodeURIComponent(limit)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.designs) ? data.designs : [];
  } catch {
    return [];
  }
}

async function fetchRemoteDesign(id) {
  try {
    const res = await fetch(`${API_BASE}/api/designs/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// payload: { dino, colors: { region: colourId }, title?, credit? }
// returns { ok, id, status } or { ok:false, error }
async function submitDesign(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/designs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || `Error ${res.status}` };
    return { ok: true, id: data.id, status: data.status };
  } catch {
    return { ok: false, error: "Network error — please try again." };
  }
}
