import type { FinishId, FinishPreset } from "@/types/configurator";

/**
 * Shop prices are per painted part in Philippine pesos, based on typical
 * Cebu/Metro Manila motorcycle repaint rates (2024–2026): solid urethane
 * repaints run ~₱500–1,000 per piece (mags ~₱700–1,000, 7-pc fairing set
 * ~₱3,500), ~₱1,500/panel at auto paint shops, with metallic/candy/chrome
 * effect finishes priced at a multiple of the solid rate.
 */
export function formatPrice(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH");
}

export const FINISHES: Record<FinishId, FinishPreset> = {
  gloss: {
    id: "gloss",
    name: "Gloss",
    description: "Deep clearcoat shine",
    price: 800,
    roughness: 0.18,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  },
  matte: {
    id: "matte",
    name: "Matte",
    description: "Flat, non-reflective",
    price: 1000,
    roughness: 0.82,
    metalness: 0.05,
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
  metallic: {
    id: "metallic",
    name: "Metallic",
    description: "Metal-flake paint",
    price: 1500,
    roughness: 0.28,
    metalness: 0.9,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  },
  satin: {
    id: "satin",
    name: "Satin",
    description: "Soft semi-gloss sheen",
    price: 1200,
    roughness: 0.45,
    metalness: 0.3,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
  },
  chrome: {
    id: "chrome",
    name: "Chrome",
    description: "Mirror-polished metal",
    price: 2800,
    roughness: 0.06,
    metalness: 1,
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
  carbon: {
    id: "carbon",
    name: "Carbon Fiber",
    description: "Woven twill weave under clearcoat",
    price: 2500,
    roughness: 0.25,
    metalness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    weave: true,
  },
};

export const FINISH_LIST: FinishPreset[] = Object.values(FINISHES);
