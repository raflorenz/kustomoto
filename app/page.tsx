import type { Metadata } from "next";
import { ConfiguratorPage } from "@/components/configurator/ConfiguratorPage";

export const metadata: Metadata = {
  title: "3D Motorcycle Configurator | Kustomoto",
  description: "Customize your motorcycle's colors and paint finishes in 3D",
};

export default function Home() {
  return <ConfiguratorPage />;
}
