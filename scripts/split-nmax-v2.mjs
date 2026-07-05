// Prepare the Sketchfab Yamaha NMAX GLB for the configurator.
//
// Source: "Nmax Motorbike" (https://sketchfab.com/3d-models/nmax-motorbike-b4754cbe95fb4c39be1524300e93833b)
// by muhecsad (https://sketchfab.com/muhecsad), CC-BY-NC-SA-4.0 — credit
// required, no commercial use, share-alike.
//
// Unlike the SketchUp models, this one has properly-authored PBR materials
// and clean material-level part separation (rainbow-debug verified), so the
// whole job is renaming four materials to the app's paint-zone names:
//   Mesh_0111.rip                    -> paint_body  (complete body kit)
//   Mesh_0047.rip / Mesh_0092.rip.001 -> paint_rims (front / rear wheel rim)
//   Material.023                     -> paint_seat
// `paint_body` matches the clay fallback GLB's zone name on purpose, so the
// Body Panels part recolors both the primary and the fallback model.
// IMPORTANT: the app must load this GLB with sanitizeMaterials: false, or the
// SketchUp-export heuristic overwrites the authored metal/rough values.
//
// Usage: node scripts/split-nmax-v2.mjs <input.gltf|glb> <output.glb>
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize } from "@gltf-transform/functions";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const doc = await io.read(input);

const RENAMES = {
  "Mesh_0111.rip": "paint_body",
  "Mesh_0047.rip": "paint_rims",
  "Mesh_0092.rip.001": "paint_rims_rear", // separate material, same part
  "Material.023": "paint_seat",
};

const done = new Set();
for (const mat of doc.getRoot().listMaterials()) {
  const to = RENAMES[mat.getName()];
  if (to) {
    done.add(mat.getName());
    mat.setName(to);
  }
}
const missing = Object.keys(RENAMES).filter((k) => !done.has(k));
if (missing.length) throw new Error(`materials not found: ${missing.join(", ")}`);

// Dedup must not merge materials (paint zones stay distinct) — accessors only.
await doc.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune(),
  quantize()
);
await io.write(output, doc);
console.log("wrote", output);
