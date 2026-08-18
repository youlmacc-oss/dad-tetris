/* Dad Tetris v1.2.0-master */
"use strict";

export const BLOCK_SKIN_IDS = ["gemstone", "glass", "wire_glass", "mecha", "candy"];
export const BLOCK_SKIN_DEFAULT = "gemstone";

let host = {
  ghostPreviewUseOuterAlpha: false,
  ghostFillAlpha() { return 0.4; },
  currentBlockSkin() { return BLOCK_SKIN_DEFAULT; },
  SHAPES: { T: [[[1, 0], [0, 1], [1, 1], [2, 1]]] },
  COLORS: { I: "#00E8E8", T: "#C44DFF", G: "#7A889C" },
  flashes: [],
  particles: [],
  COLS: 10,
  ROWS: 20,
  cellSize: 40,
};

export function bindRenderEngine(nextHost) {
  host = nextHost;
  return renderEngine;
}

export function clampBlockSkin(value) {
  let skin = String(value == null ? "" : value).trim().toLowerCase();
  if (skin === "classic") {
    skin = "wire_glass";
  }
  return BLOCK_SKIN_IDS.indexOf(skin) >= 0 ? skin : BLOCK_SKIN_DEFAULT;
}

function currentSkin() {
  if (host && typeof host.currentBlockSkin === "function") {
    return host.currentBlockSkin();
  }
  return BLOCK_SKIN_DEFAULT;
}

