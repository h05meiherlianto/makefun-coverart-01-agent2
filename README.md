# makefun-coverart-01-agent2
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/h05meiherlianto/makefun-coverart-01-agent2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/h05meiherlianto/makefun-coverart-01-agent2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Coast Cover Studio** — an offline web app that turns your photos and a caption into multi-panel GTA-style poster cover art, exported as a PNG to share.

- **Multi-panel poster layouts** — Vice Grid (hero + three), Diagonal strips, Stack, Trio and Full Bleed with a tilted snapshot inset. Click any panel in the live preview to select it.
- **Any photo** — upload up to three photos from your machine (A, B, C) or load the bundled samples; fill several panels with one photo or several, and crop/position each panel with zoom and pan sliders — or just drag the photo inside the preview. The pan sliders travel the photo's whole overflow, so a portrait photo in a wide panel can still show the face. A Reset crop button returns the selected panel to zoom 1, centred.
- **Selected panel, visible** — click any panel in the live preview and it gets a pink dashed outline with a PANEL n tag; the panel controls and the drag target follow it. Exported covers never carry the outline.
- **Caption you can edit** — title, script subtitle, position (top / centre / bottom), size and lettering (sunset, neon or white gradient) in bundled Anton + Pacifico fonts (SIL Open Font License).
- **Vice City grades** — Sunset, Neon Night, Golden Hour, Teal Dusk and Dusk Mono, plus film grain, vignette and a white poster frame.
- **Fast** — photo to PNG in a few clicks, in the common post sizes 1080×1080, 1080×1350 and 1920×1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Everything runs offline in the browser: no network requests, photos never leave your machine.

## How it works

`app/index.html` + `app/src/main.js` wire the editor; `app/src/cover.js` is the cover engine (layouts, grades, lettering, grain) drawing on a 2D canvas; `app/src/shots.js` sets up fixed scenes for screenshots. Export renders the cover at full post size on an offscreen canvas and downloads it as a PNG. `main.ts` (Node 22, stdlib only) copies `app/` and `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-app.ts`.

Original art and lettering throughout — no Rockstar Games logo, artwork or font. Sample photos are the kit's bundled AI-made samples plus one procedural sunset scene made for this entry. Polish pass: drag-to-pan in the preview, a visible selected-panel outline, full-overflow pan range, and a per-panel crop reset.

<sub>Entered on [make.fun](https://make.fun/?ref=rdxqc0yh&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
