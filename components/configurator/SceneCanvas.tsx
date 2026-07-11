"use client";

import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { BUILTIN_MODELS } from "./models";
import { MotorcycleModel } from "./MotorcycleModel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "./ErrorBoundary";

const MIN_DISTANCE = 1.4;
const MAX_DISTANCE = 6;
const TARGET = new THREE.Vector3(0, 0.55, 0);
const CAMERA_POSITION: [number, number, number] = [2.1, 1.0, 2.3];

export function SceneCanvas() {
  const motorcycle = useConfiguratorStore((s) => s.currentMotorcycle);
  const controlsRef = useRef<OrbitControlsImpl>(null);

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
        <color attach="background" args={["#e9eaec"]} />

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
          <meshStandardMaterial color="#f6f6f7" roughness={0.95} />
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
              <MotorcycleModel
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

      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => zoomBy(0.8)}
          aria-label="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-lg font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-white"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-lg font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-white"
        >
          −
        </button>
        <button
          onClick={resetView}
          aria-label="Reset view"
          title="Reset view"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-white"
        >
          ⟳
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400">
        Drag to rotate · Scroll to zoom
      </p>
    </>
  );
}