function fillOval(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  if (typeof ctx.ellipse === "function") {
    ctx.ellipse(cx, cy, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  } else {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(Math.max(0.5, rx), Math.max(0.5, ry));
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
  }
  ctx.fill();
}

function roundRectPath(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, Math.max(0, w / 2), Math.max(0, h / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBlockClassic(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function drawBlockWireGlass(ctx, x, y, size, color, isGhost) {
  const ghost = isGhost === true;
  const b = Math.max(2, size * 0.2);
  const pad = 0.75;
  const ox = x + pad;
  const oy = y + pad;
  const s = Math.max(1, size - pad * 2);
  const ix = ox + b;
  const iy = oy + b;
  const iw = Math.max(1, s - b * 2);
  const ih = Math.max(1, s - b * 2);

  ctx.save();
  if (ghost) {
    ctx.setLineDash([Math.max(2, size * 0.18), Math.max(2, size * 0.12)]);
    if (!host.ghostPreviewUseOuterAlpha) {
      ctx.globalAlpha = Math.max(0.05, Math.min(1, host.ghostFillAlpha()));
    }
  }
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ox, oy, s, s);

  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ix, iy);
  ctx.moveTo(ox + s, oy);
  ctx.lineTo(ix + iw, iy);
  ctx.moveTo(ox, oy + s);
  ctx.lineTo(ix, iy + ih);
  ctx.moveTo(ox + s, oy + s);
  ctx.lineTo(ix + iw, iy + ih);
  ctx.stroke();
  ctx.strokeRect(ix, iy, iw, ih);

  ctx.setLineDash([]);
  if (!host.ghostPreviewUseOuterAlpha) {
    ctx.globalAlpha = ghost ? 0.22 : 1;
  }
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = Math.max(1, size * 0.055);
  ctx.beginPath();
  ctx.moveTo(ox, oy + s * 0.7);
  ctx.lineTo(ox, oy);
  ctx.lineTo(ox + s * 0.7, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ix, iy);
  ctx.stroke();
  ctx.restore();
}

function colorRgbParts(color) {
  const raw = String(color || "").trim();
  if (raw.charAt(0) === "#" && raw.length >= 7) {
    const n = parseInt(raw.slice(1, 7), 16);
    if (Number.isFinite(n)) {
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
  }
  const m = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  return [0, 210, 255];
}

function drawBlockGlass(ctx, x, y, size, color, isGhost) {
  const ghost = isGhost === true;
  const [cr, cg, cb] = colorRgbParts(color);

  ctx.save();
  if (!ghost) {
    ctx.globalAlpha = 0.38;
  } else if (!host.ghostPreviewUseOuterAlpha) {
    ctx.globalAlpha = Math.max(0, Math.min(1, host.ghostFillAlpha()));
  }
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.restore();

  ctx.strokeStyle = ghost ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

  ctx.save();
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},${ghost ? 0.42 : 0.92})`;
  ctx.lineWidth = 1;
  ctx.shadowColor = `rgba(${cr},${cg},${cb},${ghost ? 0.28 : 0.7})`;
  ctx.shadowBlur = Math.max(2, size * 0.18);
  ctx.strokeRect(x + 1.5, y + 1.5, Math.max(1, size - 3), Math.max(1, size - 3));
  ctx.restore();

  const prism = Math.max(4, size * 0.46);
  ctx.beginPath();
  ctx.moveTo(x + 1.5, y + 1.5);
  ctx.lineTo(x + prism, y + 1.5);
  ctx.lineTo(x + 1.5, y + prism * 0.78);
  ctx.closePath();
  ctx.fillStyle = ghost ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.65)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.lineTo(x + size * 0.42, y + size * 0.08);
  ctx.strokeStyle = ghost ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, size * 0.045);
  ctx.stroke();

  const edge = Math.max(1.5, size * 0.1);
  ctx.fillStyle = ghost ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.moveTo(x + size - 1, y + size * 0.34);
  ctx.lineTo(x + size - 1, y + size - 1);
  ctx.lineTo(x + size * 0.34, y + size - 1);
  ctx.lineTo(x + size - 1 - edge, y + size - 1 - edge);
  ctx.lineTo(x + size - 1 - edge, y + size * 0.34 + edge);
  ctx.closePath();
  ctx.fill();
}

function drawBlockGemstone(ctx, x, y, size, color) {
  const b = Math.max(2, size * 0.14);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size - b, y + b);
  ctx.lineTo(x + b, y + b);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + b, y + b);
  ctx.lineTo(x + b, y + size - b);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + b, y + size - b);
  ctx.lineTo(x + size - b, y + size - b);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size - b, y + size - b);
  ctx.lineTo(x + size - b, y + b);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x + b, y + b, Math.max(1, size - b * 2), Math.max(1, size - b * 2));
}

function drawBlockMecha(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(8, 10, 16, 0.82)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, size - 1.5, size - 1.5);
  const core = Math.max(2, size * 0.25);
  const cx = x + (size - core) / 2;
  const cy = y + (size - core) / 2;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = Math.max(4, size * 0.42);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx, cy, core, core);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y + size * 0.2);
  ctx.lineTo(x + size * 0.5, y + size * 0.8);
  ctx.moveTo(x + size * 0.2, y + size * 0.5);
  ctx.lineTo(x + size * 0.8, y + size * 0.5);
  ctx.stroke();
}

function drawBlockCandy(ctx, x, y, size, color) {
  const r = Math.max(3, size * 0.2);
  ctx.fillStyle = color;
  roundRectPath(ctx, x + 1, y + 1, Math.max(1, size - 2), Math.max(1, size - 2), r);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  fillOval(ctx, x + size * 0.5, y + size * 0.3, size * 0.22, size * 0.1);
}

function drawBlock(ctx, x, y, color, size, skin, isGhost) {
  if (!ctx || size <= 0) {
    return;
  }
  const kind = clampBlockSkin(skin == null ? currentSkin() : skin);
  const ghost = isGhost === true;
  ctx.save();
  if (ghost) {
    if (!host.ghostPreviewUseOuterAlpha) {
      const strength = host && typeof host.ghostFillAlpha === "function" ? host.ghostFillAlpha() : 0.4;
      ctx.globalAlpha = Math.max(0, Math.min(1, strength));
    }
    if (kind !== "glass") {
      ctx.setLineDash([Math.max(2, size * 0.18), Math.max(2, size * 0.12)]);
    }
  }
  if (kind === "wire_glass") {
    drawBlockWireGlass(ctx, x, y, size, color, ghost);
  } else if (kind === "glass") {
    drawBlockGlass(ctx, x, y, size, color, ghost);
  } else if (kind === "gemstone") {
    drawBlockGemstone(ctx, x, y, size, color);
  } else if (kind === "mecha") {
    drawBlockMecha(ctx, x, y, size, color);
  } else if (kind === "candy") {
    drawBlockCandy(ctx, x, y, size, color);
  } else {
    drawBlockGemstone(ctx, x, y, size, color);
  }
  ctx.restore();
}

function fillBlock(ctx, x, y, size, color, isGhost) {
  drawBlock(ctx, x, y, color, size, currentSkin(), !!isGhost);
}

export function applyBackgroundToCanvas(options) {
  invalidateStaticBackground();
  if (host && typeof host.applyCurrentBackground === "function") {
    try {
      host.applyCurrentBackground(options && typeof options === "object" ? options : { fade: true });
    } catch (err) {
      try {
        console.error("[bulk-bg] applyBackgroundToCanvas", err);
      } catch (ignore) {
        /* ignore */
      }
    }
  }
  try {
    renderStaticBackground();
  } catch (err) {
    /* ignore */
  }
}

export function drawNeonWell(targetCtx, focusOn) {
  const bgCanvas = host.bgCanvas;
  const boardCanvas = host.boardCanvas;
  const w = (targetCtx && targetCtx.canvas && targetCtx.canvas.width) || (bgCanvas ? bgCanvas.width : boardCanvas.width);
  const h = (targetCtx && targetCtx.canvas && targetCtx.canvas.height) || (bgCanvas ? bgCanvas.height : boardCanvas.height);
  const [tr, tg, tb] = host.themeRgb();
  const hasBoard = document.body.classList.contains("has-board-bg")
    || !!(document.getElementById("board-wrap") && document.getElementById("board-wrap").classList.contains("has-board-bg"));
  if (hasBoard) {
    targetCtx.clearRect(0, 0, w, h);
    return;
  }
  const g = targetCtx.createLinearGradient(0, 0, w * 0.15, h);
  g.addColorStop(0, "#05070c");
  g.addColorStop(0.42, focusOn ? "#0a1522" : "#071018");
  g.addColorStop(1, "#04060a");
  targetCtx.fillStyle = g;
  targetCtx.fillRect(0, 0, w, h);
  const vg = targetCtx.createRadialGradient(w * 0.5, h * 0.38, Math.max(8, w * 0.06), w * 0.5, h * 0.52, Math.max(w, h) * 0.72);
  vg.addColorStop(0, `rgba(${tr},${tg},${tb},${focusOn ? 0.16 : 0.08})`);
  vg.addColorStop(1, "rgba(0,0,0,0.38)");
  targetCtx.fillStyle = vg;
  targetCtx.fillRect(0, 0, w, h);
}

export function renderStaticBackground() {
  const bgCtx = host.bgCtx;
  const bgCanvas = host.bgCanvas;
  const layer = bgCtx && bgCanvas ? bgCtx : null;
  if (!layer || !bgCanvas) {
    host.staticBgDirty = false;
    return;
  }
  const w = bgCanvas.width;
  const h = bgCanvas.height;
  const cellSize = host.cellSize;
  if (!w || !h || !cellSize) {
    host.staticBgDirty = true;
    return;
  }
  const focusOn = host.dadFocusActive();
  const [tr, tg, tb] = host.themeRgb();
  const size = cellSize;
  const COLS = host.COLS;
  const ROWS = host.ROWS;
  layer.clearRect(0, 0, w, h);
  drawNeonWell(layer, focusOn);

  const hasBoardBg = document.body.classList.contains("has-board-bg")
    || !!(document.getElementById("board-wrap") && document.getElementById("board-wrap").classList.contains("has-board-bg"));
  layer.save();
  layer.strokeStyle = hasBoardBg
    ? `rgba(${tr},${tg},${tb},${focusOn ? 0.14 : 0.07})`
    : (focusOn ? `rgba(${tr},${tg},${tb},0.38)` : `rgba(${tr},${tg},${tb},0.18)`);
  layer.lineWidth = 1;
  layer.beginPath();
  for (let c = 0; c <= COLS; c++) {
    layer.moveTo(c * size + 0.5, 0);
    layer.lineTo(c * size + 0.5, ROWS * size);
  }
  for (let r = 0; r <= ROWS; r++) {
    layer.moveTo(0, r * size + 0.5);
    layer.lineTo(COLS * size, r * size + 0.5);
  }
  layer.stroke();
  layer.restore();

  if (!hasBoardBg) {
  layer.save();
  layer.strokeStyle = `rgba(${tr},${tg},${tb},${focusOn ? 0.7 : 0.45})`;
  layer.lineWidth = Math.max(2, size / 18);
  layer.shadowColor = `rgba(${tr},${tg},${tb},0.7)`;
  layer.shadowBlur = 14;
  layer.strokeRect(1, 1, COLS * size - 2, ROWS * size - 2);
  layer.restore();
  }
  host.staticBgDirty = false;
}

export function drawFlashes(ctx) {
  const flashes = host.flashes;
  const COLS = host.COLS;
  const ROWS = host.ROWS;
  const cellSize = host.cellSize;
  for (const f of flashes) {
    const alpha = Math.max(0, f.life);
    if (f.dadSnap) {
      ctx.fillStyle = `rgba(255, 214, 80, ${alpha * 0.26})`;
      ctx.fillRect(0, 0, COLS * cellSize, ROWS * cellSize);
      continue;
    }
    if (f.tetris) {
      ctx.fillStyle = `rgba(46, 230, 255, ${alpha * 0.32})`;
      ctx.fillRect(0, 0, COLS * cellSize, ROWS * cellSize);
    }
    ctx.fillStyle = f.neon
      ? `rgba(154, 246, 255, ${alpha * 0.78})`
      : `rgba(255, 246, 232, ${alpha * 0.55})`;
    ctx.fillRect(0, f.y, COLS * cellSize, f.h);
  }
}

export function drawParticles(ctx) {
  const particles = host.particles;
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = Math.max(6, p.size * 1.4);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function renderSkinPreview(skinType) {
  const canvas = document.getElementById("skin-preview-canvas");
  if (!canvas || typeof canvas.getContext !== "function") {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const skin = clampBlockSkin(skinType == null ? currentSkin() : skinType);
  const cssW = 140;
  const cssH = 75;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "rgba(0, 12, 24, 0.96)";
  ctx.fillRect(0, 0, cssW, cssH);
  const well = ctx.createRadialGradient(cssW * 0.5, cssH * 0.42, 6, cssW * 0.5, cssH * 0.5, 58);
  well.addColorStop(0, "rgba(0, 240, 255, 0.14)");
  well.addColorStop(1, "rgba(0, 8, 18, 0.2)");
  ctx.fillStyle = well;
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.save();
  ctx.strokeStyle = "rgba(0, 240, 255, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 10; gx < cssW; gx += 10) {
    ctx.moveTo(gx + 0.5, 0);
    ctx.lineTo(gx + 0.5, cssH);
  }
  for (let gy = 10; gy < cssH; gy += 10) {
    ctx.moveTo(0, gy + 0.5);
    ctx.lineTo(cssW, gy + 0.5);
  }
  ctx.stroke();
  ctx.restore();

  const cells = (host.SHAPES.T && host.SHAPES.T[0]) || [[1, 0], [0, 1], [1, 1], [2, 1]];
  let minX = 4;
  let minY = 4;
  let maxX = 0;
  let maxY = 0;
  for (const [cx, cy] of cells) {
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);
  }
  const cols = Math.max(1, maxX - minX + 1);
  const rows = Math.max(1, maxY - minY + 1);
  const blockSize = Math.max(18, Math.floor(Math.min((cssW - 16) / cols, (cssH - 14) / rows)));
  const ox = Math.floor((cssW - cols * blockSize) / 2);
  const oy = Math.floor((cssH - rows * blockSize) / 2);
  const cyan = (host.COLORS && host.COLORS.I) || "#00E8E8";
  const purple = (host.COLORS && host.COLORS.T) || "#C44DFF";
  for (const [cx, cy] of cells) {
    const color = cy === minY ? cyan : purple;
    drawBlock(
      ctx,
      ox + (cx - minX) * blockSize,
      oy + (cy - minY) * blockSize,
      color,
      blockSize,
      skin,
      false
    );
  }
}

function renderGhostPreview(opacityValue, currentSkin) {
  const canvas = document.getElementById("ghost-preview-canvas");
  if (!canvas || typeof canvas.getContext !== "function") {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const css = 60;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const pixelW = Math.round(css * dpr);
  const pixelH = Math.round(css * dpr);
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(0, 0, css, css);
  ctx.fillStyle = "rgba(5, 12, 24, 0.96)";
  ctx.fillRect(0, 0, css, css);
  const well = ctx.createRadialGradient(css * 0.5, css * 0.4, 4, css * 0.5, css * 0.5, 34);
  well.addColorStop(0, "rgba(0, 240, 255, 0.12)");
  well.addColorStop(1, "rgba(0, 8, 18, 0.2)");
  ctx.fillStyle = well;
  ctx.fillRect(0, 0, css, css);

  const skin = host.currentPreviewSkin(currentSkin);
  const cells = (host.SHAPES.T && host.SHAPES.T[0]) || [[1, 0], [0, 1], [1, 1], [2, 1]];
  let minX = 4;
  let minY = 4;
  let maxX = 0;
  let maxY = 0;
  for (const [cx, cy] of cells) {
    minX = Math.min(minX, cx);
    minY = Math.min(minY, cy);
    maxX = Math.max(maxX, cx);
    maxY = Math.max(maxY, cy);
  }
  const cols = Math.max(1, maxX - minX + 1);
  const size = 12;
  const ox = Math.floor((css - cols * size) / 2);
  const cyan = (host.COLORS && host.COLORS.I) || "#00E8E8";
  const purple = (host.COLORS && host.COLORS.T) || "#C44DFF";
  const alpha = host.currentGhostOpacity(opacityValue);
  const drawPiece = (topY, isGhost) => {
    for (const [cx, cy] of cells) {
      const color = cy === minY ? cyan : purple;
      drawBlock(
        ctx,
        ox + (cx - minX) * size,
        topY + (cy - minY) * size,
        color,
        size,
        skin,
        isGhost
      );
    }
  };

  ctx.save();
  ctx.globalAlpha = 1;
  drawPiece(4, false);
  ctx.restore();

  const prevOverride = host.ghostPreviewAlphaOverride;
  const prevOuter = host.ghostPreviewUseOuterAlpha;
  host.ghostPreviewAlphaOverride = alpha;
  host.ghostPreviewUseOuterAlpha = true;
  try {
    ctx.save();
    ctx.globalAlpha = alpha;
    drawPiece(36, true);
    ctx.restore();
  } finally {
    host.ghostPreviewAlphaOverride = prevOverride;
    host.ghostPreviewUseOuterAlpha = prevOuter;
  }
}

export function triggerUltraJuice(kind) {
  const wrap = (host && host.boardWrap) || document.getElementById("board-wrap");
  if (host && typeof host.addShake === "function") {
    host.addShake(kind === "tetris" ? 48 : 36);
  }
  if (host && typeof host.triggerScreenShake === "function") {
    host.triggerScreenShake(true);
  }
  if (!wrap) {
    return;
  }
  wrap.classList.remove("is-ultra-flash", "is-tetris-flash", "is-triple-flash", "is-tspin-flash", "is-combo-flash");
  void wrap.offsetWidth;
  wrap.classList.add("is-ultra-flash");
  if (kind === "tetris") {
    wrap.classList.add("is-tetris-flash");
  } else if (kind === "tspin") {
    wrap.classList.add("is-tspin-flash");
  } else {
    wrap.classList.add("is-combo-flash");
  }
  window.clearTimeout(host.neonFlashTid);
  host.neonFlashTid = window.setTimeout(() => {
    wrap.classList.remove("is-ultra-flash", "is-tetris-flash", "is-triple-flash", "is-tspin-flash", "is-combo-flash");
  }, 150);
}

export function spawnShockwaveLine() {
  if (!host || (host.settings && host.settings.particles === false)) {
    return;
  }
  if (!host.flashes || !host.particles) {
    return;
  }
  const size = host.cellSize || 24;
  const rows = host.ROWS || 20;
  const cols = host.COLS || 10;
  const y = (rows - 0.12) * size;
  const colors = typeof host.themeParticleColors === "function"
    ? host.themeParticleColors()
    : ["#00f0ff", "#ffe66a", "#ffffff"];
  host.flashes.push({ y: (rows - 1) * size, h: size * 0.5, life: 0.78, neon: true, tetris: false });
  for (let c = 0; c < cols; c++) {
    for (let i = 0; i < 5; i++) {
      host.particles.push({
        x: (c + Math.random()) * size,
        y,
        vx: (Math.random() - 0.5) * 4.2,
        vy: -2.4 - Math.random() * 7.2,
        life: 0.82,
        decay: 0.018 + Math.random() * 0.02,
        size: 3 + Math.random() * 6,
        color: i % 2 ? colors[i % colors.length] : "#ffffff",
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
      });
    }
  }
}

export function isMobileViewport() {
  return typeof window !== "undefined" && (Number(window.innerWidth) || 0) <= 768;
}

export function mobileBoardCapPx() {
  if (typeof window === "undefined") {
    return 320;
  }
  const vh = Number((window.visualViewport && window.visualViewport.height) || window.innerHeight) || 640;
  const vw = Number((window.visualViewport && window.visualViewport.width) || window.innerWidth) || 360;
  const leftover = Math.max(80, Math.floor(vw - 110 - 10));
  const availW = Math.max(80, Math.min(Math.floor(vw * 0.65), leftover));
  return Math.max(120, Math.min(Math.floor(vh - 102), Math.floor(availW * 2)));
}

function applyMobileCanvasBox(wrap, stack, cssH, cssW, canvases) {
  const h = Math.max(8, cssH);
  if (wrap) {
    wrap.style.setProperty("width", "auto", "important");
    wrap.style.setProperty("min-width", "0px", "important");
    wrap.style.setProperty("max-width", "100%", "important");
    wrap.style.setProperty("height", "100%", "important");
    wrap.style.setProperty("min-height", "0px", "important");
    wrap.style.setProperty("max-height", "100%", "important");
    wrap.style.setProperty("aspect-ratio", "10 / 20", "important");
    wrap.style.setProperty("flex", "0 0 auto", "important");
  }
  if (stack) {
    stack.style.setProperty("height", "100%", "important");
    stack.style.setProperty("width", "100%", "important");
    stack.style.setProperty("max-height", "100%", "important");
    stack.style.setProperty("max-width", "100%", "important");
    stack.style.setProperty("aspect-ratio", "10 / 20", "important");
  }
  (canvases || []).forEach((cv) => {
    if (!cv) {
      return;
    }
    cv.style.width = "100%";
    cv.style.height = "100%";
    cv.style.maxHeight = "100%";
    cv.style.objectFit = "contain";
  });
  const mini = 36;
  ["next", "hold"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.style.width = `${mini}px`;
    el.style.height = `${mini}px`;
    el.style.maxWidth = `${mini}px`;
    el.style.maxHeight = `${mini}px`;
  });
  const guideRow = document.getElementById("block-guide-row");
  if (guideRow) {
    guideRow.style.setProperty("display", "flex", "important");
    guideRow.style.setProperty("flex-direction", "row", "important");
    guideRow.style.setProperty("justify-content", "space-between", "important");
    guideRow.style.setProperty("gap", "4px", "important");
  }
  ["next-card", "hold-card"].forEach((id) => {
    const card = document.getElementById(id);
    if (!card) {
      return;
    }
    card.style.setProperty("width", "auto", "important");
    card.style.setProperty("max-width", "none", "important");
    card.style.setProperty("min-width", "0px", "important");
    card.style.setProperty("height", "52px", "important");
    card.style.setProperty("max-height", "52px", "important");
    card.style.setProperty("aspect-ratio", "auto", "important");
    card.style.setProperty("flex", "1 1 0", "important");
  });
}

export function clearMobileCanvasLayout(wrap, stack, canvases) {
  const props = ["max-height", "min-height", "height", "width", "max-width", "aspect-ratio"];
  [wrap, stack].forEach((el) => {
    if (!el) {
      return;
    }
    props.forEach((prop) => {
      el.style.removeProperty(prop);
    });
  });
  (canvases || []).forEach((cv) => {
    if (!cv) {
      return;
    }
    cv.style.removeProperty("width");
    cv.style.removeProperty("height");
    cv.style.removeProperty("max-height");
    cv.style.removeProperty("object-fit");
  });
  ["next", "hold", "next-card", "hold-card", "block-guide-row"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    ["width", "height", "min-width", "max-width", "max-height", "flex", "aspect-ratio", "display", "flex-direction", "justify-content", "gap"].forEach((prop) => {
      el.style.removeProperty(prop);
    });
  });
}

export function resizeCanvasToViewport(opts) {
  const options = opts || {};
  const COLS = Math.max(1, Number(options.COLS || host.COLS) || 10);
  const ROWS = Math.max(1, Number(options.ROWS || host.ROWS) || 20);
  const wrap = options.wrap || document.getElementById("board-wrap");
  const stack = options.stack || document.getElementById("tetris-board-wrapper");
  const boardCanvas = options.boardCanvas || document.getElementById("tetris-canvas") || document.getElementById("tetris");
  const bgCanvas = options.bgCanvas || document.getElementById("bg-canvas");
  const mobile = isMobileViewport();
  if (!wrap || !boardCanvas) {
    return null;
  }
  const rect = wrap.getBoundingClientRect();
  let maxH = Math.floor(rect.height || wrap.clientHeight || 0);
  let maxW = Math.floor(rect.width || wrap.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 0) || 0);
  if (mobile) {
    const capH = mobileBoardCapPx();
    const capW = Math.max(8, Math.floor(capH * COLS / ROWS));
    if (!(maxH > 8)) {
      maxH = capH;
    }
    if (!(maxW > 8)) {
      maxW = capW;
    }
    maxH = Math.min(maxH, capH);
    maxW = Math.min(maxW, capW);
  }
  if (maxH < 8 || maxW < 8) {
    return null;
  }
  const minCell = Number(options.minCell) > 0 ? Number(options.minCell) : (mobile ? 8 : 24);
  let cellSize = Math.max(minCell, Math.min(Math.floor(maxH / ROWS), Math.floor(maxW / COLS)) || minCell);
  if (mobile) {
    cellSize = Math.min(cellSize, Math.max(8, Math.floor(mobileBoardCapPx() / ROWS)));
  }
  const cssW = COLS * cellSize;
  const cssH = ROWS * cellSize;
  if (mobile) {
    applyMobileCanvasBox(wrap, stack, cssH, cssW, [boardCanvas, bgCanvas]);
  } else {
    clearMobileCanvasLayout(wrap, stack, [boardCanvas, bgCanvas]);
  }
  let bufferChanged = false;
  if (boardCanvas.width !== cssW || boardCanvas.height !== cssH) {
    boardCanvas.width = cssW;
    boardCanvas.height = cssH;
    bufferChanged = true;
  }
  if (bgCanvas && (bgCanvas.width !== cssW || bgCanvas.height !== cssH)) {
    bgCanvas.width = cssW;
    bgCanvas.height = cssH;
    bufferChanged = true;
  }
  host.cellSize = cellSize;
  return { cssH, cssW, cellSize, bufferChanged, mobile };
}

export const renderEngine = {
  moduleId: "render",
  bind: bindRenderEngine,
  clampBlockSkin,
  drawBlock,
  fillBlock,
  renderStaticBackground,
  renderGhostPreview,
  renderSkinPreview,
  invalidateStaticBackground,
  applyBackgroundToCanvas,
  drawNeonWell,
  drawFlashes,
  drawParticles,
  triggerUltraJuice,
  spawnShockwaveLine,
  isMobileViewport,
  mobileBoardCapPx,
  resizeCanvasToViewport,
  clearMobileCanvasLayout,
};

export { drawBlock, fillBlock, renderSkinPreview, renderGhostPreview };
