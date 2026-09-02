// data/gallery-ui.js
// Shared rendering helpers for the gallery grid, the homepage carousel and the
// individual design pages. Depends on: dinos.js, colors.js, presets.js, preview.js

// Runtime registry of every entry we've rendered — curated + remote — so the
// lazy painter and design lookups can resolve ids that aren't in GALLERY.
const _entryRegistry = new Map(GALLERY.map((e) => [e.id, e]));

function registerEntry(entry) {
  if (entry && entry.id) _entryRegistry.set(entry.id, entry);
  return entry;
}

function galleryEntryById(id) {
  return _entryRegistry.get(id) || GALLERY.find((e) => e.id === id) || null;
}

// De-dupe a remote list against the curated seed (curated wins).
function mergeDesigns(remote, seed) {
  const seen = new Set(seed.map((e) => e.id));
  return [...remote.filter((e) => !seen.has(e.id)), ...seed];
}

// index.html?dino=rex&r0=14&r4=17 ...  (matches script.js loadFromURL)
function buildPainterUrl(entry) {
  const dino = DINOS[entry.dino];
  const colors = resolveEntryColors(entry, dino);
  const params = new URLSearchParams();
  params.set("dino", entry.dino);
  Object.entries(colors).forEach(([region, c]) => params.set(`r${region}`, c.id));
  return `index.html?${params.toString()}`;
}

function buildDesignUrl(entry) {
  return `design.html?id=${encodeURIComponent(entry.id)}`;
}

// "Region 0: Black · Region 1: Dark Red · Region 4: White"
function describeColors(colors) {
  return Object.entries(colors)
    .sort((a, b) => a[0] - b[0])
    .map(([region, c]) => `Region ${region}: ${c.name}`)
    .join(" · ");
}

function buildColourCommand(entry) {
  const dino = DINOS[entry.dino];
  const colors = resolveEntryColors(entry, dino);
  const parts = Object.entries(colors)
    .sort((a, b) => a[0] - b[0])
    .map(([region, c]) => `setTargetDinoColor ${region} ${c.id}`);
  return parts.length ? `cheat ${parts.join(" | ")}` : "";
}

function renderSwatchStrip(colors) {
  const strip = document.createElement("div");
  strip.className = "swatch-strip";
  Object.entries(colors)
    .sort((a, b) => a[0] - b[0])
    .forEach(([region, c]) => {
      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = c.hex;
      sw.title = `Region ${region}: ${c.name}`;
      strip.appendChild(sw);
    });
  return strip;
}

// Paint a card's canvas only once it scrolls near the viewport.
const _lazyPainter = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const canvas = e.target;
      obs.unobserve(canvas);
      const entry = galleryEntryById(canvas.dataset.entryId);
      if (!entry) return;
      const dino = DINOS[entry.dino];
      const colors = resolveEntryColors(entry, dino);
      const hexMap = {};
      Object.entries(colors).forEach(([r, c]) => (hexMap[r] = c.hex));
      paintDino(canvas, dino, hexMap);
    });
  },
  { rootMargin: "300px" }
);

function renderGalleryCard(entry) {
  registerEntry(entry);
  const dino = DINOS[entry.dino];
  const colors = resolveEntryColors(entry, dino);

  const card = document.createElement("a");
  card.className = "gallery-card";
  card.href = buildDesignUrl(entry);

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  canvas.className = "gallery-card-canvas";
  canvas.dataset.entryId = entry.id;
  _lazyPainter.observe(canvas);

  const body = document.createElement("div");
  body.className = "gallery-card-body";

  const h = document.createElement("div");
  h.className = "gallery-card-title";
  h.textContent = entry.title;

  const sub = document.createElement("div");
  sub.className = "gallery-card-sub";
  sub.textContent = dino ? dino.name : entry.dino;

  body.appendChild(h);
  body.appendChild(sub);
  body.appendChild(renderSwatchStrip(colors));

  card.appendChild(canvas);
  card.appendChild(body);
  return card;
}

function isRenderable(entry) {
  return entry && DINOS[entry.dino];
}

// Full grid: community-approved designs first (newest), then the curated seed.
async function renderGalleryGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const seed = GALLERY.filter(isRenderable);
  seed.forEach((entry) => el.appendChild(renderGalleryCard(entry)));

  if (typeof fetchRemoteDesigns !== "function") return;
  const remote = (await fetchRemoteDesigns(60)).filter(isRenderable);
  const fresh = mergeDesigns(remote, seed).filter((e) => !seed.includes(e));
  fresh.forEach((entry) => el.insertBefore(renderGalleryCard(entry), el.firstChild));
}

// Small rotating strip of N random designs, mixing community + curated.
async function renderGalleryCarousel(containerId, count) {
  const el = document.getElementById(containerId);
  if (!el) return;
  count = count || 4;

  let pool = GALLERY.filter(isRenderable);
  if (typeof fetchRemoteDesigns === "function") {
    const remote = (await fetchRemoteDesigns(30)).filter(isRenderable);
    pool = mergeDesigns(remote, pool);
  }
  pool
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .forEach((entry) => el.appendChild(renderGalleryCard(entry)));
}
