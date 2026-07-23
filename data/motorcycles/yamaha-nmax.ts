import type { MotorcycleConfig } from "@/types/configurator";

/**
 * Primary GLB: "Nmax Motorbike" by muhecsad, processed by
 * scripts/split-nmax-v2.mjs. License: CC-BY-NC-SA-4.0 — credit required, no
 * commercial use, share-alike. Required credit:
 *
 *   This work is based on "Nmax Motorbike"
 *   (https://sketchfab.com/3d-models/nmax-motorbike-b4754cbe95fb4c39be1524300e93833b)
 *   by muhecsad (https://sketchfab.com/muhecsad) licensed under CC-BY-NC-SA-4.0
 *   (http://creativecommons.org/licenses/by-nc-sa/4.0/)
 *
 * Fallback GLB (registered in BUILTIN_MODELS): the untextured clay model
 * public/models/yamaha-nmax-clay.glb ("Yamaha NMAX" by Ozkar O., 3D
 * Warehouse), processed by scripts/split-nmax.mjs. The BASE_, STD_ and UNI_
 * overrides and the paint_front/paint_rear entries below only exist in the
 * clay GLB; paint_body is shared by both models so the Body Panels part
 * recolors either one.
 */
export const yamahaNmax: MotorcycleConfig = {
  id: "yamaha-nmax",
  name: "Yamaha NMAX",
  modelCode: "NMAX 155",
  modelPath: "/models/yamaha-nmax.glb",
  // The Sketchfab GLB has properly-authored PBR materials — do not run the
  // SketchUp-export fix-up over them.
  sanitizeMaterials: false,
  modelYaw: Math.PI,
  materialOverrides: {
    // --- primary GLB: windscreen exports opaque white; make it smoked glass
    "Material.002": {
      color: "#9fb2bd",
      roughness: 0.08,
      metalness: 0,
      opacity: 0.3,
    },
    // primary GLB: split-nmax-v2.mjs renamed Material.023 to paint_seat, but
    // it is actually an engine-side cover, not the saddle — pin it dark
    "paint_seat": { color: "#232327", roughness: 0.7, metalness: 0.4 },

    // --- clay fallback GLB only (harmless no-ops for the primary model)
    "paint_front": { color: "#1d1d22", roughness: 0.55, metalness: 0.3 },
    "paint_rear": { color: "#1d1d22", roughness: 0.55, metalness: 0.3 },
    "BASE_NMAX_TireFr": { color: "#1c1c20", roughness: 0.9, metalness: 0 },
    "BASE_NMAX_TireRe": { color: "#1c1c20", roughness: 0.9, metalness: 0 },
    "BASE_NMAX_Brakes": { color: "#b8bbc0", roughness: 0.3, metalness: 0.85 },
    "BASE_NMAX_Headli": {
      color: "#b8ccd8",
      roughness: 0.05,
      metalness: 0,
      opacity: 0.35,
    },
    "BASE_NMAX_Projec": {
      color: "#cfdbe4",
      roughness: 0.08,
      metalness: 0,
      opacity: 0.45,
    },
    "BASE_NMAX_Stopli": { color: "#8a1620", roughness: 0.15, metalness: 0 },
    "BASE_NMAX_Yamaha": { color: "#c8cbd0", roughness: 0.25, metalness: 0.85 },
    "BASE_NMAX_Flatba": { color: "#1b1b1f", roughness: 0.8, metalness: 0.05 },
    "BASE_NMAX_FlatBl": { color: "#1b1b1f", roughness: 0.8, metalness: 0.05 },
    "BASE_NMAX_Inside": { color: "#17171a", roughness: 0.85, metalness: 0.05 },
    "BASE_CarbonRearP": { color: "#26262a", roughness: 0.5, metalness: 0.2 },
    "BASE_Radiator": { color: "#2a2a2e", roughness: 0.7, metalness: 0.3 },
    "STD_NMAX_Saddle": { color: "#232327", roughness: 0.8, metalness: 0.05 },
    "STD_NMAX_Grips": { color: "#1a1a1e", roughness: 0.85, metalness: 0 },
    "STD_NMAX_GripEnd": { color: "#9ea1a6", roughness: 0.35, metalness: 0.8 },
    "STD_NMAX_Carrier": { color: "#3a3c40", roughness: 0.5, metalness: 0.5 },
    "UNI_CircleBolts": { color: "#9ea1a6", roughness: 0.35, metalness: 0.8 },
    "UNI_CrossBolts": { color: "#9ea1a6", roughness: 0.35, metalness: 0.8 },
    "UNI_HexBolts": { color: "#9ea1a6", roughness: 0.35, metalness: 0.8 },
  },
  parts: [
    {
      id: "main-body",
      label: "Body Panels",
      meshNames: [],
      // paint_* materials are created by scripts/split-nmax-v2.mjs (primary)
      // and scripts/split-nmax.mjs (clay fallback)
      materialNames: ["paint_body"],
      defaultColor: "#17171c",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "wheel-rims",
      label: "Wheel Rims",
      meshNames: [],
      materialNames: ["paint_rims", "paint_rims_rear"],
      defaultColor: "#8f1f2a",
      defaultFinish: "gloss",
      category: "accent",
    },
    {
      id: "seat",
      label: "Seat",
      meshNames: [],
      // the actual saddle material in the primary GLB (paint_seat is a
      // mis-named engine cover, see materialOverrides above)
      materialNames: ["Mesh_0093.rip"],
      defaultColor: "#17171c",
      defaultFinish: "matte",
      category: "accent",
    },
  ],
  colorPresets: [
    { id: "prestige-blue", name: "Prestige Blue", hex: "#1b2a52" },
    { id: "matte-black", name: "Matte Black", hex: "#17171c" },
    { id: "milky-white", name: "Milky White", hex: "#eceae4" },
    { id: "matte-red", name: "Matte Red", hex: "#8f1f2a" },
    { id: "silver-metallic", name: "Silver Metallic", hex: "#a8a9ad" },
    { id: "mint-green", name: "Mint Green", hex: "#7fae9d" },
    { id: "sunset-orange", name: "Sunset Orange", hex: "#cc5500" },
    { id: "gunmetal-gray", name: "Gunmetal Gray", hex: "#4b4f54" },
  ],
  liveries: [
    {
      id: "factory-black",
      name: "Factory Black",
      tag: "OEM",
      // matches the parts' default colors/finishes, so Reset == this livery
      zones: {
        "main-body": { color: "#17171c", finish: "gloss" },
        "wheel-rims": { color: "#8f1f2a", finish: "gloss" },
        "seat": { color: "#17171c", finish: "matte" },
      },
    },
    {
      id: "street-heat",
      name: "Street Heat",
      tag: "SHOP",
      zones: {
        "main-body": { color: "#8f1f2a", finish: "matte" },
        "wheel-rims": { color: "#17171c", finish: "matte" },
        "seat": { color: "#232327", finish: "matte" },
      },
    },
    {
      id: "mint-runner",
      name: "Mint Runner",
      tag: "SHOP",
      zones: {
        "main-body": { color: "#7fae9d", finish: "gloss" },
        "wheel-rims": { color: "#eceae4", finish: "gloss" },
        "seat": { color: "#232327", finish: "matte" },
      },
    },
    {
      id: "prestige",
      name: "Prestige",
      tag: "SHOP",
      zones: {
        "main-body": { color: "#1b2a52", finish: "metallic" },
        "wheel-rims": { color: "#a8a9ad", finish: "satin" },
        "seat": { color: "#232327", finish: "matte" },
      },
    },
    {
      id: "carbon-prestige",
      name: "Carbon Prestige",
      tag: "SHOP",
      zones: {
        "main-body": { color: "#a8a9ad", finish: "carbon" },
        "wheel-rims": { color: "#1b2a52", finish: "gloss" },
        "seat": { color: "#232327", finish: "matte" },
      },
    },
  ],
};
