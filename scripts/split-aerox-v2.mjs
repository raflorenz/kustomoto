// Prepare the Sketchfab "Yamaha Aerox Modified 155" GLB for the configurator.
//
// Source: https://sketchfab.com/3d-models/yamaha-aerox-modified-155-2adc2d623c1b4dc79e048526bd8245c6
// by Pojan (https://sketchfab.com/fauzanahnaf13), CC-BY-4.0 — credit
// required, commercial use allowed.
//
// A Thai/Indo-style modified build with authored PBR materials (clearcoat on
// the paint) and material-level part separation (rainbow-debug verified,
// Indonesian names: bodi = body, merah = red, mika = lens). Paint zones are
// renames only:
//   1bodiputi.001 -> paint_body   (painted panels: cowl, spine, bar cover)
//   1merahgl      -> paint_accent (glossy red accent panels)
//   chassis_vlo.0 -> paint_frame  (exposed custom frame)
//   titan         -> paint_ano    (anodized hardware: bolts, brackets)
// Wheels are tire+rim fused in one material (1itemrf.001) and stay fixed.
//
// The source is 516k tris / 21 MB, far too heavy for the web — weld +
// meshopt-simplify + quantize brings it down. Load with
// sanitizeMaterials: false.
//
// Usage: node scripts/split-aerox-v2.mjs <input.gltf|glb> <output.glb>
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, simplify, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const doc = await io.read(input);

const RENAMES = {
  "1bodiputi.001": "paint_body",
  "1merahgl": "paint_accent",
  "chassis_vlo.0": "paint_frame",
  "titan": "paint_ano",
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

const before = doc
  .getRoot()
  .listMeshes()
  .flatMap((m) => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);

await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.35, error: 0.001 }),
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune(),
  quantize()
);

const after = doc
  .getRoot()
  .listMeshes()
  .flatMap((m) => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);
console.log(`tris: ${Math.round(before)} -> ${Math.round(after)}`);

await io.write(output, doc);
console.log("wrote", output);
