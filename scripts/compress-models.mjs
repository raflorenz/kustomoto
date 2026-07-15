// Meshopt-compress GLBs in place (EXT_meshopt_compression, level "medium").
//
//   node scripts/compress-models.mjs [file.glb ...]   (default: public/models/*.glb)
//
// This is a pure storage-layer compression on top of the quantization the
// split scripts already applied: level "medium" re-runs quantize() with the
// same defaults (a numeric no-op on already-quantized attributes) and then
// entropy-codes the buffer views, so the decoded geometry is bit-identical
// and materials/textures are untouched. Typical GLB shrinks 2-4x.
//
// The client needs no changes: drei's useGLTF wires three-stdlib's
// MeshoptDecoder into GLTFLoader by default.
//
// Gotchas:
// - Register ALL_EXTENSIONS (not KHRONOS_EXTENSIONS): EXT_meshopt_compression
//   is a multi-vendor extension. Any script that reads a compressed GLB also
//   needs the meshopt.decoder dependency registered (see report-meshes.mjs).
// - No dedup/prune/palette here — material names are the part mapping and
//   must survive byte-for-byte.
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const MODELS_DIR = resolve("public/models");

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => resolve(f))
  : readdirSync(MODELS_DIR)
      .filter((f) => f.endsWith(".glb"))
      .map((f) => resolve(MODELS_DIR, f));

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`skip (missing): ${file}`);
    continue;
  }
  const before = statSync(file).size;
  const doc = await io.read(file);

  const materialsBefore = doc
    .getRoot()
    .listMaterials()
    .map((m) => m.getName())
    .sort()
    .join("|");

  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));

  const materialsAfter = doc
    .getRoot()
    .listMaterials()
    .map((m) => m.getName())
    .sort()
    .join("|");
  if (materialsBefore !== materialsAfter) {
    throw new Error(
      `material names changed in ${file} — part mapping would break:\n` +
        `  before: ${materialsBefore}\n  after:  ${materialsAfter}`
    );
  }

  await io.write(file, doc);
  const after = statSync(file).size;
  console.log(
    `${file.split(/[\\/]/).pop()}: ${(before / 1e6).toFixed(2)} MB -> ` +
      `${(after / 1e6).toFixed(2)} MB (${((1 - after / before) * 100).toFixed(0)}% smaller)`
  );
}
