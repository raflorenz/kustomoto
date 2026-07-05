import type { ComponentType } from "react";
import { Adv150Model } from "./Adv150Model";
import { NmaxClayModel } from "./NmaxClayModel";
import { AeroxClassicModel } from "./AeroxClassicModel";

/**
 * Fallback models, keyed by motorcycle id — rendered when the primary GLB
 * fails to load. Either procedural (Adv150Model) or a simpler backup GLB
 * (NmaxClayModel, AeroxClassicModel).
 */
export const BUILTIN_MODELS: Record<string, ComponentType> = {
  "honda-adv-150": Adv150Model,
  "yamaha-nmax": NmaxClayModel,
  "yamaha-aerox": AeroxClassicModel,
};
