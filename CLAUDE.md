# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (runs on http://localhost:3000, uses webpack bundler)
- **Build:** `npm run build`
- **Start production:** `npm start`
- **Lint:** `npm run lint` (ESLint 9 flat config with Next.js core-web-vitals + TypeScript rules)
- **Type check:** `npx tsc --noEmit`
- **Analyze a GLB's paintable islands:** `node scripts/analyze-adv150.mjs <input.glb>`
- **Split the ADV 150 body mesh:** `node scripts/split-adv150.mjs <source.glb> public/models/honda-adv-150.glb`

Note: on this machine the native SWC binary fails to load and Next falls back to WASM, so the first compile of each page is slow (up to ~1 min). Subsequent compiles are fast.

## Architecture

This is a Next.js 16 app using the App Router with TypeScript, React 19, and Tailwind CSS v4. It is a 3D motorcycle configurator ("LetsCustomize"): users pick a part, then a color and a paint finish, rendered live with react-three-fiber.

- **App Router:** All routes live in `app/` — uses `layout.tsx` / `page.tsx` conventions
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`; theme tokens defined in `app/globals.css` using `@theme inline`
- **Fonts:** Geist and Geist Mono loaded via `next/font/google`, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`
- **React Compiler:** Enabled in `next.config.ts` (`reactCompiler: true`) with `babel-plugin-react-compiler`
- **Path alias:** `@/*` maps to project root (configured in `tsconfig.json`)

### Configurator data flow

```
data/motorcycles/*.ts (MotorcycleConfig)
  → stores/configurator-store.ts (zustand: partCustomizations, selectedPartId)
  → components/configurator/SceneCanvas.tsx (Canvas, lighting, OrbitControls, zoom overlay)
      → MotorcycleModel.tsx (GLB path)  or  models/* (procedural fallback)
  → components/configurator/ControlPanel.tsx (part chips / ColorPicker / FinishPicker, BELOW the canvas)
```

- Types live in `types/configurator.ts`. Paint finishes (gloss/matte/metallic/satin/chrome → PBR values) live in `lib/materials.ts`.
- Layout requirement from the owner: model centered in the viewport, controls below it, zoom in/out available.

## 3D model conventions

### Part mapping is by MATERIAL name, not mesh name

GLBs converted from SketchUp have unnamed/duplicate mesh names, so `PartConfig.materialNames` targets glTF **material** names instead. `applyCustomizationByMaterial()` in `lib/three-utils.ts` walks the scene and recolors every mesh whose material matches. Original names are stamped into `material.userData.originalName` (`preserveMaterialNames()`) so matching survives the clone-on-first-write that protects shared materials. `PartConfig.meshNames` also works, for models that do have named meshes.

Current ADV 150 mapping (`data/motorcycles/honda-adv-150.ts`):

| Part | Material names |
|---|---|
| Front Fairing | `paint_front`, `<auto>8` |
| Side Panels | `paint_side` |
| Rear Cowl | `paint_rear` |
| Panel Accents (incl. rims) | `<auto>17` |

Non-customizable materials get fixed values via `MotorcycleConfig.materialOverrides` (name → color/roughness/metalness/opacity), applied on load.

### GLB loading pipeline (MotorcycleModel.tsx)

Any GLB is auto-normalized on load — do not hand-scale new models:

1. `normalizeScene()` — yaws length onto the X axis, scales to 1.95 m, rests it on y=0, centers it. Idempotent (guarded by `scene.userData.normalized`) because StrictMode double-runs memos. Set `MotorcycleConfig.modelYaw` (radians) if the bike faces the wrong way (ADV 150 needs `Math.PI`).
2. `sanitizeGlbMaterials()` — SketchUp/SimLab exports use the removed `KHR_materials_pbrSpecularGlossiness` extension; three.js falls back to metallic 0.5 which renders washed-out chalk. This pass assigns sane PBR values by base-color heuristic.
3. `preserveMaterialNames()` — see above.
4. `applyMaterialOverrides()` + per-part customizations from the store.

If the GLB fails to load, `SceneCanvas` falls back to a procedural model looked up by motorcycle id in `components/configurator/models/index.ts` (`BUILTIN_MODELS`). The procedural ADV 150 (`models/Adv150Model.tsx`) is kept for exactly this purpose.

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

1. **Get a GLB.** SketchUp 3D Warehouse serves free GLB renditions without login: search the site, take the model id from the URL, hit `/warehouse/v1.0/entities/{id}` and download `binaries.glb.contentUrl`. Prefer models with few meshes/materials and no photo textures.
2. **Inspect it.** Parse the JSON chunk (see the node one-liners in git history, or run `analyze-adv150.mjs`) to list materials, mesh sizes, and which material is the paint. Drop the file in `public/models/<id>.glb`.
3. **If the paint is one big mesh,** copy/adapt `split-adv150.mjs`: analyze components first, split along real gaps with whole triangles, clip with a plane only where panels are fused.
4. **Create `data/motorcycles/<id>.ts`:** parts with `materialNames`, `materialOverrides` for the fixed materials (dark plastics / silver metal / glass), `modelYaw` if it faces backwards, color presets.
5. **Optimize:** quantize via the split script's transform chain (or `gltf-transform optimize --palette false --compress quantize`). Target well under 10 MB.
6. **Verify in the browser** (preview tools): default view faces +X, each part recolors independently, no washed-out gray materials, tires/seat read dark.
7. Optionally register a procedural fallback in `BUILTIN_MODELS` keyed by the motorcycle id.

Licensing note: motorcycle designs and names (Honda etc.) are manufacturer IP — fine for a demo/portfolio, needs review before commercial launch.
