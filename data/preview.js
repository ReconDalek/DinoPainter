// data/preview.js
// Standalone dino preview renderer. No dependency on script.js so it can be
// reused on the gallery and shareable-design pages.
//
// Usage:
//   paintDino(canvasEl, DINOS["rex"], { 0: "#3B3B3B", 1: "#812118", ... });
//
// `regionColors` maps a region index to a hex string. Missing regions are
// left at the creature's default colour.

(function (global) {
  function hexToRgb(hex) {
    const n = parseInt(String(hex).replace("#", ""), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // Tint a red-channel region mask by `color`, preserving the base image's
  // luminance. Mirrors the masking maths used by the main painter.
  function applyMask(maskImg, baseImg, color) {
    const w = baseImg.width;
    const h = baseImg.height;

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext("2d");

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = w;
    baseCanvas.height = h;
    const baseCtx = baseCanvas.getContext("2d");

    maskCtx.drawImage(maskImg, 0, 0, w, h);
    baseCtx.drawImage(baseImg, 0, 0, w, h);

    const maskData = maskCtx.getImageData(0, 0, w, h);
    const baseData = baseCtx.getImageData(0, 0, w, h);
    const m = maskData.data;
    const b = baseData.data;

    for (let i = 0; i < m.length; i += 4) {
      if (m[i + 3] < 10) {
        m[i + 3] = 0;
        continue;
      }
      const redStrength = m[i] - Math.max(m[i + 1], m[i + 2]);
      if (redStrength > 10) {
        const strength = Math.min(1, redStrength / 255);
        let luminance = (0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2]) / 255;
        luminance = Math.pow(luminance, 0.9);
        m[i] = color.r * luminance;
        m[i + 1] = color.g * luminance;
        m[i + 2] = color.b * luminance;
        m[i + 3] = 255 * strength;
      } else {
        m[i + 3] = 0;
      }
    }

    maskCtx.putImageData(maskData, 0, 0);
    return maskCanvas;
  }

  async function paintDino(canvas, dino, regionColors) {
    if (!canvas || !dino) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const base = await loadImage(`images/${dino.folder}/base.png`);
    if (!base) return;

    const fit = Math.min(canvas.width / base.width, canvas.height / base.height, 1);
    const drawW = base.width * fit;
    const drawH = base.height * fit;
    const offX = (canvas.width - drawW) / 2;
    const offY = (canvas.height - drawH) / 2;

    ctx.drawImage(base, offX, offY, drawW, drawH);

    for (const region of dino.regions) {
      const hex = regionColors && regionColors[region];
      if (!hex) continue;

      const mask = await loadImage(`images/${dino.folder}/region${region}.png`);
      if (!mask) continue;

      const layer = applyMask(mask, base, hexToRgb(hex));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(layer, offX, offY, drawW, drawH);
      ctx.imageSmoothingEnabled = true;
    }
  }

  // Resolve a gallery entry to a { regionIndex: {id, name, hex} } map.
  // Entries may carry explicit `colors` (region -> colour ID) or reference a
  // preset by name, which is laid across the creature's regions in order.
  function resolveEntryColors(entry, dino) {
    const out = {};
    if (!dino) return out;

    if (entry.colors) {
      Object.entries(entry.colors).forEach(([region, id]) => {
        const c = COLORS.find((x) => x.id == id);
        if (c) out[region] = c;
      });
      return out;
    }

    const preset = entry.preset && PRESETS[entry.preset];
    if (preset) {
      dino.regions.forEach((region, index) => {
        const c = COLORS.find((x) => x.id == preset[index % preset.length]);
        if (c) out[region] = c;
      });
    }
    return out;
  }

  global.paintDino = paintDino;
  global.resolveEntryColors = resolveEntryColors;
  global.previewHexToRgb = hexToRgb;
})(window);
