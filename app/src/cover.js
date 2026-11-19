// Neon Coast Cover Studio — the cover engine.
// Draws a multi-panel GTA-poster-style cover on a 2D canvas: diagonal / stacked
// panels, a Vice City sunset or neon grade, bold Anton lettering with a Pacifico
// script subtitle, grain and vignette. All art is original; no Rockstar assets.

// Five poster layouts. Each panel is a fraction of the cover: x, y, w, h, plus an
// optional diagonal slant (top edge shifted right) and an optional tilt in degrees
// for the inset snapshot of the full-bleed layout.
export const LAYOUTS = {
  viceGrid: {
    name: 'Vice Grid',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6, slant: 0 },
      { x: 0, y: 0.6, w: 1 / 3, h: 0.4, slant: 0 },
      { x: 1 / 3, y: 0.6, w: 1 / 3, h: 0.4, slant: 0 },
      { x: 2 / 3, y: 0.6, w: 1 / 3, h: 0.4, slant: 0 },
    ],
  },
  diagonal: {
    name: 'Diagonal',
    panels: [
      { x: 0, y: 0, w: 0.38, h: 1, slant: 0.1 },
      { x: 0.34, y: 0, w: 0.36, h: 1, slant: 0.1 },
      { x: 0.66, y: 0, w: 0.38, h: 1, slant: 0.1 },
    ],
  },
  stack: {
    name: 'Stack',
    panels: [
      { x: 0, y: 0, w: 0.56, h: 1, slant: 0 },
      { x: 0.56, y: 0, w: 0.44, h: 0.5, slant: 0 },
      { x: 0.56, y: 0.5, w: 0.44, h: 0.5, slant: 0 },
    ],
  },
  trio: {
    name: 'Trio',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1, slant: 0.05 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1, slant: 0.05 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1, slant: 0.05 },
    ],
  },
  fullBleed: {
    name: 'Full Bleed',
    panels: [
      { x: 0, y: 0, w: 1, h: 1, slant: 0 },
      { x: 0.6, y: 0.47, w: 0.36, h: 0.26, slant: 0, tilt: -4 },
    ],
  },
};

// Five colour grades: a canvas filter for the photo plus overlay gradients.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.3) contrast(1.1) brightness(1.02)',
    overlays: [
      { stops: [[0, 'rgba(255,140,60,0)'], [1, 'rgba(255,60,40,0.38)']], mode: 'overlay' },
      { stops: [[0, 'rgba(160,20,120,0)'], [1, 'rgba(160,20,120,0.3)']], mode: 'soft-light' },
    ],
  },
  neon: {
    name: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.14) brightness(0.98)',
    overlays: [
      { stops: [[0, 'rgba(255,40,160,0.34)'], [0.55, 'rgba(120,40,200,0.12)'], [1, 'rgba(0,220,255,0.3)']], mode: 'overlay' },
      { stops: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,0,40,0.35)']], mode: 'multiply' },
    ],
  },
  golden: {
    name: 'Golden Hour',
    filter: 'saturate(1.25) contrast(1.06) sepia(0.28) brightness(1.04)',
    overlays: [
      { stops: [[0, 'rgba(255,190,80,0.22)'], [1, 'rgba(200,90,20,0.3)']], mode: 'overlay' },
    ],
  },
  teal: {
    name: 'Teal Dusk',
    filter: 'saturate(1.2) contrast(1.1) hue-rotate(12deg) brightness(0.97)',
    overlays: [
      { stops: [[0, 'rgba(0,200,190,0.26)'], [1, 'rgba(20,10,90,0.4)']], mode: 'overlay' },
    ],
  },
  dusk: {
    name: 'Dusk Mono',
    filter: 'saturate(0.25) contrast(1.18) brightness(0.95)',
    overlays: [
      { stops: [[0, 'rgba(120,60,180,0.28)'], [1, 'rgba(255,90,120,0.22)']], mode: 'overlay' },
    ],
  },
};

