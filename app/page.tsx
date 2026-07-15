import type { Metadata } from "next";
import { preload } from "react-dom";
import { ConfiguratorPage } from "@/components/configurator/ConfiguratorPage";
import { MOTORCYCLES } from "@/data/motorcycles";

export const metadata: Metadata = {
  title: "3D Motorcycle Configurator | Kustomoto",
  description: "Customize your motorcycle's colors and paint finishes in 3D",
};

export default function Home() {
  // Start the default bike's GLB downloading from the initial HTML, in
  // parallel with the JS bundle — instead of after hydration mounts the
  // canvas. crossOrigin must match three's FileLoader fetch (cors +
  // same-origin credentials) or the preload is wasted.
  if (MOTORCYCLES[0]?.modelPath) {
    preload(MOTORCYCLES[0].modelPath, { as: "fetch", crossOrigin: "anonymous" });
  }
  return <ConfiguratorPage />;
}
