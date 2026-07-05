// Prepare the Yamaha NMAX GLB (3D Warehouse, "Yamaha NMAX" by Ozkar O.) for
// the configurator. The model is an untextured clay export where all painted
// bodywork shares one material, "BASE_NMAX1", across three separate meshes
// that happen to be spatial groups (world coords, +X = rear, +Y = up):
//   - x ≈ [-0.33, 0.80]  front fairing + front fender
//   - x ≈ [-0.11, 2.08]  main body shell
//   - x ≈ [ 0.99, 2.34]  lower rear / under-seat panels
// No triangle splitting is needed — each mesh just gets its own clone of the
// paint material named paint_front / paint_body / paint_rear so the app can
// recolor the zones independently (part mapping is by material name).
//
// Usage: node scripts/split-nmax.mjs <input.glb> <output.glb>
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize } from "@gltf-transform/functions";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const doc = await io.read(input);

const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];

// Classify a BASE_NMAX1 mesh by its world-space bbox center along X.
const zoneOf = (cx) => {
  if (cx < 0.9) return "paint_front";
  if (cx < 1.4) return "paint_body";
  return "paint_rear";
};

let renamed = 0;
const visit = (node) => {
  const mesh = node.getMesh();
  if (mesh) {
    const wm = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      if (mat?.getName() !== "BASE_NMAX1") continue;
      const pos = prim.getAttribute("POSITION");
      const el = [0, 0, 0];
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        const wx = wm[0] * el[0] + wm[4] * el[1] + wm[8] * el[2] + wm[12];
        if (wx < minX) minX = wx;
        if (wx > maxX) maxX = wx;
      }
      const zone = zoneOf((minX + maxX) / 2);
      prim.setMaterial(mat.clone().setName(zone));
      renamed++;
      console.log(`mesh center x=${((minX + maxX) / 2).toFixed(2)} -> ${zone}`);
    }
  }
  node.listChildren().forEach(visit);
};
scene.listChildren().forEach(visit);

if (renamed !== 3) {
  throw new Error(`expected 3 BASE_NMAX1 meshes, renamed ${renamed}`);
}

// Dedup accessors only — the paint materials are intentionally identical
// apart from their names and must stay separate.
await doc.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune(),
  quantize()
);
await io.write(output, doc);
console.log("wrote", output);
