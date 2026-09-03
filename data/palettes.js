// data/palettes.js
// Community palettes: pulled from /api/palettes and shown under the built-in
// PRESETS in the painter's dropdown, plus a "submit a palette" modal.
// Loads AFTER script.js (needs PRESETS, COLORS, hexToRgb, applyPresetById,
// presetDisplay, presetDropdown, regionState).

(function () {
  const base = typeof API_BASE !== "undefined" ? API_BASE : "";
  const N = 6;

  function contrastFor(hexes) {
    const avg =
      hexes.reduce((s, hex) => {
        const { r, g, b } = hexToRgb(hex);
        return s + (r * 299 + g * 587 + b * 114) / 1000;
      }, 0) / hexes.length;
    return avg > 140 ? "#000" : "#fff";
  }

  function addDropdownEntry(dd, label, colorIds, onClick) {
    const hexes = colorIds.map((id) => COLORS.find((c) => c.id == id)).filter(Boolean).map((c) => c.hex);
    const div = document.createElement("div");
    div.textContent = label.toUpperCase();
    div.style.background = `linear-gradient(to right, ${hexes.join(",")})`;
    div.style.color = contrastFor(hexes);
    div.addEventListener("click", () => {
      presetDisplay.textContent = label.toUpperCase();
      presetDisplay.style.background = div.style.background;
      presetDisplay.style.color = div.style.color;
      onClick();
      presetDropdown.classList.add("hidden");
    });
    dd.appendChild(div);
    return div;
  }

  async function loadCommunityPalettes() {
    const dd = document.getElementById("presetDropdown");
    if (!dd || typeof PRESETS === "undefined") return;

    // "Submit a palette" trigger, pinned to the top.
    const submit = document.createElement("div");
    submit.textContent = "✏️  SUBMIT A PALETTE…";
    submit.style.cssText = "text-align:center;font-weight:600;background:#0f172a;color:#93c5fd;";
    submit.addEventListener("click", () => {
      presetDropdown.classList.add("hidden");
      openPaletteSubmit();
    });
    dd.insertBefore(submit, dd.firstChild);

    let list = [];
    try {
      const res = await fetch(`${base}/api/palettes`);
      if (res.ok) list = (await res.json()).palettes || [];
    } catch {
      /* offline — just show built-ins */
    }
    if (!list.length) return;

    const divider = document.createElement("div");
    divider.textContent = "— COMMUNITY —";
    divider.style.cssText = "text-align:center;font-size:11px;opacity:0.55;pointer-events:none;padding:5px;";
    dd.appendChild(divider);

    list.forEach((p) => {
      const key = "p_" + p.id;
      PRESETS[key] = p.colors;
      const label = p.credit ? `${p.name} · ${p.credit}` : p.name;
      addDropdownEntry(dd, label, p.colors, () => applyPresetById(key));
    });
  }

  // ---- submission modal ----
  let modal = null;

  function currentRegionColorIds() {
    const ids = [];
    if (typeof regionState === "object") {
      Object.values(regionState).forEach((hex) => {
        const c = COLORS.find((x) => x.hex === hex);
        if (c) ids.push(c.id);
      });
    }
    return ids;
  }

  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay hidden";

    const prefill = currentRegionColorIds();
    const options = COLORS.map((c) => `<option value="${c.id}">${c.id} · ${c.name}</option>`).join("");
    let selects = "";
    for (let i = 0; i < N; i++) {
      selects += `<select data-slot="${i}" style="width:100%;padding:6px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;">${options}</select>`;
    }

    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="paletteModalTitle">
        <h3 id="paletteModalTitle">Submit a palette</h3>
        <p class="modal-note">
          Reviewed before it appears in the Presets list. Six colours, applied
          across a creature's regions in order.
        </p>
        <label>Palette name
          <input type="text" id="palName" maxlength="30" placeholder="e.g. Coral Reef">
        </label>
        <label>Credit as <span class="modal-optional">(optional)</span>
          <input type="text" id="palCredit" maxlength="24" placeholder="your name / tag">
        </label>
        <div id="palSwatches" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">${selects}</div>
        <div id="palResult" class="modal-result"></div>
        <div class="button-row">
          <button class="subtle" id="palCancel">Cancel</button>
          <button class="primary" id="palSend">Submit</button>
        </div>
      </div>`;

    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
    });
    overlay.querySelector("#palCancel").addEventListener("click", close);
    overlay.querySelector("#palSend").addEventListener("click", send);

    // prefill from the current design (cycled) and colour each select as a preview
    overlay.querySelectorAll("select[data-slot]").forEach((sel, i) => {
      if (prefill.length) sel.value = prefill[i % prefill.length];
      const paint = () => {
        const c = COLORS.find((x) => x.id == sel.value);
        if (!c) return;
        const { r, g, b } = hexToRgb(c.hex);
        sel.style.background = c.hex;
        sel.style.color = (r * 299 + g * 587 + b * 114) / 1000 > 140 ? "#000" : "#fff";
      };
      sel.addEventListener("change", paint);
      paint();
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function close() {
    if (modal) modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  async function send() {
    const q = (s) => modal.querySelector(s);
    const result = q("#palResult");
    const colors = [...modal.querySelectorAll("select[data-slot]")].map((s) => Number(s.value));
    const name = q("#palName").value.trim();
    if (!name) { result.textContent = "Give it a name."; return; }

    q("#palSend").disabled = true;
    result.textContent = "Submitting…";
    try {
      const res = await fetch(`${base}/api/palettes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, colors, credit: q("#palCredit").value.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      q("#palSend").disabled = false;
      if (res.ok) {
        result.textContent = "Thanks! It's in the review queue.";
        setTimeout(close, 1800);
      } else {
        result.textContent = data.error || `Error ${res.status}`;
      }
    } catch {
      q("#palSend").disabled = false;
      result.textContent = "Network error — please try again.";
    }
  }

  window.openPaletteSubmit = function () {
    if (!modal) modal = buildModal();
    modal.querySelector("#palResult").textContent = "";
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCommunityPalettes);
  } else {
    loadCommunityPalettes();
  }
})();
