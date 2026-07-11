"use client";

import { useEffect } from "react";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { MOTORCYCLES } from "@/data/motorcycles";
import { SceneCanvas } from "./SceneCanvas";
import { ControlPanel } from "./ControlPanel";

export function ConfiguratorPage() {
  const setMotorcycle = useConfiguratorStore((s) => s.setMotorcycle);
  const motorcycle = useConfiguratorStore((s) => s.currentMotorcycle);

  useEffect(() => {
    setMotorcycle(MOTORCYCLES[0]);
  }, [setMotorcycle]);

  return (
    <div className="flex h-dvh flex-col">
      {/* 3D viewport — model centered, zoomable */}
      <div className="relative min-h-0 flex-1">
        <SceneCanvas />

        {/* Header overlay */}
        <div className="pointer-events-none absolute left-5 top-4 flex items-center gap-3">
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {motorcycle?.name ?? "Loading..."}
            </h1>
            <p className="text-xs text-gray-500">Fairing Configurator</p>
          </div>
        </div>

        {/* Motorcycle picker */}
        <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5">
          {MOTORCYCLES.map((bike) => (
            <button
              key={bike.id}
              onClick={() => setMotorcycle(bike)}
              className={`pointer-events-auto rounded-full px-3.5 py-1.5 text-xs font-medium shadow-sm ring-1 transition-colors ${
                motorcycle?.id === bike.id
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white/90 text-gray-600 ring-gray-200 hover:bg-white"
              }`}
            >
              {bike.name}
            </button>
          ))}
        </div>
      </div>

      {/* Customization controls below the model */}
      <ControlPanel />
    </div>
  );
}
