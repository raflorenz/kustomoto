import type { MotorcycleConfig } from "@/types/configurator";

/**
 * Primary GLB: "Honda PCX" by DevanirGrau, processed by
 * scripts/split-pcx.mjs. License: CC-BY-4.0 — commercial use allowed, credit
 * required. Required credit:
 *
 *   This work is based on "Honda PCX"
 *   (https://sketchfab.com/3d-models/honda-pcx-cb4b2c153e204b88bd3848af1157eb47)
 *   by DevanirGrau (https://sketchfab.com/devanirgrau) licensed under
 *   CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
 */
export const hondaPcx: MotorcycleConfig = {
  id: "honda-pcx",
  name: "Honda PCX",
  modelPath: "/models/honda-pcx.glb",
  // Authored PBR materials (incl. transmission glass) — skip the SketchUp fix-up
  sanitizeMaterials: false,
  parts: [
    {
      id: "main-body",
      label: "Body Panels",
      meshNames: [],
      // paint_* materials are created by scripts/split-pcx.mjs
      materialNames: ["paint_body"],
      defaultColor: "#1b2a52",
      defaultFinish: "metallic",
      category: "fairing",
    },
    {
      // Tan floorboard / tunnel / inner leg shield
      id: "trim-panels",
      label: "Trim Panels",
      meshNames: [],
      materialNames: ["paint_trim"],
      defaultColor: "#7d6a52",
      defaultFinish: "satin",
      category: "fairing",
    },
    {
      id: "seat",
      label: "Seat",
      meshNames: [],
      materialNames: ["paint_seat"],
      defaultColor: "#7a6549",
      defaultFinish: "matte",
      category: "accent",
    },
  ],
  colorPresets: [
    { id: "deep-navy", name: "Deep Navy", hex: "#1b2a52" },
    { id: "matte-black", name: "Matte Black", hex: "#17171c" },
    { id: "pearl-white", name: "Pearl White", hex: "#f2f1ec" },
    { id: "candy-red", name: "Candy Red", hex: "#a01824" },
    { id: "silver-metallic", name: "Silver Metallic", hex: "#a8a9ad" },
    { id: "forest-green", name: "Forest Green", hex: "#2d5a3d" },
    { id: "desert-tan", name: "Desert Tan", hex: "#7d6a52" },
    { id: "gunmetal-gray", name: "Gunmetal Gray", hex: "#4b4f54" },
  ],
};
