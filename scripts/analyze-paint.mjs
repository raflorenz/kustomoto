// Generic paint-material component analyzer with world transforms.
// Usage: node analyze-generic.mjs <input.glb> <materialName>
import { NodeIO } from "@gltf-transform/core";
import { weld } from "@gltf-transform/functions";

const [input, matName] = process.argv.slice(2);
const io = new NodeIO();
const doc = await io.read(input);
await doc.transform(weld());

const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
console.log("=====", input, "| material:", matName, "=====");
let meshCounter = 0;

const visit = (node) => {
  const mesh = node.getMesh();
  if (mesh) {
    const wm = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMaterial()?.getName() !== matName) {
        continue;
      }
      const pos = prim.getAttribute("POSITION");
      const idx = prim.getIndices().getArray();
      const n = pos.getCount();
      const parent = new Uint32Array(n);
      for (let i = 0; i < n; i++) parent[i] = i;
      const find = (a) => {
        while (parent[a] !== a) {
          parent[a] = parent[parent[a]];
          a = parent[a];
        }
        return a;
      };
      for (let t = 0; t < idx.length; t += 3) {
        const ra = find(idx[t]);
        parent[find(idx[t + 1])] = ra;
        parent[find(idx[t + 2])] = ra;
      }
      const comps = new Map();
      const el = [0, 0, 0];
      const xf = ([x, y, z]) => [
        wm[0] * x + wm[4] * y + wm[8] * z + wm[12],
        wm[1] * x + wm[5] * y + wm[9] * z + wm[13],
        wm[2] * x + wm[6] * y + wm[10] * z + wm[14],
      ];
      for (let t = 0; t < idx.length; t += 3) {
        const root = find(idx[t]);
        let c = comps.get(root);
        if (!c) {
          c = { tris: 0, min: [1 / 0, 1 / 0, 1 / 0], max: [-1 / 0, -1 / 0, -1 / 0] };
          comps.set(root, c);
        }
        c.tris++;
        for (let k = 0; k < 3; k++) {
          pos.getElement(idx[t + k], el);
          const w = xf(el);
          for (let ax = 0; ax < 3; ax++) {
            if (w[ax] < c.min[ax]) c.min[ax] = w[ax];
            if (w[ax] > c.max[ax]) c.max[ax] = w[ax];
          }
        }
      }
      const list = [...comps.values()].sort((a, b) => b.tris - a.tris);
      const r = (v) => v.map((x) => +x.toFixed(1)).join(",");
      console.log(
        ` meshIndex=${meshCounter} node="${node.getName()}" | ${idx.length / 3} tris, ${list.length} components`
      );
      list.slice(0, 15).forEach((c, i) => {
        const cx = c.min.map((m, ax) => +((m + c.max[ax]) / 2).toFixed(1));
        console.log(
          `   #${i} tris=${c.tris} center=[${cx.join(",")}] min=[${r(c.min)}] max=[${r(c.max)}]`
        );
      });
      if (list.length > 15) console.log(`   ...${list.length - 15} more`);
    }
    meshCounter++;
  }
  node.listChildren().forEach(visit);
};
scene.listChildren().forEach(visit);
