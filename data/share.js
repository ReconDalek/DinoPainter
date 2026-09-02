// "Share to Gallery" flow for the painter. Depends on globals from script.js
// (selectedDinoKey, regionState, COLORS) and remote-gallery.js (submitDesign).

function _currentRegionColorIds() {
  const out = {};
  Object.entries(typeof regionState === "object" ? regionState : {}).forEach(([region, hex]) => {
    const c = COLORS.find((x) => x.hex === hex);
    if (c) out[region] = c.id;
  });
  return out;
}

let _shareModal = null;

function _buildShareModal() {
  const overlay = document.createElement("div");
  overlay.className = "share-overlay hidden";
  overlay.innerHTML = `
    <div class="share-modal" role="dialog" aria-modal="true" aria-labelledby="shareModalTitle">
      <h3 id="shareModalTitle">Share this design</h3>
      <p class="share-note">
        Submissions are reviewed before they appear in the public gallery.
        Only the creature and its colours are stored — no personal data.
      </p>
      <label>Design name <span class="share-optional">(optional)</span>
        <input type="text" id="shareTitle" maxlength="40" placeholder="e.g. Molten Rex">
      </label>
      <label>Credit as <span class="share-optional">(optional)</span>
        <input type="text" id="shareCredit" maxlength="24" placeholder="your name / tag">
      </label>
      <div id="shareResult" class="share-result"></div>
      <div class="button-row">
        <button class="subtle" id="shareCancel">Cancel</button>
        <button class="primary" id="shareSubmit">Submit</button>
      </div>
    </div>`;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) _closeShareModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) _closeShareModal();
  });
  overlay.querySelector("#shareCancel").addEventListener("click", _closeShareModal);
  overlay.querySelector("#shareSubmit").addEventListener("click", _doSubmit);

  document.body.appendChild(overlay);
  return overlay;
}

function _closeShareModal() {
  if (_shareModal) _shareModal.classList.add("hidden");
  document.body.classList.remove("share-open");
}

async function _doSubmit() {
  const btn = _shareModal.querySelector("#shareSubmit");
  const result = _shareModal.querySelector("#shareResult");
  const colors = _currentRegionColorIds();

  if (Object.keys(colors).length === 0) {
    result.textContent = "Colour at least one region first.";
    return;
  }

  btn.disabled = true;
  result.textContent = "Submitting…";

  const res = await submitDesign({
    dino: selectedDinoKey,
    colors,
    title: _shareModal.querySelector("#shareTitle").value.trim(),
    credit: _shareModal.querySelector("#shareCredit").value.trim(),
  });

  btn.disabled = false;
  if (res.ok) {
    result.textContent = "Thanks! Your design is in the review queue.";
    setTimeout(_closeShareModal, 1800);
  } else {
    result.textContent = res.error || "Something went wrong.";
  }
}

function shareToGallery() {
  if (typeof submitDesign !== "function") return;
  if (!_shareModal) _shareModal = _buildShareModal();
  _shareModal.querySelector("#shareResult").textContent = "";
  _shareModal.querySelector("#shareTitle").value = "";
  _shareModal.querySelector("#shareCredit").value = "";
  _shareModal.classList.remove("hidden");
  document.body.classList.add("share-open");
}
