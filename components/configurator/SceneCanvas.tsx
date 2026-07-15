"use client";

import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  useGLTF,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { MOTORCYCLES } from "@/data/motorcycles";
import { BUILTIN_MODELS } from "./models";
import { MotorcycleModel } from "./MotorcycleModel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";

const MIN_DISTANCE = 1.4;
const MAX_DISTANCE = 6;
const TARGET = new THREE.Vector3(0, 0.55, 0);
const CAMERA_POSITION: [number, number, number] = [2.1, 1.0, 2.3];

// Showroom backdrop per theme (canvas clear color / pedestal disc)
const SCENE_COLORS = {
  dark: { background: "#0e0f12", ground: "#111216" },
  light: { background: "#f1efeb", ground: "#f7f5f1" },
};

const ZOOM_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--btn-border)] bg-panel text-soft shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-colors hover:bg-[var(--fill-hover)]";

export function SceneCanvas() {
  const motorcycle = useConfiguratorStore((s) => s.currentMotorcycle);
  const theme = useConfiguratorStore((s) => s.theme);
  const modelLoaded = useConfiguratorStore((s) => s.modelLoaded);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Once the current bike is on screen, warm the other bikes' GLBs during
  // idle time so switching is instant. useGLTF.preload dedupes via the
  // loader cache, so refires after a switch are no-ops.
  useEffect(() => {
    if (!modelLoaded) return;
    const idle =
      window.requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 2500));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => {
      for (const bike of MOTORCYCLES) {
        if (bike.modelPath && bike.id !== motorcycle?.id) {
          useGLTF.preload(bike.modelPath);
        }
      }
    });
    return () => cancelIdle(handle);
  }, [modelLoaded, motorcycle]);

  const colors = SCENE_COLORS[theme];

  const zoomBy = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const offset = camera.position.clone().sub(controls.target);
    const length = THREE.MathUtils.clamp(
      offset.length() * factor,
      MIN_DISTANCE,
      MAX_DISTANCE
    );
    camera.position.copy(controls.target).add(offset.setLength(length));
    controls.update();
  };

  // controls.reset() restores the state saved at construction, before the
  // target prop was applied — restore the actual initial view instead.
  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...CAMERA_POSITION);
    controls.target.copy(TARGET);
    controls.update();
  };

  const BuiltinModel = motorcycle?.builtinModel
    ? BUILTIN_MODELS[motorcycle.builtinModel]
    : undefined;
  // Procedural stand-in for this bike, shown if the GLB fails to load
  const FallbackModel = motorcycle ? BUILTIN_MODELS[motorcycle.id] : undefined;

  return (
    <>
      <Canvas
        camera={{ position: CAMERA_POSITION, fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[colors.background]} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 7, 4]} intensity={1.1} />
        <directionalLight position={[-6, 3, -4]} intensity={0.4} />

        {/* Studio light box — local lightformers, no network HDR fetch */}
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={4}
            position={[0, 4, 0]}
            rotation-x={Math.PI / 2}
            scale={[6, 6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2.5}
            position={[4, 1.2, 2]}
            target={[0, 0.6, 0]}
            scale={[3, 1.6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={2}
            position={[-4, 1.4, -2]}
            target={[0, 0.6, 0]}
            scale={[3, 1.6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            position={[0, 1.5, -4]}
            target={[0, 0.6, 0]}
            scale={[4, 1.2, 1]}
          />
        </Environment>

        {/* Studio pedestal + grounding shadow */}
        <mesh rotation-x={-Math.PI / 2} position-y={-0.005}>
          <circleGeometry args={[2.4, 64]} />
          <meshStandardMaterial color={colors.ground} roughness={0.95} />
        </mesh>
        <ContactShadows
          position={[0, 0.002, 0]}
          scale={4.5}
          blur={2.4}
          opacity={0.5}
          far={1.4}
          resolution={1024}
          frames={1}
        />

        <Suspense fallback={<LoadingSpinner />}>
          <ErrorBoundary
            fallback={FallbackModel ? <FallbackModel /> : null}
          >
            {motorcycle?.modelPath ? (
              // key forces a remount per bike: r3f only registers pointer
              // handlers on fresh mounts, and the suspense hide/unhide cycle
              // during a model swap drops them from the interaction registry
              <MotorcycleModel
                key={motorcycle.id}
                modelPath={motorcycle.modelPath}
                modelYaw={motorcycle.modelYaw}
                sanitize={motorcycle.sanitizeMaterials !== false}
              />
            ) : BuiltinModel ? (
              <BuiltinModel />
            ) : null}
          </ErrorBoundary>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={TARGET}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          minPolarAngle={0.2}
          maxPolarAngle={1.45}
        />
      </Canvas>

      {/* Depth vignette over the viewport edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 42%, transparent 55%, var(--vignette) 100%)",
        }}
      />

      {/* Zoom controls overlay */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 lg:bottom-[22px] lg:right-5">
        <button
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom in"
          className={`${ZOOM_BUTTON_CLASS} text-[17px]`}
        >
          +
        </button>
        <button
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom out"
          className={`${ZOOM_BUTTON_CLASS} text-[17px]`}
        >
          −
        </button>
        <button
          onClick={resetView}
          aria-label="Reset view"
          title="Reset view"
          className={`${ZOOM_BUTTON_CLASS} text-[13px]`}
        >
          ⟳
        </button>
      </div>

      <p
        className="pointer-events-none absolute bottom-3.5 left-3.5 m-0 whitespace-nowrap font-mono text-[9px] tracking-[0.09em] lg:bottom-[76px] lg:left-1/2 lg:-translate-x-1/2 lg:text-[10px] lg:tracking-[0.07em]"
        style={{ color: "var(--hint)" }}
      >
        <span className="lg:hidden">TAP A PANEL · DRAG · PINCH</span>
        <span className="hidden lg:inline">
          DRAG TO ROTATE&nbsp;·&nbsp;SCROLL TO ZOOM&nbsp;·&nbsp;CLICK TO
          SELECT
        </span>
      </p>
    </>
  );
}
