// Prepare the Yamaha Aerox GLB (3D Warehouse, "Yamaha Aerox 155cc" by
// ItoRauf) for the configurator. The source file is a diorama: the bike plus
// a floor, checkered wall and Yamaha posters, and the whole bike — wheels
// included — shares one material ("Yamaha-Aerox-125-VVA-aka-NVX-125") whose
// look comes entirely from a projected product PHOTO, not real shading.
//
// This script (world coords: +X = rear... actually front at x≈-1.1, tail at
// x≈-3.0, +Y = up, Z = width):
//   1. deletes every mesh whose bbox pokes outside the bike volume (props)
//   2. re-materials the photo-textured meshes into paint zones by bbox
//      center + triangle count:
//        wheels (x≈-1.3 / x≈-2.7 rings)  -> "wheel" (fixed, dark)
//        big 6752-tri shell              -> paint_body
//        front fender / fork covers      -> paint_front
//        handlebar cowl pieces           -> paint_cowl
//        tail underpanel                 -> paint_tail
//   3. strips ALL textures (they are photos of other bikes / posters) and
//      gives the affected materials flat base colors instead
//
// Usage: node scripts/split-aerox.mjs <input.glb> <output.glb>
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize } from "@gltf-transform/functions";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const doc = await io.read(input);

const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];

// Generous world-space box around the bike; everything else is set dressing.
const BIKE = {
  min: [-3.15, -0.05, -2.05],
  max: [-0.85, 1.65, -0.8],
};

const PAINT_MAT = "Yamaha-Aerox-125-VVA-aka-NVX-125";

// (zone, colorHex) per photo-textured bike mesh, keyed by rough bbox center.
// Front wheel rings sit at x≈-1.32, rear at x≈-2.68, both with y-center ≈0.65
// and ≈4k tris; everything else is bodywork.
const paintZones = [];
const zoneMaterial = new Map(); // zone name -> Material

const worldBBox = (prim, wm) => {
  const pos = prim.getAttribute("POSITION");
  const el = [0, 0, 0];
  const min = [1 / 0, 1 / 0, 1 / 0];
  const max = [-1 / 0, -1 / 0, -1 / 0];
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
  return { min, max, center: min.map((m, ax) => (m + max[ax]) / 2) };
};

const zoneOf = (center, tris) => {
  const [cx, cy] = center;
  // Wheel/tire rings: big round meshes hugging the axle heights
  if (tris > 3000 && tris < 5000 && cy < 0.8) return "wheel";
  if (tris > 6000) return "paint_body";
  if (cx > -2.0 && cy > 1.2) return "paint_cowl"; // handlebar cowl / dash
  if (cx < -2.2) return "paint_tail"; // tail underpanel
  return "paint_front"; // front fender + fork covers
};

let removed = 0;
const toRemove = [];
const visit = (node) => {
  const mesh = node.getMesh();
  if (mesh) {
    const wm = node.getWorldMatrix();
    let outside = false;
    for (const prim of mesh.listPrimitives()) {
      const { min, max } = worldBBox(prim, wm);
      if (
        min.some((v, ax) => v < BIKE.min[ax] - 1e-3) ||
        max.some((v, ax) => v > BIKE.max[ax] + 1e-3)
      ) {
        outside = true;
      }
    }
    if (outside) {
      toRemove.push(node);
      removed++;
    } else {
      for (const prim of mesh.listPrimitives()) {
        const mat = prim.getMaterial();
        if (mat?.getName() !== PAINT_MAT) continue;
        const { center } = worldBBox(prim, wm);
        const idx = prim.getIndices();
        const tris = idx ? idx.getCount() / 3 : 0;
        const zone = zoneOf(center, tris);
        let zmat = zoneMaterial.get(zone);
        if (!zmat) {
          zmat = mat.clone().setName(zone);
          zoneMaterial.set(zone, zmat);
        }
        prim.setMaterial(zmat);
        paintZones.push({ zone, tris, center: center.map((x) => +x.toFixed(2)) });
      }
    }
  }
  [...node.listChildren()].forEach(visit);
};
[...scene.listChildren()].forEach(visit);

for (const node of toRemove) node.dispose();
console.log(`removed ${removed} prop meshes outside the bike volume`);
for (const z of paintZones) {
  console.log(`  ${z.zone}: ${z.tris} tris @ [${z.center.join(",")}]`);
}
const zones = [...zoneMaterial.keys()];
for (const want of ["wheel", "paint_body", "paint_front", "paint_cowl", "paint_tail"]) {
  if (!zones.includes(want)) throw new Error(`zone ${want} never matched`);
}

// Strip all textures; the photos carry no useful shading. Give the stripped
// materials flat colors approximating the real bike (red zones, dark hardware).
const FLAT_COLORS = {
  wheel: [0.08, 0.08, 0.09],
  paint_body: [0.62, 0.08, 0.12],
  paint_front: [0.62, 0.08, 0.12],
  paint_cowl: [0.62, 0.08, 0.12],
  paint_tail: [0.62, 0.08, 0.12],
  "ko copy": [0.28, 0.28, 0.3],
  "motor-yamaha-nmax": [0.16, 0.16, 0.18],
  "YAMAHA MIO SPORTY CW": [0.16, 0.16, 0.18],
  "inox copy1": [0.78, 0.79, 0.81],
};
for (const mat of doc.getRoot().listMaterials()) {
  const flat = FLAT_COLORS[mat.getName()];
  if (flat) mat.setBaseColorFactor([...flat, 1]);
  mat.setBaseColorTexture(null);
  const sg = mat.getExtension("KHR_materials_pbrSpecularGlossiness");
  if (sg) {
    if (flat) sg.setDiffuseFactor([...flat, 1]);
    sg.setDiffuseTexture(null);
    sg.setSpecularGlossinessTexture(null);
  }
}
for (const tex of doc.getRoot().listTextures()) tex.dispose();

await doc.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune(),
  quantize()
);
await io.write(output, doc);
console.log("wrote", output);
