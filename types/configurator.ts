export type HexColor = `#${string}`;

export interface ColorPreset {
  id: string;
  name: string;
  hex: HexColor;
}

export type PartCategory = "fairing" | "body" | "accent" | "mechanical";

export type FinishId = "gloss" | "matte" | "metallic" | "satin" | "chrome";

export interface FinishPreset {
  id: FinishId;
  name: string;
  description: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export interface PartConfig {
  id: string;
  label: string;
  /** Mesh names to target when the model is a GLB file */
  meshNames: string[];
  /** Material names to target in a GLB (used when meshes are unnamed) */
  materialNames?: string[];
  defaultColor: HexColor;
  defaultFinish: FinishId;
  category: PartCategory;
}

export interface MaterialOverride {
  color?: HexColor;
  roughness?: number;
  metalness?: number;
  opacity?: number;
}

export interface MotorcycleConfig {
  id: string;
  name: string;
  /** Path to a GLB file — used when the model ships as an asset */
  modelPath?: string;
  /** Extra yaw (radians) applied after normalization so the bike faces +X */
  modelYaw?: number;
  /** Key into the built-in procedural model registry */
  builtinModel?: string;
  /**
   * Set false for GLBs with properly-authored PBR materials —
   * sanitizeGlbMaterials() is a fix-up for broken SketchUp exports and would
   * overwrite good metalness/roughness values. Default true.
   */
  sanitizeMaterials?: boolean;
  /** Fixed (non-customizable) material fixes, keyed by GLB material name */
  materialOverrides?: Record<string, MaterialOverride>;
  parts: PartConfig[];
  colorPresets: ColorPreset[];
}

export interface PartCustomization {
  partId: string;
  color: HexColor;
  finish: FinishId;
}
