"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { MOTORCYCLES } from "@/data/motorcycles";
import { Sidebar, Brand } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { Toast } from "./Toast";

// three.js + drei + the canvas live in their own async chunk so the page
// shell paints while they download (in parallel with the preloaded GLB).
const SceneCanvas = dynamic(
  () => import("./SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line-strong border-t-accent" />
          <p className="whitespace-nowrap font-mono text-xs tracking-[0.08em] text-dim">
            LOADING VIEWER...
          </p>
        </div>
      </div>
    ),
  }
);

function BikeChips() {
  const motorcycle = useConfiguratorStore((s) => s.currentMotorcycle);
  const setMotorcycle = useConfiguratorStore((s) => s.setMotorcycle);

  return (
    <>
      {MOTORCYCLES.map((bike) => {
        const active = motorcycle?.id === bike.id;
        return (
          <button
            key={bike.id}
            onClick={() => setMotorcycle(bike)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-[7px] font-mono text-[10px] font-bold tracking-[0.08em] transition-colors ${
              active
                ? "border-transparent bg-accent text-accent-ink"
                : "border-line-strong bg-panel text-dim hover:border-accent hover:text-accent"
            }`}
          >
            {bike.name.toUpperCase()}
          </button>
        );
      })}
    </>
  );
}

export function ConfiguratorPage() {
  const setMotorcycle = useConfiguratorStore((s) => s.setMotorcycle);
  const motorcycle = useConfiguratorStore((s) => s.currentMotorcycle);
  const setTheme = useConfiguratorStore((s) => s.setTheme);
  const showToast = useConfiguratorStore((s) => s.showToast);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMotorcycle(MOTORCYCLES[0]);
  }, [setMotorcycle]);

  // Adopt the theme the pre-hydration script in layout.tsx applied
  useEffect(() => {
    if (document.documentElement.dataset.theme === "light") setTheme("light");
  }, [setTheme]);

  const shareBuild = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
    } catch {}
    showToast("Share link copied to clipboard");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-body text-ink lg:flex-row">
      {/* Mobile header */}
      <header className="flex shrink-0 items-center justify-between px-[18px] pb-3 pt-4 lg:hidden">
        <Brand compact />
        <div className="flex items-center gap-2">
          <ThemeToggle className="flex" />
          <button
            onClick={shareBuild}
            className="rounded-full border border-line-strong px-[15px] py-2 text-[12.5px] font-semibold text-ink"
          >
            Share
          </button>
        </div>
      </header>

      {/* Mobile bike picker */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto px-[18px] pb-3 [scrollbar-width:none] lg:hidden">
        <BikeChips />
      </div>

      {/* 3D viewport */}
      <div className="relative mx-3.5 min-h-0 min-w-0 flex-1 overflow-hidden rounded-[20px] border border-line bg-panel-alt lg:m-0 lg:rounded-none lg:border-0 lg:bg-transparent">
        <SceneCanvas />

        {/* Bike title overlay — sized to match the sidebar brand block */}
        <div className="pointer-events-none absolute left-4 top-3.5 lg:left-7 lg:top-6">
          <div className="text-base font-extrabold italic leading-none tracking-[0.04em] lg:text-[19px]">
            {motorcycle?.name.toUpperCase() ?? "LOADING..."}
          </div>
          {motorcycle && (
            <div className="mt-[3px] font-mono text-[8.5px] tracking-[0.18em] text-dim lg:text-[9px] lg:tracking-[0.2em]">
              {motorcycle.modelCode ?? motorcycle.name.toUpperCase()} ·{" "}
              {motorcycle.parts.length} PAINT PARTS
            </div>
          )}
        </div>

        {/* Desktop bike picker */}
        <div className="absolute right-7 top-6 hidden flex-wrap items-center justify-end gap-1.5 lg:flex">
          <BikeChips />
        </div>

        {/* Desktop theme toggle */}
        <ThemeToggle className="absolute bottom-[22px] left-7 hidden lg:flex" />

        {/* Reopen tab, shown when the sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open panel"
            title="Open panel"
            className="absolute right-0 top-1/2 z-30 hidden h-14 w-[26px] -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-[var(--btn-border)] bg-panel text-soft shadow-[-3px_0_12px_rgba(0,0,0,0.18)] lg:flex"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Control panel — bottom sheet on mobile, collapsible sidebar on desktop */}
      <aside
        className={`mt-3 flex h-[382px] max-h-[48dvh] shrink-0 flex-col overflow-hidden rounded-t-3xl border-t border-line bg-panel shadow-[0_-10px_30px_rgba(0,0,0,0.25)] lg:mt-0 lg:h-auto lg:max-h-none lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none lg:transition-[width] lg:duration-300 ${
          sidebarOpen ? "lg:w-[372px]" : "lg:w-0 lg:border-l-transparent"
        }`}
      >
        <Sidebar onCollapse={() => setSidebarOpen(false)} />
      </aside>

      <Toast />
    </div>
  );
}
