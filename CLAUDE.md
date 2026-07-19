# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (runs on http://localhost:3000, uses webpack bundler)
- **Build:** `npm run build`
- **Start production:** `npm start`
- **Lint:** `npm run lint` (ESLint 9 flat config with Next.js core-web-vitals + TypeScript rules)
- **Type check:** `npx tsc --noEmit`
- **Analyze a GLB's paintable islands:** `node scripts/analyze-adv150.mjs <input.glb>` (ADV-specific) or `node scripts/analyze-paint.mjs <input.glb> <materialName>` (any model, world coords)
- **List every mesh's bbox/material in a GLB:** `node scripts/report-meshes.mjs <input.glb>`
- **Identify paint zones visually:** `node scripts/rainbow-debug.mjs <in.glb> <out.glb> [topN]` — recolors the N biggest materials with distinct colors and prints the legend; view the output in the app
- **Split a source GLB into paint zones:** `node scripts/split-adv150.mjs`, `split-nmax.mjs` / `split-aerox.mjs` (fallback models), `split-nmax-v2.mjs` / `split-aerox-v2.mjs` / `split-pcx.mjs` (Sketchfab primaries; aerox-v2 and pcx also decimate via meshoptimizer) — `node scripts/split-<id>.mjs <source.gltf|glb> public/models/<id>.glb`. ADV only: `node scripts/split-adv150-accents.mjs public/models/honda-adv-150.glb` is a SECOND stage that runs on the processed GLB (after split-adv150.mjs + compress), splitting `paint_rims` out of `<auto>17` and `paint_center` out of `[Color M04]` by connected components in world coords — re-run it if the model is ever regenerated from source. PCX only: `node scripts/split-pcx-rims.mjs public/models/honda-pcx.glb` is the equivalent SECOND stage for the PCX (no geometry cut — retargets the two whole rim primitives onto cloned `paint_rims` / `paint_rims_rear` materials, with a bbox-roundness assert)
- **Meshopt-compress the shipped GLBs:** `node scripts/compress-models.mjs [file.glb ...]` (default: all of `public/models/`) — run after any split script; idempotent, lossless on top of `quantize()` (typically halves the file). drei's `useGLTF` wires the decoder automatically; the analysis scripts above read compressed files fine.

Note: on this machine the native SWC binary fails to load and Next falls back to WASM, so the first compile of each page is slow (up to ~1 min). Subsequent compiles are fast.

## Architecture

This is a Next.js 16 app using the App Router with TypeScript, React 19, and Tailwind CSS v4. It is a 3D motorcycle configurator ("Kustomoto"): users pick a part, then a color and a paint finish, rendered live with react-three-fiber.

