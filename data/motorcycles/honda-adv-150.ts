import type { MotorcycleConfig } from "@/types/configurator";

export const hondaAdv150: MotorcycleConfig = {
  id: "honda-adv-150",
  name: "Honda ADV",
  modelPath: "/models/honda-adv-150.glb",
  modelYaw: Math.PI,
  // Fixed materials for the GLB (SketchUp export ships flat 0.5/0.5 PBR values)
  materialOverrides: {
    // Bulk mesh: engine, tires, seat, black plastics
    "<auto>": { color: "#232327", roughness: 0.75, metalness: 0.15 },
    // Mid-gray trim
    "[Color M04]": { color: "#6a6d72", roughness: 0.4, metalness: 0.6 },
    // Silver mechanical bits
    "<auto>9": { color: "#9ea1a6", roughness: 0.32, metalness: 0.8 },
    // Bright metal (exhaust, fork tubes)
    "<auto>12": { color: "#c8cbd0", roughness: 0.26, metalness: 0.85 },
    // Windscreen glass
    "[Translucent Glass Gray]": {
      color: "#b8ccd8",
      roughness: 0.05,
      metalness: 0,
      opacity: 0.3,
    },
  },
  parts: [
    {
      id: "fairing-front",
      label: "Front Fairing",
      meshNames: [],
      // paint_* materials are created by scripts/split-adv150.mjs
      materialNames: ["paint_front", "<auto>8"],
      defaultColor: "#b02330",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "side-panels",
      label: "Side Panels",
      meshNames: [],
      materialNames: ["paint_side"],
      defaultColor: "#b02330",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "rear-cowl",
      label: "Rear Cowl",
      meshNames: [],
      materialNames: ["paint_rear"],
      defaultColor: "#b02330",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "panel-accents",
      label: "Panel Accents",
      meshNames: [],
      materialNames: ["<auto>17"],
      defaultColor: "#f2f1ec",
      defaultFinish: "satin",
      category: "fairing",
    },
  ],
  colorPresets: [
    { id: "advance-red", name: "Advance Red", hex: "#b02330" },
    { id: "tough-matte-black", name: "Tough Matte Black", hex: "#17171c" },
    { id: "pearl-white", name: "Pearl White", hex: "#f2f1ec" },
    { id: "midnight-blue", name: "Midnight Blue", hex: "#1b2a52" },
    { id: "silver-metallic", name: "Silver Metallic", hex: "#a8a9ad" },
    { id: "forest-green", name: "Forest Green", hex: "#2d5a3d" },
    { id: "burnt-orange", name: "Burnt Orange", hex: "#cc5500" },
    { id: "gunmetal-gray", name: "Gunmetal Gray", hex: "#4b4f54" },
  ],
};
