// Neon Coast Cover Studio — wires the editor: photos, panels, layout, grade,
// caption and export. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js).
import { LAYOUTS, GRADES, SIZES, defaultState, drawCover, renderCover, panelAt } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
const photos = [null, null, null];
let selectedPanel = 0;

// Loads an image from a URL, resolving once it can be drawn.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Loads one of the bundled sample photos into a slot (they are free to use).
export async function loadSample(slot, name) {
  photos[slot] = await loadImage(`samples/${name}.jpg`);
  redraw();
}

function sizeOfCanvas() {
  const size = SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
}

function redraw() {
  sizeOfCanvas();
  drawCover(canvas, photos, state);
}

// Choice-button group: one pressed button per group, wired to a state key.
function buildChoices(el, entries, key, onPick) {
  for (const [id, def] of Object.entries(entries)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    b.setAttribute('aria-pressed', String(state[key] === id));
    b.addEventListener('click', () => {
      state[key] = id;
      el.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      if (onPick) onPick();
      redraw();
    });
    el.appendChild(b);
  }
}

buildChoices(document.getElementById('layoutChoices'), LAYOUTS, 'layout', () => {
  selectedPanel = 0;
  syncPanelControls();
});
buildChoices(document.getElementById('gradeChoices'), GRADES, 'grade');
buildChoices(document.getElementById('sizeChoices'), SIZES, 'size');

// Panel controls -------------------------------------------------------------
const panelPhoto = document.getElementById('panelPhoto');
const panelZoom = document.getElementById('panelZoom');
const panelX = document.getElementById('panelX');
const panelY = document.getElementById('panelY');

function syncPanelControls() {
  const layout = LAYOUTS[state.layout];
  document.getElementById('panelName').textContent = `Panel ${selectedPanel + 1} of ${layout.panels.length}`;
  panelPhoto.value = String(state.panelPhoto[selectedPanel] ?? 0);
  panelZoom.value = String(state.panelZoom[selectedPanel] ?? 1);
  panelX.value = String(state.panelX[selectedPanel] ?? 0);
  panelY.value = String(state.panelY[selectedPanel] ?? 0);
  document.getElementById('zoomVal').textContent = `${Number(panelZoom.value).toFixed(2)}×`;
  document.getElementById('xVal').textContent = panelX.value;
  document.getElementById('yVal').textContent = panelY.value;
}

panelPhoto.addEventListener('change', () => {
  state.panelPhoto[selectedPanel] = Number(panelPhoto.value);
  redraw();
});
panelZoom.addEventListener('input', () => {
  state.panelZoom[selectedPanel] = Number(panelZoom.value);
  document.getElementById('zoomVal').textContent = `${Number(panelZoom.value).toFixed(2)}×`;
  redraw();
});
panelX.addEventListener('input', () => {
  state.panelX[selectedPanel] = Number(panelX.value);
  document.getElementById('xVal').textContent = panelX.value;
  redraw();
});
panelY.addEventListener('input', () => {
  state.panelY[selectedPanel] = Number(panelY.value);
  document.getElementById('yVal').textContent = panelY.value;
  redraw();
});

// Click a panel in the live preview to select it for cropping.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(state, x, y, canvas.width, canvas.height);
  if (hit >= 0) {
    selectedPanel = hit;
    syncPanelControls();
  }
});

// Photo uploads --------------------------------------------------------------
for (const [slot, id] of [[0, 'photoA'], [1, 'photoB'], [2, 'photoC']]) {
  document.getElementById(id).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    photos[slot] = await loadImage(URL.createObjectURL(file));
    status.textContent = `Photo ${'ABC'[slot]} loaded — ${file.name}`;
    redraw();
  });
}
document.getElementById('samples').addEventListener('click', async () => {
  await Promise.all([loadSample(0, 'boulevard'), loadSample(1, 'pier'), loadSample(2, 'neon')]);
  status.textContent = 'Sample photos loaded into A, B and C.';
});

// Caption and effects --------------------------------------------------------
const caption = document.getElementById('caption');
const subtitle = document.getElementById('subtitle');
caption.addEventListener('input', () => { state.title = caption.value; redraw(); });
subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
document.getElementById('titlePos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
document.getElementById('titleColor').addEventListener('change', (e) => { state.titleColor = e.target.value; redraw(); });
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleSize = Number(e.target.value);
  document.getElementById('sizeVal').textContent = `${Math.round(state.titleSize * 100)}%`;
  redraw();
});
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('frame').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); });

// Export ---------------------------------------------------------------------
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  const out = renderCover(photos, state, size.w, size.h);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-cover-${size.w}x${size.h}.png`;
    window.__exported = true;
  }, 'image/png');
});

// Boot -----------------------------------------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, { loadImage, loadSample, redraw, syncPanelControls, setSelected: (i) => { selectedPanel = i; } });
} else {
  // Fonts must be ready before the first paint, or the title falls back to sans.
  Promise.all([
    document.fonts.load('40px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]).catch(() => {}).finally(async () => {
    await Promise.all([loadSample(0, 'boulevard'), loadSample(1, 'pier'), loadSample(2, 'neon')]);
    syncPanelControls();
    redraw();
    window.__shotReady = true;
  });
}
