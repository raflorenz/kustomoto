export type HexColor = `#${string}`;

export interface ColorPreset {
  id: string;
  name: string;
  hex: HexColor;
}

export type PartCategory = "fairing" | "body" | "accent" | "mechanical";

export type FinishId =
  | "gloss"
  | "matte"
  | "metallic"
  | "satin"
  | "chrome"
  | "carbon";

export interface FinishPreset {
  id: FinishId;
  name: string;
  description: string;
  /** Shop price per painted part, USD */
  price: number;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  /** Overlay the woven carbon-fiber texture, tinted by the part color */
  weave?: boolean;
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

export interface LiveryZone {
  color: HexColor;
  finish: FinishId;
}

export interface LiveryPreset {
  id: string;
  name: string;
  /** Small badge shown next to the livery name (e.g. "OEM", "SHOP") */
  tag: string;
  /** Per-part paint, keyed by part id — should cover every part */
  zones: Record<string, LiveryZone>;
}

export interface MotorcycleConfig {
  id: string;
  name: string;
  /** Short model code shown under the name in the viewport (e.g. "ADV 150") */
  modelCode?: string;
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
  /** Curated color/finish combos offered by the shop */
  liveries?: LiveryPreset[];
}

export interface PartCustomization {
  partId: string;
  color: HexColor;
  finish: FinishId;
}
