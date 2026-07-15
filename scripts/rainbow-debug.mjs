// Debug aid: recolor the N biggest materials of a GLB with distinct vivid
// colors (and print the legend) so paint zones can be identified visually in
// the app. Not part of the production pipeline.
// Usage: node scripts/rainbow-debug.mjs <input.glb> <output.glb> [topN]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const [input, output, topNArg] = process.argv.slice(2);
const topN = Number(topNArg) || 16;
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "meshopt.decoder": MeshoptDecoder,
  "meshopt.encoder": MeshoptEncoder,
});
const doc = await io.read(input);

// Distinct, saturated, easy-to-name colors
const PALETTE = [
  ["red", [1, 0, 0]],
  ["green", [0, 0.8, 0]],
  ["blue", [0, 0.2, 1]],
  ["yellow", [1, 0.9, 0]],
  ["magenta", [1, 0, 1]],
  ["cyan", [0, 0.9, 0.9]],
  ["orange", [1, 0.5, 0]],
  ["purple", [0.5, 0, 0.8]],
  ["lime", [0.6, 1, 0]],
  ["pink", [1, 0.55, 0.7]],
  ["teal", [0, 0.5, 0.5]],
  ["brown", [0.55, 0.3, 0.1]],
  ["navy", [0, 0, 0.45]],
  ["olive", [0.5, 0.5, 0]],
  ["maroon", [0.55, 0, 0.1]],
  ["skyblue", [0.4, 0.75, 1]],
];

const triCount = new Map();
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial();
    if (!mat) continue;
    const idx = prim.getIndices();
    const tris = idx ? idx.getCount() / 3 : 0;
    triCount.set(mat, (triCount.get(mat) || 0) + tris);
  }
}

const ranked = [...triCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
ranked.forEach(([mat, tris], i) => {
  const [name, rgb] = PALETTE[i % PALETTE.length];
  mat.setBaseColorFactor([...rgb, 1]);
  mat.setBaseColorTexture(null);
  mat.setMetallicFactor(0.1);
  mat.setRoughnessFactor(0.6);
  console.log(`${name.padEnd(8)} -> "${mat.getName()}" (${Math.round(tris)} tris)`);
});

await io.write(output, doc);
console.log("wrote", output);
