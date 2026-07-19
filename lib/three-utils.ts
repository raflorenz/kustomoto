import * as THREE from "three";
import { FINISHES } from "@/lib/materials";
import type {
  FinishId,
  HexColor,
  MaterialOverride,
} from "@/types/configurator";

let carbonWeaveTexture: THREE.Texture | null = null;

/**
 * Lazily build a tileable 2/2-twill carbon weave as a grayscale canvas
 * texture — grayscale so material.color tints it (black carbon, colored
 * weave, etc.). Shared by every part that uses the carbon finish.
 */
function getCarbonWeaveTexture(): THREE.Texture | null {
  if (carbonWeaveTexture) return carbonWeaveTexture;
  if (typeof document === "undefined") return null;

  const cells = 16;
  const cell = 16;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = cells * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      const x = i * cell;
      const y = j * cell;
      // 2/2 twill: tow orientation alternates in offset pairs, which is
      // what produces the diagonal banding carbon is known for
      const horizontal = (i + j) % 4 < 2;
      const grad = horizontal
        ? ctx.createLinearGradient(x, y, x, y + cell)
        : ctx.createLinearGradient(x, y, x + cell, y);
      // Perpendicular tows catch light differently; keep the two
      // orientations at distinct brightness so the weave reads at a glance
      const [edge, mid] = horizontal
        ? ["#55595d", "#d9dde0"]
        : ["#37393c", "#9b9fa3"];
      grad.addColorStop(0, edge);
      grad.addColorStop(0.5, mid);
      grad.addColorStop(1, edge);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, cell, cell);

      // Fine striations along each tow's fiber direction
      ctx.strokeStyle = "rgba(0,0,0,0.16)";
      ctx.lineWidth = 1;
      for (let s = 2; s < cell; s += 4) {
        ctx.beginPath();
        if (horizontal) {
          ctx.moveTo(x, y + s + 0.5);
          ctx.lineTo(x + cell, y + s + 0.5);
        } else {
          ctx.moveTo(x + s + 0.5, y);
          ctx.lineTo(x + s + 0.5, y + cell);
        }
        ctx.stroke();
      }
    }
  }

  carbonWeaveTexture = new THREE.CanvasTexture(canvas);
  carbonWeaveTexture.wrapS = THREE.RepeatWrapping;
  carbonWeaveTexture.wrapT = THREE.RepeatWrapping;
  carbonWeaveTexture.repeat.set(4, 4);
  carbonWeaveTexture.colorSpace = THREE.SRGBColorSpace;
  carbonWeaveTexture.anisotropy = 8;
  return carbonWeaveTexture;
}

/**
 * SketchUp-derived GLBs ship their paint meshes without UVs, so a texture
 * map has nothing to sample. Box-project UVs from world-scaled positions
 * (dominant normal axis picks the plane); density is tuned so one weave
 * tow lands around 5 mm on the real-size bike regardless of model units.
 */
function ensureWeaveUvs(mesh: THREE.Mesh): boolean {
  const geometry = mesh.geometry as THREE.BufferGeometry | undefined;
  const position = geometry?.attributes?.position;
  if (!geometry || !position) return false;
  if (geometry.attributes.uv) return true;

  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const normal = geometry.attributes.normal;
  const scale = mesh.getWorldScale(new THREE.Vector3());
  const density = 3.1; // texture tiles per meter (× texture.repeat)

  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) * scale.x;
    const y = position.getY(i) * scale.y;
    const z = position.getZ(i) * scale.z;
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    let u: number;
    let v: number;
    if (nx >= ny && nx >= nz) {
      u = y;
      v = z;
    } else if (ny >= nx && ny >= nz) {
      u = x;
      v = z;
    } else {
      u = x;
      v = y;
    }
    uv[i * 2] = u * density;
    uv[i * 2 + 1] = v * density;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return true;
}

export function buildMeshMap(
  scene: THREE.Group | THREE.Object3D
): Map<string, THREE.Mesh> {
  const map = new Map<string, THREE.Mesh>();
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      map.set(child.name, child as THREE.Mesh);
    }
  });
  return map;
}