export const SIZES = {
  square: { name: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { name: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { name: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

// A fresh default state: samples in every slot, hero panel on photo A.
// The hero panel's photo is panned down (panelY 0.85) so the sample's face,
// which sits in the top third of a portrait photo, lands inside the wide
// hero panel instead of being cropped away by the cover fit.
export function defaultState() {
  return {
    layout: 'viceGrid',
    grade: 'sunset',
    size: 'wide',
    title: 'NEON SHORE',
    subtitle: 'one last summer in Vice City',
    titlePos: 'bottom',
    titleSize: 1,
    titleColor: 'sunset',
    grain: true,
    frame: true,
    panelPhoto: [0, 1, 2, 0],
    panelZoom: [1, 1, 1, 1],
    panelX: [0, 0, 0, 0],
    panelY: [0.85, 0, 0, 0],
  };
}

// Deterministic pseudo-random generator, so the grain is identical every render.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The polygon of one panel in pixels, with a white gutter cut out of each edge.
export function panelPolygon(panel, w, h, gutter) {
  const x = panel.x * w + gutter;
  const y = panel.y * h + gutter;
  const pw = panel.w * w - gutter * 2;
  const ph = panel.h * h - gutter * 2;
  const s = (panel.slant || 0) * w;
  return [
    [x + s, y],
    [x + pw + s, y],
    [x + pw, y + ph],
    [x, y + ph],
  ];
}

// Draws one photo into one panel: cover-fit, zoomed and panned, then graded.
// The pan sliders move the photo across its whole overflow (the part cover-fit
// crops away), so at either end the photo's edge reaches the panel's edge —
// with a portrait photo in a wide panel that is the difference between a
// headless torso and a face in frame.
export function drawPanelPhoto(ctx, photo, panel, w, h, grade, zoom, ox, oy) {
  const poly = panelPolygon(panel, w, h, Math.max(3, w * 0.004));
  ctx.save();
  ctx.beginPath();
  poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.clip();
  const bx = panel.x * w;
  const by = panel.y * h;
  const bw = panel.w * w;
  const bh = panel.h * h;
  if (photo) {
    const base = Math.max(bw / photo.naturalWidth, bh / photo.naturalHeight);
    const scale = base * (zoom || 1);
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    // Pan across the overflow, not a fixed slice of the panel: at ox/oy = ±1
    // the photo's edge meets the panel's edge, whatever the zoom.
    const maxOX = Math.max(0, (pw - bw) / 2);
    const maxOY = Math.max(0, (ph - bh) / 2);
    ctx.filter = grade.filter;
    ctx.drawImage(photo, bx + (bw - pw) / 2 + (ox || 0) * maxOX, by + (bh - ph) / 2 + (oy || 0) * maxOY, pw, ph);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#3a2049';
    ctx.fillRect(bx, by, bw, bh);
  }
  for (const over of grade.overlays) {
    const g = ctx.createLinearGradient(bx, by, bx + bw * 0.4, by + bh);
    for (const [stop, color] of over.stops) g.addColorStop(stop, color);
    ctx.globalCompositeOperation = over.mode;
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  // White poster gutter around the panel.
  ctx.save();
  ctx.beginPath();
  poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.stroke();
  ctx.restore();
}

// Fits a title to one line, shrinking until it fits inside maxWidth.
export function fitTitleFont(ctx, text, size, maxWidth) {
  let s = size;
  ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && s > 12) {
    s -= 2;
    ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`;
  }
  return s;
}

// The title block: a dark band with white rules, gradient Anton capitals and a
// neon Pacifico subtitle underneath.
export function drawTitleBlock(ctx, state, w, h) {
  const title = state.title.trim().toUpperCase();
  const sub = state.subtitle.trim();
  if (!title && !sub) return;
  const bandH = h * (sub ? 0.2 : 0.15);
  let bandY;
  if (state.titlePos === 'top') bandY = h * 0.03;
  else if (state.titlePos === 'center') bandY = (h - bandH) / 2;
  else bandY = h - bandH - h * 0.03;
  ctx.save();
  ctx.fillStyle = 'rgba(12,4,24,0.72)';
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, bandY, w, Math.max(2, h * 0.004));
  ctx.fillRect(0, bandY + bandH - Math.max(2, h * 0.004), w, Math.max(2, h * 0.004));
  if (title) {
    const size = fitTitleFont(ctx, title, h * 0.11 * state.titleSize, w * 0.92);
    const grad = ctx.createLinearGradient(0, bandY, 0, bandY + size);
    if (state.titleColor === 'neon') {
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.55, '#ff7ad9'); grad.addColorStop(1, '#37e6ff');
    } else if (state.titleColor === 'white') {
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#ffe9c9');
    } else {
      grad.addColorStop(0, '#fff7d6'); grad.addColorStop(0.5, '#ffb347'); grad.addColorStop(1, '#ff2e88');
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.strokeStyle = 'rgba(20,2,30,0.85)';
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.03;
    const ty = bandY + bandH * (sub ? 0.36 : 0.5);
    ctx.strokeText(title, w / 2, ty);
    ctx.fillText(title, w / 2, ty);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }
  if (sub) {
    const ss = Math.max(14, h * 0.032 * state.titleSize);
    ctx.font = `${ss}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff8fd1';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = ss * 0.5;
    ctx.fillText(sub, w / 2, bandY + bandH * 0.82);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// Small poster furniture: a "NEON COAST" pill and five stars. They sit at the
// top unless the title band is there, in which case they move to the bottom.
export function drawBadge(ctx, w, h, atTop = true) {
  const pad = w * 0.02;
  const fs = Math.max(11, w * 0.016);
  const y = atTop ? pad : h - pad - fs * 2.1;
  ctx.save();
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  const label = 'NEON COAST · 2026';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(12,4,24,0.75)';
  ctx.beginPath();
  ctx.roundRect(pad, y, tw + pad * 1.6, fs * 2.1, fs);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, pad * 1.8, y + fs * 1.05);
  ctx.font = `${fs * 1.3}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffd34d';
  ctx.strokeStyle = 'rgba(20,2,30,0.8)';
  ctx.lineWidth = 2;
  ctx.textAlign = 'right';
  const stars = '★★★★★';
  ctx.strokeText(stars, w - pad, y + fs * 1.05);
  ctx.fillText(stars, w - pad, y + fs * 1.05);
  ctx.restore();
}

// Film grain (seeded, so identical every render) plus a soft vignette.
export function drawGrainVignette(ctx, w, h) {
  const rand = mulberry32(20261119);
  const dots = Math.floor((w * h) / 1100);
  ctx.save();
  for (let i = 0; i < dots; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// A bright dashed outline plus a "PANEL n" tag around the panel the editor
// has selected, so a click (or a drag) in the preview answers visibly. The
// export path never passes a selection, so exported covers stay clean.
export function drawSelectedOutline(ctx, panel, w, h, label) {
  const poly = panelPolygon(panel, w, h, Math.max(3, w * 0.004));
  ctx.save();
  ctx.beginPath();
  poly.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.closePath();
  ctx.setLineDash([Math.max(8, w * 0.014), Math.max(6, w * 0.008)]);
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(3, w * 0.005);
  ctx.stroke();
  ctx.setLineDash([]);
  const fs = Math.max(15, w * 0.016);
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  const tw = ctx.measureText(label).width;
  // Bottom-left of the panel: the top-left is where the NEON COAST badge
  // sits, so a tag there would collide with it.
  const tx = poly[3][0] + Math.max(4, w * 0.006);
  const ty = poly[3][1] - fs * 1.9 - Math.max(4, h * 0.008);
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw + fs, fs * 1.9, fs * 0.5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, tx + fs / 2, ty + fs * 0.98);
  ctx.restore();
}

// Draws the whole cover onto `canvas` at its own size. `photos` is an array of
// images (or nulls); state picks a photo per panel. `selected` is the panel
// the editor has selected (-1 for none, and always -1 on export).
export function drawCover(canvas, photos, state, selected = -1) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const layout = LAYOUTS[state.layout] || LAYOUTS.viceGrid;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);
  layout.panels.forEach((panel, i) => {
    const photo = photos[state.panelPhoto[i] ?? 0] || null;
    if (panel.tilt) {
      ctx.save();
      const cx = (panel.x + panel.w / 2) * w;
      const cy = (panel.y + panel.h / 2) * h;
      ctx.translate(cx, cy);
      ctx.rotate((panel.tilt * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(panel.x * w - 6, panel.y * h - 6, panel.w * w + 12, panel.h * h + 12);
      drawPanelPhoto(ctx, photo, panel, w, h, grade, state.panelZoom[i] || 1, state.panelX[i] || 0, state.panelY[i] || 0);
      ctx.restore();
    } else {
      drawPanelPhoto(ctx, photo, panel, w, h, grade, state.panelZoom[i] || 1, state.panelX[i] || 0, state.panelY[i] || 0);
    }
  });
  drawTitleBlock(ctx, state, w, h);
  drawBadge(ctx, w, h, state.titlePos !== 'top');
  // The selection outline goes on last (before grain/frame), over the title
  // band, so its PANEL n tag is never half-hidden behind the band.
  if (selected >= 0 && selected < layout.panels.length) {
    const panel = layout.panels[selected];
    if (panel.tilt) {
      ctx.save();
      const cx = (panel.x + panel.w / 2) * w;
      const cy = (panel.y + panel.h / 2) * h;
      ctx.translate(cx, cy);
      ctx.rotate((panel.tilt * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      drawSelectedOutline(ctx, panel, w, h, `PANEL ${selected + 1}`);
      ctx.restore();
    } else {
      drawSelectedOutline(ctx, panel, w, h, `PANEL ${selected + 1}`);
    }
  }
  if (state.grain) drawGrainVignette(ctx, w, h);
  if (state.frame) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, w * 0.008);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  }
}

// Renders the cover at export size on a fresh canvas and returns it.
export function renderCover(photos, state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, photos, state);
  return canvas;
}

// Which panel (index) contains point (x, y) in cover coordinates, or -1.
export function panelAt(state, x, y, w, h) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.viceGrid;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (x >= p.x * w && x <= (p.x + p.w) * w && y >= p.y * h && y <= (p.y + p.h) * h) return i;
  }
  return -1;
}