- **App Router:** All routes live in `app/` — uses `layout.tsx` / `page.tsx` conventions
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`; theme tokens defined in `app/globals.css` using `@theme inline`. The UI implements the "Design B — Showroom" mockup: dark theme by default with a light theme under `html[data-theme="light"]` (toggled by `ThemeToggle`, persisted as `localStorage["kustomoto-theme"]`; a pre-hydration script in `app/layout.tsx` prevents flash, and `SceneCanvas` swaps canvas/pedestal colors to match)
- **Fonts:** Archivo (display/body, incl. italic) and Geist Mono loaded via `next/font/google`, exposed as CSS variables `--font-archivo` and `--font-geist-mono`
- **React Compiler:** Enabled in `next.config.ts` (`reactCompiler: true`) with `babel-plugin-react-compiler`
- **Path alias:** `@/*` maps to project root (configured in `tsconfig.json`)

### Configurator data flow

```
data/motorcycles/*.ts (MotorcycleConfig), registered in data/motorcycles/index.ts (MOTORCYCLES → picker chips)
  → stores/configurator-store.ts (zustand: partCustomizations, selectedPartId, theme, toast)
  → components/configurator/SceneCanvas.tsx (Canvas, lighting, OrbitControls, zoom overlay, theme-aware bg)
      → MotorcycleModel.tsx (GLB path; clicking a paintable panel selects its part)  or  models/* (procedural fallback)
  → components/configurator/Sidebar.tsx (part list / ColorPicker / FinishPicker / shop liveries / price summary)
```

- Types live in `types/configurator.ts`. Paint finishes (gloss/matte/metallic/satin/chrome/carbon → PBR values + per-part shop price) live in `lib/materials.ts`. Carbon is the only finish with `weave: true`: `applyCustomizationToMesh()` overlays a procedurally-generated tileable twill CanvasTexture (grayscale, tinted by the part color) as `map` + `bumpMap`, stashing any authored maps in `userData.preWeave*` so switching back to another finish restores them; meshes without UVs just get the PBR values.
- Layout ("Design B — Showroom", implemented July 2026): full-viewport canvas with a collapsible 350px right sidebar on desktop/tablet (`≥ md`, 768px); on mobile (`< md`) a header + bike-chip row on top and the panel as a bottom sheet that starts collapsed (tap the drag handle to expand/collapse). Bike picker chips sit top-center of the viewport on `≥ md`. Zoom in/out/reset overlay bottom-right, theme toggle bottom-left (desktop) / header (mobile). Viewports narrower than 1024px start the camera one zoom-step (×1.25) farther out (`initialCameraPosition()` in `SceneCanvas.tsx`).
- Each `MotorcycleConfig` may define `liveries` (curated per-part color/finish combos, tagged OEM/SHOP, applied via the store's `applyLivery`) and `modelCode` (viewport subtitle). The sidebar footer shows a per-part price breakdown and total from `FINISHES[...].price`.

## 3D model conventions

### Part mapping is by MATERIAL name, not mesh name

GLBs converted from SketchUp have unnamed/duplicate mesh names, so `PartConfig.materialNames` targets glTF **material** names instead. `applyCustomizationByMaterial()` in `lib/three-utils.ts` walks the scene and recolors every mesh whose material matches. Original names are stamped into `material.userData.originalName` (`preserveMaterialNames()`) so matching survives the clone-on-first-write that protects shared materials. `PartConfig.meshNames` also works, for models that do have named meshes.

Current ADV 150 mapping (`data/motorcycles/honda-adv-150.ts`):

| Part | Material names |
|---|---|
| Front Fairing | `paint_front`, `<auto>8` |
| Center Panels (gray mid panels between fairing and side panels) | `paint_center` |
| Side Panels (incl. rear cowl) | `paint_side`, `paint_rear` |
| Panel Accents | `<auto>17` |
| Wheel Rims | `paint_rims` |

`paint_center` and `paint_rims` are split from `[Color M04]` / `<auto>17` by `scripts/split-adv150-accents.mjs` (see Commands). The leftover `[Color M04]` (small trim bits near the rear wheel, left side) stays pinned gray via `materialOverrides` — keep that entry.

Yamaha NMAX (`data/motorcycles/yamaha-nmax.ts`): primary GLB is "Nmax Motorbike" by muhecsad from **Sketchfab** (uid `b4754cbe95fb4c39be1524300e93833b`, **CC-BY-NC-SA-4.0** — credit required, NO commercial use; credit text lives in the data file). It has properly-authored PBR materials, so the config sets `sanitizeMaterials: false` — the SketchUp fix-up pass would destroy them. Parts are cleanly material-separated (verified with `scripts/rainbow-debug.mjs`); `split-nmax-v2.mjs` only renames materials:

| Part | Material | What it covers |
|---|---|---|
| Body Panels | `paint_body` (was `Mesh_0111.rip`) | complete body kit |
| Wheel Rims | `paint_rims` + `paint_rims_rear` | front / rear rim |
| Seat | `Mesh_0093.rip` | saddle |

Gotcha: `paint_seat` (renamed from `Material.023` by split-nmax-v2.mjs on the assumption it was the saddle) is actually an engine-side cover — it is pinned dark via `materialOverrides`, and the Seat part targets the real saddle material `Mesh_0093.rip` instead.

The windscreen (`Material.002`) exports opaque white — fixed to smoked glass via `materialOverrides`. Fallback (`BUILTIN_MODELS["yamaha-nmax"]` → `NmaxClayModel`): the previous primary, an untextured clay GLB kept at `public/models/yamaha-nmax-clay.glb` (3D Warehouse `667367eb-f8aa-4620-a828-7f1903ec3d22` "Yamaha NMAX" by Ozkar O., processed by `split-nmax.mjs`). It shares the `paint_body` zone name on purpose, and its fixed parts (`BASE_*`/`STD_*`/`UNI_*` + `paint_front`/`paint_rear`) are colored by the same config's `materialOverrides` — keep those entries even though they don't match anything in the primary GLB.

Yamaha Aerox (`data/motorcycles/yamaha-aerox.ts`): primary GLB is "Yamaha Aerox Modified 155" by Pojan from **Sketchfab** (uid `2adc2d623c1b4dc79e048526bd8245c6`, **CC-BY-4.0** — commercial OK, credit text in the data file). A Thai/Indo-style modified build with authored PBR (clearcoat paint, emissive headlight + cyan LED strips) — config sets `sanitizeMaterials: false` and `modelYaw: Math.PI`. Source is 516k tris; `split-aerox-v2.mjs` renames the paint materials and decimates (weld + meshopt simplify ratio 0.35/err 0.001 + quantize → 231k tris, 4.9 MB):

| Part | Material | What it covers |
|---|---|---|
| Body Panels | `paint_body` (was `1bodiputi.001`) | painted panels: cowl, spine, bar cover |
| Red Accents | `paint_accent` (was `1merahgl`) | glossy red accent panels |
| Frame | `paint_frame` (was `chassis_vlo.0`) | exposed custom frame |
| Anodized Parts | `paint_ano` (was `titan`) | anodized bolts/brackets |

Wheels are tire+rim fused in one material (`1itemrf.001`) and stay fixed. Fallback (`BUILTIN_MODELS["yamaha-aerox"]` → `AeroxClassicModel`): the previous primary at `public/models/yamaha-aerox-classic.glb` (3D Warehouse `501a130f-ded6-48ec-82b4-c87e1cf6aa81` "Yamaha Aerox 155cc" by ItoRauf — a diorama whose props/photo-textures `split-aerox.mjs` removes; zones `paint_front`/`paint_cowl`/`paint_tail` + `wheel` are pinned via the config's `materialOverrides`, and `paint_body` is shared with the primary). The fallback needs NO yaw — only the primary needs `Math.PI`.

Honda PCX (`data/motorcycles/honda-pcx.ts`): primary GLB is "Honda PCX" by DevanirGrau from **Sketchfab** (uid `cb4b2c153e204b88bd3848af1157eb47`, **CC-BY-4.0** — commercial OK, credit text in the data file). Authored PBR with Portuguese material names and KHR transmission glass — `sanitizeMaterials: false`, no yaw needed. 464k tris; `split-pcx.mjs` renames the paint materials, deletes the Brazilian license plate + logo card, and decimates (→ 204k tris, 4.2 MB):

| Part | Material | What it covers |
|---|---|---|
| Body Panels | `paint_body` (was `Body`) | all painted panels incl. fender/tail |
| Trim Panels | `paint_trim` (was `plastic_marrom`) | tan floorboard / tunnel / inner shield |
| Seat | `paint_seat` (was `banco`) | saddle |
| Wheel Rims | `paint_rims` + `paint_rims_rear` | front / rear rim |

`paint_rims` / `paint_rims_rear` come from `scripts/split-pcx-rims.mjs`, a SECOND stage on the processed GLB (see Commands): the rims are whole primitives (nodes `Object_96` / `Object_208`) that shared the generic black-hardware materials `preto_metalico` / `preto_metalico_2`, so the script just retargets those two primitives onto cloned, renamed materials — the rest of `preto_metalico*` (fork, caliper, drum, brackets) stays fixed. NO fallback model: the only other free PCX (3D Warehouse `76768005-3dab-48b6-aa6e-1120f35e7fd6` by Arq. Vini Boschetti) is the *same mesh* with worse materials at 41 MB — a duplicate adds no resilience.

Non-customizable materials get fixed values via `MotorcycleConfig.materialOverrides` (name → color/roughness/metalness/opacity), applied on load.

### GLB loading pipeline (MotorcycleModel.tsx)

Any GLB is auto-normalized on load — do not hand-scale new models:

1. `normalizeScene()` — yaws length onto the X axis, scales to 1.95 m, rests it on y=0, centers it. Idempotent (guarded by `scene.userData.normalized`) because StrictMode double-runs memos. Set `MotorcycleConfig.modelYaw` (radians) if the bike faces the wrong way (ADV 150, NMAX and Aerox primaries need `Math.PI`; the PCX and the classic Aerox fallback need none).
2. `sanitizeGlbMaterials()` — SketchUp/SimLab exports use the removed `KHR_materials_pbrSpecularGlossiness` extension; three.js falls back to metallic 0.5 which renders washed-out chalk. This pass assigns sane PBR values by base-color heuristic.
3. `preserveMaterialNames()` — see above.
4. `applyMaterialOverrides()` + per-part customizations from the store.

If the GLB fails to load, `SceneCanvas` falls back to a procedural model looked up by motorcycle id in `components/configurator/models/index.ts` (`BUILTIN_MODELS`). The procedural ADV 150 (`models/Adv150Model.tsx`) is kept for exactly this purpose.

Loading performance (July 2026): all shipped GLBs are meshopt-compressed (`EXT_meshopt_compression`, see `scripts/compress-models.mjs`; drei's `useGLTF` supplies the decoder). `app/page.tsx` preloads the default bike's GLB from the initial HTML (`react-dom` `preload`, `crossOrigin: "anonymous"` to match three's fetch), `ConfiguratorPage` loads `SceneCanvas` via `next/dynamic` (`ssr: false`) so the three.js chunk downloads in parallel with the GLB instead of blocking the shell, `SceneCanvas` idle-prefetches the other bikes' GLBs once the current model is on screen, and `next.config.ts` sets a 1-day Cache-Control on `/models/*`.

### Split-script workflow (scripts/)

The ADV 150 source GLB has ALL red bodywork as one primitive (material `[Color A07]`). To make zones independently paintable:

1. `analyze-adv150.mjs` — welds the mesh and prints connected components (tri count, bbox, centroid). Use it to learn a new model's islands before deciding where to split. Raw ADV coords: +Y = front, +Z = up, ~84 units ≈ 1.95 m.
2. `split-adv150.mjs` — splits the red primitive into `paint_front` / `paint_side` / `paint_rear`:
   - Front separates by whole-triangle centroid test (y > 4) because a real gap exists there.
   - Side/rear is a **Sutherland–Hodgman clip** against the angled plane `y − 0.4z + 16 = 0`. Do NOT use whole-triangle classification across a continuous panel — the triangles are large and the seam looks torn.

Hard-won gotchas baked into the script — keep them if you modify it:

- `dedup()` must run with `{ propertyTypes: [PropertyType.ACCESSOR] }` only; default dedup merges the three intentionally-identical paint materials back into one.
- The `NodeIO` must register `KHRONOS_EXTENSIONS`, or `quantize()`'s `KHR_mesh_quantization` is silently dropped on write, producing a spec-invalid file.
- If using `gltf-transform optimize` (CLI) instead: pass `--palette false` — the palette step renames materials and breaks part mapping.

The 23 MB source GLB is not in the repo (only the processed 7.6 MB `public/models/honda-adv-150.glb`). Re-download it from the 3D Warehouse API if needed:
`https://3dwarehouse.sketchup.com/warehouse/v1.0/entities/0a866dba-0428-4f71-b852-1042a5935d89` → `binaries.glb.contentUrl`. Model: "HONDA ADV 150" by Arq. Vini Boschetti, 3D Warehouse General Model License (usable in projects; do not redistribute the raw model file).

## How to add a motorcycle

1. **Get a GLB.** Two free sources:
   - **SketchUp 3D Warehouse** — GLB renditions without login. Search API: `https://3dwarehouse.sketchup.com/warehouse/v1.0/entities?q=<query>&contentType=3dw&count=20` (browser `User-Agent`; check `binaryNames` includes `glb`), then `/warehouse/v1.0/entities/{id}` → `binaries.glb.contentUrl`. Prefer models with few meshes/materials and no photo textures.
   - **Sketchfab** — usually higher quality (authored PBR). Search API (no auth): `https://api.sketchfab.com/v3/search?type=models&q=<query>&downloadable=true`; check `license.label` (avoid view-only models; note NC licenses block commercial use) and `faceCount` (≤~200k). The download itself needs a logged-in user — ask the owner to download the glTF zip. For these models set `MotorcycleConfig.sanitizeMaterials: false` and record the required credit in the data file.
2. **Inspect it.** Run `report-meshes.mjs` (every mesh's bbox + material) and `analyze-paint.mjs` (connected components of a candidate paint material, world coords) to find which material is the paint and whether meshes are already spatial zones. Watch for diorama props (floors, walls, posters) that must be deleted. Drop the processed file in `public/models/<id>.glb`.
3. **If the paint is one big mesh,** copy/adapt `split-adv150.mjs`: analyze components first, split along real gaps with whole triangles, clip with a plane only where panels are fused.
4. **Create `data/motorcycles/<id>.ts`:** parts with `materialNames`, `materialOverrides` for the fixed materials (dark plastics / silver metal / glass), `modelYaw` if it faces backwards, color presets.
5. **Optimize:** quantize via the split script's transform chain (or `gltf-transform optimize --palette false --compress quantize`), then run `node scripts/compress-models.mjs public/models/<id>.glb` to meshopt-compress it. Target well under 5 MB compressed.
6. **Verify in the browser** (preview tools): default view faces +X, each part recolors independently, no washed-out gray materials, tires/seat read dark.
7. Optionally register a procedural fallback in `BUILTIN_MODELS` keyed by the motorcycle id.

Licensing note: motorcycle designs and names (Honda etc.) are manufacturer IP — fine for a demo/portfolio, needs review before commercial launch.
