import type { MotorcycleConfig } from "@/types/configurator";

/**
 * Primary GLB: "Yamaha Aerox Modified 155" by Pojan, processed by
 * scripts/split-aerox-v2.mjs. License: CC-BY-4.0 — commercial use allowed,
 * credit required. Required credit:
 *
 *   This work is based on "Yamaha Aerox Modified 155"
 *   (https://sketchfab.com/3d-models/yamaha-aerox-modified-155-2adc2d623c1b4dc79e048526bd8245c6)
 *   by Pojan (https://sketchfab.com/fauzanahnaf13) licensed under CC-BY-4.0
 *   (http://creativecommons.org/licenses/by/4.0/)
 *
 * Fallback GLB (registered in BUILTIN_MODELS): the previous primary, kept at
 * public/models/yamaha-aerox-classic.glb ("Yamaha Aerox 155cc" by ItoRauf, 3D
 * Warehouse, processed by scripts/split-aerox.mjs). The wheel / photo-texture
 * overrides and the paint_front / paint_cowl / paint_tail entries below only
 * exist in the fallback; paint_body is shared by both models.
 */
export const yamahaAerox: MotorcycleConfig = {
  id: "yamaha-aerox",
  name: "Yamaha Aerox",
  modelPath: "/models/yamaha-aerox.glb",
  // Authored PBR materials (incl. clearcoat paint) — skip the SketchUp fix-up
  sanitizeMaterials: false,
  modelYaw: Math.PI,
  materialOverrides: {
    // --- classic fallback GLB only (harmless no-ops for the primary model)
    "paint_front": { color: "#b02330", roughness: 0.25, metalness: 0.1 },
    "paint_cowl": { color: "#b02330", roughness: 0.25, metalness: 0.1 },
    "paint_tail": { color: "#b02330", roughness: 0.25, metalness: 0.1 },
    "wheel": { color: "#141417", roughness: 0.75, metalness: 0.25 },
    "motor-yamaha-nmax": { color: "#232327", roughness: 0.6, metalness: 0.5 },
    "YAMAHA MIO SPORTY CW": { color: "#232327", roughness: 0.6, metalness: 0.5 },
    "ko copy": { color: "#44464b", roughness: 0.45, metalness: 0.6 },
    "inox copy1": { color: "#c8cbd0", roughness: 0.28, metalness: 0.85 },
  },
  parts: [
    {
      id: "main-body",
      label: "Body Panels",
      meshNames: [],
      // paint_* materials are created by scripts/split-aerox-v2.mjs (primary)
      // and scripts/split-aerox.mjs (classic fallback)
      materialNames: ["paint_body"],
      defaultColor: "#2a5a68",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "accent-panels",
      label: "Red Accents",
      meshNames: [],
      materialNames: ["paint_accent"],
      defaultColor: "#7a1c10",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "frame",
      label: "Frame",
      meshNames: [],
      materialNames: ["paint_frame"],
      defaultColor: "#e8e8ea",
      defaultFinish: "satin",
      category: "accent",
    },
    {
      id: "anodized",
      label: "Anodized Parts",
      meshNames: [],
      materialNames: ["paint_ano"],
      defaultColor: "#8a3fd4",
      defaultFinish: "metallic",
      category: "accent",
    },
  ],
  colorPresets: [
    { id: "petrol-teal", name: "Petrol Teal", hex: "#2a5a68" },
    { id: "anodized-red", name: "Anodized Red", hex: "#b02330" },
    { id: "race-blue", name: "Race Blue", hex: "#1f3f8f" },
    { id: "matte-black", name: "Matte Black", hex: "#17171c" },
    { id: "pearl-white", name: "Pearl White", hex: "#f2f1ec" },
    { id: "cyber-yellow", name: "Cyber Yellow", hex: "#e0b400" },
    { id: "vivid-purple", name: "Vivid Purple", hex: "#8a3fd4" },
    { id: "silver-metallic", name: "Silver Metallic", hex: "#a8a9ad" },
  ],
};
