// Prepare the Sketchfab "Honda PCX" GLB for the configurator.
//
// Source: https://sketchfab.com/3d-models/honda-pcx-cb4b2c153e204b88bd3848af1157eb47
// by DevanirGrau (https://sketchfab.com/devanirgrau), CC-BY-4.0 — credit
// required, commercial use allowed.
//
// Authored PBR model (Brazilian; Portuguese material names) with clean
// material separation (rainbow-debug verified). Paint zones are renames only:
//   Body           -> paint_body (all painted panels incl. front fender/tail)
//   plastic_marrom -> paint_trim (tan floorboard / tunnel / inner shield)
//   banco          -> paint_seat
// Wheel rims are fused into "preto_metalico" (61k tris of assorted black
// metallic hardware) and stay fixed. The Brazilian license plate and the
// floating logo card are deleted.
//
// Source is ~445k tris / 16 MB — weld + meshopt-simplify + quantize. Load
// with sanitizeMaterials: false (keeps the KHR transmission glass intact).
//
// Usage: node scripts/split-pcx.mjs <input.gltf|glb> <output.glb>
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, simplify, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const doc = await io.read(input);

const RENAMES = {
  "Body": "paint_body",
  "plastic_marrom": "paint_trim",
  "banco": "paint_seat",
};
const DELETE = new Set(["Placa-Mercosul-Moto.003", "logo"]);

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

let deleted = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    if (DELETE.has(prim.getMaterial()?.getName())) {
      mesh.removePrimitive(prim);
      prim.dispose();
      deleted++;
    }
  }
}
console.log(`deleted ${deleted} plate/logo primitives`);

const countTris = () =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0);

const before = countTris();
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.35, error: 0.001 }),
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune(),
  quantize()
);
console.log(`tris: ${Math.round(before)} -> ${Math.round(countTris())}`);

await io.write(output, doc);
console.log("wrote", output);
