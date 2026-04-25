const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// UI Elements
const presetDisplay = document.getElementById("presetSelectFake");
const presetDropdown = document.getElementById("presetDropdown");
const resetBtn = document.getElementById("resetPreset");
const dinoInput = document.getElementById("dinoInput");
const dinoList = document.getElementById("dinoList");

let currentDino = null;
let masks = {};
let baseImage = new Image();
let regionState = {}; 
let selectedDinoKey = Object.keys(DINOS)[0]; 
let commandMode = "simple"; 

// --- Searchable Dino Dropdown Logic ---

function renderDinoList(filter = "") {
  dinoList.innerHTML = "";
  
  // Filter the DINOS object keys based on the name property
  const filteredKeys = Object.keys(DINOS).filter(key => 
    DINOS[key].name.toLowerCase().includes(filter.toLowerCase())
  );

  filteredKeys.forEach(key => {
    const div = document.createElement("div");
    div.className = "dropdown-item";
    div.textContent = DINOS[key].name;
    
    div.addEventListener("click", () => {
      dinoInput.value = DINOS[key].name;
      selectedDinoKey = key; 
      dinoList.classList.add("hidden");
      loadDino(); 
    });
    
    dinoList.appendChild(div);
  });
}

// Search Event Listeners
dinoInput.addEventListener("focus", () => renderDinoList(dinoInput.value));
dinoInput.addEventListener("input", (e) => {
  renderDinoList(e.target.value);
  dinoList.classList.remove("hidden");
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".searchable-dropdown")) {
    dinoList.classList.add("hidden");
  } else if (e.target === dinoInput) {
    dinoList.classList.remove("hidden");
  }
});

// --- Preset Logic ---

for (let key in PRESETS) {
  const ids = PRESETS[key];
  const colors = ids
    .map(id => COLORS.find(c => c.id == id))
    .filter(Boolean)
    .map(c => c.hex);

  const div = document.createElement("div");
  div.textContent = key.toUpperCase();
  div.style.background = `linear-gradient(to right, ${colors.join(",")})`;

  const avgBrightness = colors.reduce((sum, hex) => {
    const { r, g, b } = hexToRgb(hex);
    return sum + (r*299 + g*587 + b*114)/1000;
  },0)/colors.length;

  div.style.color = avgBrightness > 140 ? "#000" : "#fff";

  div.addEventListener("click", () => {
    presetDisplay.textContent = key.toUpperCase();
    presetDisplay.style.background = `linear-gradient(to right, ${colors.join(",")})`;
    presetDisplay.style.color = avgBrightness > 140 ? "#000" : "#fff";
    applyPresetById(key);
    presetDropdown.classList.add("hidden");
  });
  presetDropdown.appendChild(div);
}

presetDisplay.addEventListener("click", () => {
  presetDropdown.classList.toggle("hidden");
});

resetBtn.addEventListener("click", () => {
  presetDisplay.textContent = "Presets ▼";
  presetDisplay.style.background = "#1e293b";
  presetDisplay.style.color = "#fff";

  dinoInput.value = currentDino.name; 
  regionState = {}; 
  loadDino(); 
});

// --- Core Functions ---

function applyPresetById(presetName) {
  const preset = PRESETS[presetName];
  currentDino.regions.forEach((region, index) => {
    const select = document.getElementById(`region-${region}`);
    const colorId = preset[index % preset.length];
    const colorObj = COLORS.find(c => c.id == colorId);
    if (!colorObj) return;

    select.value = colorObj.hex;
    select.style.backgroundColor = colorObj.hex;
    select.style.color = getContrastColor(colorObj.hex);
    regionState[region] = colorObj.hex;
  });
  generate();
}

window.addEventListener("DOMContentLoaded", () => {
  loadFromURL();

  const firstKey = selectedDinoKey || Object.keys(DINOS)[0];
  selectedDinoKey = firstKey;

  dinoInput.value = DINOS[firstKey].name;
  loadDino();
});

document.getElementById("modeSimple").onclick = () => {
  commandMode = "simple";
  updateAdminCommand();
};

document.getElementById("modeFull").onclick = () => {
  commandMode = "full";
  updateAdminCommand();
};

