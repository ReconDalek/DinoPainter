// promos/promos-manager.js
// Loads the active promo rotation from the API and renders one weighted banner.
// Falls back to the hardcoded PROMOS list (promos/promos.js) if the API is
// unreachable.

function _promoApiBase() {
  return typeof API_BASE !== "undefined" ? API_BASE : "";
}

async function _fetchPromos() {
  try {
    const res = await fetch(`${_promoApiBase()}/api/promos`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.promos) && data.promos.length ? data.promos : null;
  } catch {
    return null;
  }
}

function _pickWeighted(list) {
  const total = list.reduce((sum, p) => sum + (p.weight || 1), 0);
  let r = Math.random() * total;
  for (const p of list) {
    r -= p.weight || 1;
    if (r <= 0) return p;
  }
  return list[list.length - 1];
}

function _trackPromo(event, id) {
  const url = `${_promoApiBase()}/api/promos/${encodeURIComponent(id)}/${event}`;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: "POST", keepalive: true });
    }
  } catch {
    /* tracking is best-effort */
  }
}

async function loadPromoBanner() {
  const banner = document.getElementById("promoBanner");
  const img = document.getElementById("promoImage");
  const link = document.getElementById("promoLink");
  if (!banner || !img || !link) return; // page has no promo slot

  let list = await _fetchPromos();
  if (!list) {
    list = (typeof PROMOS !== "undefined" ? PROMOS : []).map((p) => ({
      id: p.id,
      name: p.name,
      image_url: p.image,
      link_url: p.link,
      weight: 1,
    }));
  }
  if (!list.length) return;

  const promo = _pickWeighted(list);

  img.onerror = () => console.error("Promo image failed to load:", promo.image_url);
  img.src = promo.image_url;
  img.alt = promo.name;
  link.href = promo.link_url;
  link.title = promo.name;
  link.addEventListener("click", () => _trackPromo("click", promo.id));

  banner.classList.remove("hidden");
  _trackPromo("impression", promo.id);
}

document.addEventListener("DOMContentLoaded", () => {
  loadPromoBanner();
});


/* ---------- "Advertise your server" request modal ---------- */

let _promoModal = null;

function _buildPromoModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="promoModalTitle">
      <h3 id="promoModalTitle">Advertise your server</h3>
      <p class="modal-note">
        Submit your ARK server and it'll be reviewed before going into the
        banner rotation. Free — we just check the banner and link.
      </p>
      <label>Server name
        <input type="text" id="promoName" maxlength="40" placeholder="e.g. ExArk">
      </label>
      <label>Banner image URL <span class="modal-optional">(~714×400, https)</span>
        <input type="url" id="promoImg" maxlength="500" placeholder="https://…/banner.webp">
      </label>
      <label>Discord invite (or site) URL
        <input type="url" id="promoUrl" maxlength="500" placeholder="https://discord.gg/…">
      </label>
      <div id="promoResult" class="modal-result"></div>
      <div class="button-row">
        <button class="subtle" id="promoCancel">Cancel</button>
        <button class="primary" id="promoSend">Submit</button>
      </div>
    </div>`;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) _closePromoModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) _closePromoModal();
  });
  overlay.querySelector("#promoCancel").addEventListener("click", _closePromoModal);
  overlay.querySelector("#promoSend").addEventListener("click", _submitPromoRequest);

  document.body.appendChild(overlay);
  return overlay;
}

function _closePromoModal() {
  if (_promoModal) _promoModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function _submitPromoRequest() {
  const q = (sel) => _promoModal.querySelector(sel);
  const result = q("#promoResult");
  const payload = {
    name: q("#promoName").value.trim(),
    image_url: q("#promoImg").value.trim(),
    link_url: q("#promoUrl").value.trim(),
  };

  if (!payload.name || !payload.image_url || !payload.link_url) {
    result.textContent = "Please fill in all three fields.";
    return;
  }

  q("#promoSend").disabled = true;
  result.textContent = "Submitting…";

  try {
    const res = await fetch(`${_promoApiBase()}/api/promos/request`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    q("#promoSend").disabled = false;
    if (res.ok) {
      result.textContent = "Thanks! Your server is in the review queue.";
      setTimeout(_closePromoModal, 2000);
    } else {
      result.textContent = data.error || `Error ${res.status}`;
    }
  } catch {
    q("#promoSend").disabled = false;
    result.textContent = "Network error — please try again.";
  }
}

function openPromoForm() {
  if (!_promoModal) _promoModal = _buildPromoModal();
  ["#promoName", "#promoImg", "#promoUrl"].forEach((s) => (_promoModal.querySelector(s).value = ""));
  _promoModal.querySelector("#promoResult").textContent = "";
  _promoModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}