export function applyCustomizationToMesh(
  mesh: THREE.Mesh,
  color: HexColor,
  finishId: FinishId
): void {
  if (!mesh.material) return;

  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];

  for (let i = 0; i < materials.length; i++) {
    let mat = materials[i];

    // Clone on first write to avoid mutating shared GLB materials
    if (!mesh.userData.materialCloned) {
      mat = mat.clone();
      if (Array.isArray(mesh.material)) {
        mesh.material[i] = mat;
      } else {
        mesh.material = mat;
      }
    }

    const finish = FINISHES[finishId];
    const std = mat as THREE.MeshStandardMaterial;
    if ("color" in std) std.color.set(color);
    if ("roughness" in std) std.roughness = finish.roughness;
    if ("metalness" in std) std.metalness = finish.metalness;
    const phys = mat as THREE.MeshPhysicalMaterial;
    if ("clearcoat" in phys) {
      phys.clearcoat = finish.clearcoat;
      phys.clearcoatRoughness = finish.clearcoatRoughness;
    }

    if ("map" in std) {
      if (finish.weave && ensureWeaveUvs(mesh)) {
        // Stash any authored maps so other finishes can restore them
        if (std.userData.preWeaveMap === undefined) {
          std.userData.preWeaveMap = std.map;
          std.userData.preWeaveBumpMap = std.bumpMap;
        }
        const weave = getCarbonWeaveTexture();
        if (std.map !== weave) {
          std.map = weave;
          std.bumpMap = weave;
          std.bumpScale = 0.35;
          std.needsUpdate = true;
        }
      } else if (std.userData.preWeaveMap !== undefined) {
        std.map = std.userData.preWeaveMap;
        std.bumpMap = std.userData.preWeaveBumpMap;
        delete std.userData.preWeaveMap;
        delete std.userData.preWeaveBumpMap;
        std.needsUpdate = true;
      }
    }
  }

  mesh.userData.materialCloned = true;
}

export function applyCustomizationToPart(
  meshMap: Map<string, THREE.Mesh>,
  meshNames: string[],
  color: HexColor,
  finish: FinishId
): void {
  for (const name of meshNames) {
    const mesh = meshMap.get(name);
    if (mesh) {
      applyCustomizationToMesh(mesh, color, finish);
    }
  }
}

/** Apply a customization to every mesh whose material name matches. */
export function applyCustomizationByMaterial(
  scene: THREE.Object3D,
  materialNames: string[],
  color: HexColor,
  finish: FinishId
): void {
  const wanted = new Set(materialNames);
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    // Match on the original material name, preserved across clones
    if (
      materials.some(
        (m) => wanted.has(m.userData.originalName ?? m.name)
      )
    ) {
      applyCustomizationToMesh(mesh, color, finish);
    }
  });
}

/**
 * Fix up materials from GLB exporters that rely on unsupported extensions
 * (e.g. SketchUp/SimLab spec-gloss): assign sensible dielectric/metal values
 * based on base color so parts don't render as washed-out half-metal.
 */
export function sanitizeGlbMaterials(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of materials) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!("metalness" in std) || std.userData.sanitized) continue;
      std.userData.sanitized = true;

      const { r, g, b } = std.color;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const isGrayscale =
        Math.abs(r - g) < 0.06 && Math.abs(g - b) < 0.06;

      if (std.transparent || std.opacity < 1) {
        // Glass (windscreen, lenses)
        std.roughness = 0.05;
        std.metalness = 0;
        std.opacity = Math.min(std.opacity, 0.35);
      } else if (isGrayscale && luminance > 0.62) {
        // Bright gray → polished metal (exhaust, fork, trim)
        std.metalness = 0.85;
        std.roughness = 0.3;
      } else if (luminance < 0.2) {
        // Dark → rubber / plastic / engine
        std.metalness = 0.05;
        std.roughness = 0.85;
      } else {
        // Everything else → painted or plastic surface
        std.metalness = 0.1;
        std.roughness = 0.55;
      }
      std.needsUpdate = true;
    }
  });
}

/** Apply fixed per-material overrides from the motorcycle config. */
export function applyMaterialOverrides(
  scene: THREE.Object3D,
  overrides: Record<string, MaterialOverride>
): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of materials) {
      const std = mat as THREE.MeshStandardMaterial;
      const override =
        overrides[std.userData.originalName ?? std.name];
      if (!override) continue;
      if (override.color !== undefined) std.color.set(override.color);
      if (override.roughness !== undefined) std.roughness = override.roughness;
      if (override.metalness !== undefined) std.metalness = override.metalness;
      if (override.opacity !== undefined) {
        std.transparent = override.opacity < 1;
        std.opacity = override.opacity;
      }
      std.needsUpdate = true;
    }
  });
}

/** Stamp original material names so matching survives material cloning. */
export function preserveMaterialNames(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const m of materials) {
      if (m.userData.originalName === undefined) {
        m.userData.originalName = m.name;
      }
    }
  });
}

export function logSceneMeshNames(
  scene: THREE.Group | THREE.Object3D
): void {
  console.group("Scene mesh names:");
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      console.log(`  Mesh: "${child.name}" (parent: "${child.parent?.name}")`);
    }
  });
  console.groupEnd();
}
