// Report every mesh's world-space bbox and material — for scoping a new GLB.
// Usage: node scripts/report-meshes.mjs <input.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const [input] = process.argv.slice(2);
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(input);

const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
let meshCounter = 0;

const visit = (node) => {
  const mesh = node.getMesh();
  if (mesh) {
    const wm = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION");
      const idx = prim.getIndices();
      const tris = idx ? idx.getCount() / 3 : pos.getCount() / 3;
      const min = [1 / 0, 1 / 0, 1 / 0];
      const max = [-1 / 0, -1 / 0, -1 / 0];
      const el = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        const w = [
          wm[0] * el[0] + wm[4] * el[1] + wm[8] * el[2] + wm[12],
          wm[1] * el[0] + wm[5] * el[1] + wm[9] * el[2] + wm[13],
          wm[2] * el[0] + wm[6] * el[1] + wm[10] * el[2] + wm[14],
        ];
        for (let ax = 0; ax < 3; ax++) {
          if (w[ax] < min[ax]) min[ax] = w[ax];
          if (w[ax] > max[ax]) max[ax] = w[ax];
        }
      }
      const r = (v) => v.map((x) => +x.toFixed(2)).join(",");
      const c = min.map((m, ax) => +((m + max[ax]) / 2).toFixed(2));
      console.log(
        `mesh=${meshCounter} mat="${prim.getMaterial()?.getName()}" tris=${tris} center=[${c.join(",")}] min=[${r(min)}] max=[${r(max)}]`
      );
    }
    meshCounter++;
  }
  node.listChildren().forEach(visit);
};
scene.listChildren().forEach(visit);