function loadDino() {
  const key = selectedDinoKey; 
  currentDino = DINOS[key];

  masks = {};
  document.getElementById("regions").innerHTML = "";
  baseImage = new Image();
  baseImage.src = `images/${currentDino.folder}/base.png`;

  baseImage.onerror = () => {
    drawErrorPlaceholder("Base image failed to load");
  };

  for (let region = 0; region < 6; region++) {
    const isActive = currentDino.regions.includes(region);
    if (isActive) {
      const img = new Image();
      img.src = `images/${currentDino.folder}/region${region}.png`;
      masks[region] = img;
    }

    createRegionUI(region, isActive);
    const select = document.getElementById(`region-${region}`);

    if (regionState[region]) {
      select.value = regionState[region];
      select.style.backgroundColor = regionState[region];
      select.style.color = getContrastColor(regionState[region]);
    }
  }
  generate();
}

function createRegionUI(region, isActive) {
  const container = document.createElement("div");
  container.className = "region";
  if (!isActive) container.classList.add("disabled");

  const label = document.createElement("label");
  label.textContent = `Region ${region}`;

  const select = document.createElement("select");
  select.id = `region-${region}`;

  // --- Disabled region handling ---
  if (!isActive) {
    select.disabled = true;

    const disabledOption = document.createElement("option");
    disabledOption.value = "disabled";
    disabledOption.textContent = "Disabled";
    select.appendChild(disabledOption);

    // Ensure no lingering state
    delete regionState[region];

  } else {
    // Normal active region setup
    const defaultOption = document.createElement("option");
    defaultOption.value = "unchanged";
    defaultOption.textContent = "Unchanged";
    select.appendChild(defaultOption);

    COLORS.forEach(c => {
      const option = document.createElement("option");
      option.value = c.hex;
      option.textContent = `⬛ ${c.id} - ${c.name}`;
      option.dataset.id = c.id;
      option.style.backgroundColor = c.hex;
      option.style.color = getContrastColor(c.hex);
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      if (select.value !== "unchanged") {
        select.style.backgroundColor = select.value;
        select.style.color = getContrastColor(select.value);
        regionState[region] = select.value;
      } else {
        select.style.backgroundColor = "";
        select.style.color = "";
        delete regionState[region];
      }
      generate();
    });
  }

  container.appendChild(label);
  container.appendChild(select);
  document.getElementById("regions").appendChild(container);
}

// --- Helpers & Rendering ---

function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function applyMask(maskImg, baseImg, color) {
  if (!maskImg.complete || !baseImg.complete) return document.createElement("canvas");
  const width = baseImg.width;
  const height = baseImg.height;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width; maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = width; baseCanvas.height = height;
  const baseCtx = baseCanvas.getContext("2d");

  maskCtx.drawImage(maskImg, 0, 0, width, height);
  baseCtx.drawImage(baseImg, 0, 0, width, height);

  const maskData = maskCtx.getImageData(0, 0, width, height);
  const baseData = baseCtx.getImageData(0, 0, width, height);
  const m = maskData.data;
  const b = baseData.data;

  for (let i = 0; i < m.length; i += 4) {
    const ma = m[i + 3];
    if (ma < 10) { m[i + 3] = 0; continue; }

    const redStrength = m[i] - Math.max(m[i+1], m[i+2]);
    if (redStrength > 10) {
      const mask = Math.min(1, redStrength / 255);
      let luminance = (0.2126 * b[i] + 0.7152 * b[i+1] + 0.0722 * b[i+2]) / 255;
      luminance = Math.pow(luminance, 0.9);

      m[i] = color.r * luminance;
      m[i+1] = color.g * luminance;
      m[i+2] = color.b * luminance;
      m[i+3] = 255 * mask;
    } else {
      m[i + 3] = 0;
    }
  }
  maskCtx.putImageData(maskData, 0, 0);
  return maskCanvas;
}

