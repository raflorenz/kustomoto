"use client";

import { MotorcycleModel } from "../MotorcycleModel";

/**
 * Fallback for the Yamaha NMAX: the untextured clay GLB from 3D Warehouse
 * ("Yamaha NMAX" by Ozkar O.) that was the primary model before the Sketchfab
 * model replaced it. Rendered by SceneCanvas's ErrorBoundary if the primary
 * GLB fails to load. This one is a broken SketchUp-style export, so it keeps
 * the default material sanitize pass.
 */
export function NmaxClayModel() {
  return (
    <MotorcycleModel
      modelPath="/models/yamaha-nmax-clay.glb"
      modelYaw={Math.PI}
    />
  );
}
