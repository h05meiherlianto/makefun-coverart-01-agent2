// Fixed scenes for screenshots: ?shot=editor shows the editor with sample photos
// loaded; ?shot=cover shows the exported cover alone, full frame. Query params:
// layout, grade, size (square|portrait|wide), caption, subtitle, titlePos,
// titleColor, panelPhoto (comma list), panelX / panelY / panelZoom (comma
// lists, one per panel), selected (panel index to outline in the editor shot).
// window.__shotReady is set once the scene is painted.
import { LAYOUTS, GRADES, SIZES } from './cover.js';

// Presses the choice button whose label matches `name` inside `selector`.
export function pressChoice(selector, name) {
  document.querySelectorAll(selector).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.textContent === name));
  });
}

export async function runShot(shot, query, state, api) {
  const { loadSample, redraw, syncPanelControls } = api;
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('caption') !== null) state.title = query.get('caption');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('titlePos')) state.titlePos = query.get('titlePos');
  if (query.get('titleColor')) state.titleColor = query.get('titleColor');
  if (query.get('panelPhoto')) {
    const picks = query.get('panelPhoto').split(',').map(Number);
    picks.forEach((p, i) => { state.panelPhoto[i] = p; });
  }
  // Per-panel crop, one value per panel, so a shot can frame a photo the way
  // the editor would after a drag: values outside -1..1 (or 1..3 for zoom)
  // are clamped to the sliders' range.
  for (const [key, min, max] of [['panelX', -1, 1], ['panelY', -1, 1], ['panelZoom', 1, 3]]) {
    if (query.get(key)) {
      query.get(key).split(',').map(Number).forEach((v, i) => {
        if (Number.isFinite(v)) state[key][i] = Math.max(min, Math.min(max, v));
      });
    }
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  // A cover shot is the exported art: no panel selected, so no outline or
  // tag may leak into it. The editor shot can outline one panel instead,
  // showing the click-to-select state.
  if (shot === 'cover') {
    if (api.setSelected) api.setSelected(-1);
  } else if (query.get('selected') !== null && api.setSelected) {
    api.setSelected(Math.max(0, Number(query.get('selected')) || 0));
  }
  pressChoice('#layoutChoices button', LAYOUTS[state.layout].name);
  pressChoice('#gradeChoices button', GRADES[state.grade].name);
  pressChoice('#sizeChoices button', SIZES[state.size].name);
  const caption = document.getElementById('caption');
  const subtitle = document.getElementById('subtitle');
  if (caption) caption.value = state.title;
  if (subtitle) subtitle.value = state.subtitle;
  await Promise.all([
    document.fonts.load('40px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]).catch(() => {});
  await Promise.all([loadSample(0, 'boulevard'), loadSample(1, 'pier'), loadSample(2, 'neon')]);
  syncPanelControls();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