function drawCentered(img, baseWidth, baseHeight) {
  // Calculate scale to fit inside canvas
  const fitScale = Math.min(canvas.width / baseWidth, canvas.height / baseHeight);

  // Prevent upscaling (this is the key fix)
  const scale = Math.min(1, fitScale);

  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;

  const x = (canvas.width - drawWidth) / 2;
  const y = (canvas.height - drawHeight) / 2;

  ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

function updateAdminCommand() {
  if (!currentDino) return;

  const commands = [];

  currentDino.regions.forEach(region => {
    const select = document.getElementById(`region-${region}`);
    if (!select || select.value === "unchanged") return;

    const colorId = select.options[select.selectedIndex].dataset.id;
    commands.push(`cheat setTargetDinoColor ${region} ${colorId}`);
  });

  let output = "";

  if (commandMode === "simple") {
    output = commands.join(" | ");
  } else {
    // FULL SPAWN VERSION
    const spawn = currentDino.path
  ? `cheat gmsummon "${currentDino.path}" 150`
  : "cheat gmsummon \"<missing_path>\" 150";
    output = [spawn, ...commands].join(" | ");
  }

  document.getElementById("adminCommand").value = output;
  const textarea = document.getElementById("adminCommand");
    textarea.value = output;
    autoResizeTextarea(textarea);
}

function autoResizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function copyCommand() {
  const textarea = document.getElementById("adminCommand");
  textarea.select();
  document.execCommand("copy");
  showTooltip();
}

function copyShareLink() {
  const url = window.location.href;

  if (navigator.share) {
    navigator.share({
      title: "ARK Dino Painter",
      url: url
    }).catch(() => {});
  } else {
    fallbackCopy(url);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
    showTooltip("Link copied!");
  } catch (err) {
    showTooltip("Copy failed");
  }

  document.body.removeChild(textarea);
}

function updateURL() {
  if (!currentDino) return;

  const params = new URLSearchParams();
  params.set("dino", selectedDinoKey);

  Object.entries(regionState).forEach(([region, hex]) => {
    const color = COLORS.find(c => c.hex === hex);
    if (color) params.set(`r${region}`, color.id);
  });

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);

  const dino = params.get("dino");
  if (dino && DINOS[dino]) {
    selectedDinoKey = dino;
    dinoInput.value = DINOS[dino].name;
  }

  regionState = {};

  for (let i = 0; i < 6; i++) {
    const val = params.get(`r${i}`);
    if (!val) continue;

    const color = COLORS.find(c => c.id == val);
    if (color) {
      regionState[i] = color.hex;
    }
  }
}

function showTooltip(message = "Command copied to clipboard") {
  let tooltip = document.getElementById("copyTooltip") || document.createElement("div");

  tooltip.id = "copyTooltip";
  tooltip.textContent = message;

  if (!document.getElementById("copyTooltip")) {
    document.body.appendChild(tooltip);
  }

  tooltip.classList.add("show");
  setTimeout(() => tooltip.classList.remove("show"), 2000);
}

function randomizeColors() {
  currentDino.regions.forEach(region => {
    const select = document.getElementById(`region-${region}`);
    const random = COLORS[Math.floor(Math.random() * COLORS.length)];
    select.value = random.hex;
    select.style.backgroundColor = random.hex;
    select.style.color = getContrastColor(random.hex);
    regionState[region] = random.hex;
  });
  generate();
}

function smartRandomize() {
  const base = COLORS[Math.floor(Math.random() * COLORS.length)];
  const baseRGB = hexToRgb(base.hex);
  currentDino.regions.forEach(region => {
    const select = document.getElementById(`region-${region}`);
    const similar = COLORS.filter(c => {
      const rgb = hexToRgb(c.hex);
      return (Math.abs(rgb.r - baseRGB.r) + Math.abs(rgb.g - baseRGB.g) + Math.abs(rgb.b - baseRGB.b)) < 200;
    });
    const chosen = similar[Math.floor(Math.random() * similar.length)];
    select.value = chosen.hex;
    select.style.backgroundColor = chosen.hex;
    select.style.color = getContrastColor(chosen.hex);
    regionState[region] = chosen.hex;
  });
  generate();
}

async function generate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!baseImage.complete) await new Promise(res => baseImage.onload = res);
  await Promise.all(Object.values(masks).map(img => img.complete ? Promise.resolve() : new Promise(res => img.onload = res)));

  drawCentered(baseImage, baseImage.width, baseImage.height);

  for (let i = 0; i < 6; i++) {
    if (!currentDino.regions.includes(i)) continue;
    const select = document.getElementById(`region-${i}`);
    if (select.value === "unchanged") continue;

    const layer = applyMask(masks[i], baseImage, hexToRgb(select.value));
    ctx.imageSmoothingEnabled = false;
    drawCentered(layer, baseImage.width, baseImage.height);
    ctx.imageSmoothingEnabled = true;
  }
  updateAdminCommand();
  updateURL();
}

function drawErrorPlaceholder(text) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ef4444";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}