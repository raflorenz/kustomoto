"use client";

import { MotorcycleModel } from "../MotorcycleModel";

/**
 * Fallback for the Yamaha Aerox: the 3D Warehouse GLB ("Yamaha Aerox 155cc"
 * by ItoRauf) that was the primary model before the Sketchfab modified build
 * replaced it. Rendered by SceneCanvas's ErrorBoundary if the primary GLB
 * fails to load. SketchUp-derived export, so it keeps the default material
 * sanitize pass, and it faces +X without any extra yaw.
 */
export function AeroxClassicModel() {
  return <MotorcycleModel modelPath="/models/yamaha-aerox-classic.glb" />;
}
