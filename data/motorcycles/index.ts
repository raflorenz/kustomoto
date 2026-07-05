import type { MotorcycleConfig } from "@/types/configurator";
import { hondaAdv150 } from "./honda-adv-150";
import { hondaPcx } from "./honda-pcx";
import { yamahaNmax } from "./yamaha-nmax";
import { yamahaAerox } from "./yamaha-aerox";

export const MOTORCYCLES: MotorcycleConfig[] = [
  hondaAdv150,
  hondaPcx,
  yamahaNmax,
  yamahaAerox,
];
