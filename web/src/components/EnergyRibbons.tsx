"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Grid, Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const CYAN = "#4CC9F0";
const BLUE = "#3D8BFF";
const WHITE = "#E8F7FF";

function Wire({ opacity = 0.6 }: { opacity?: number }) {
  return <meshBasicMaterial color={CYAN} wireframe transparent opacity={opacity} depthWrite={false} />;
}

function Glow({ color = CYAN, intensity = 1.6 }: { color?: string; intensity?: number }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={intensity}
      roughness={0.22}
      metalness={0.55}
      transparent
      opacity={0.9}
    />
  );
}

function CoolingTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.55, 0.85, 2.2, 18, 1, true]} />
        <Wire opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 2.1, 18]} />
        <meshStandardMaterial color="#071422" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <torusGeometry args={[0.42, 0.035, 8, 28]} />
        <Glow intensity={2.4} />
      </mesh>
    </group>
  );
}

function Tank({
  position,
  radius = 0.55,
  height = 1.2,
}: {
  position: [number, number, number];
  radius?: number;
  height?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[radius, radius, height, 22, 1, true]} />
        <Wire opacity={0.55} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radius * 0.97, radius * 0.97, height * 0.97, 22]} />
        <meshStandardMaterial color="#06101c" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function curveFrom(points: [number, number, number][]) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
}

function PipeRun({ points, radius = 0.055 }: { points: [number, number, number][]; radius?: number }) {
  const curve = useMemo(() => curveFrom(points), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 72, radius, 10, false]} />
      <Wire opacity={0.75} />
    </mesh>
  );
}

function EnergyFlow({
  points,
  color,
  speed = 1,
  count = 20,
}: {
  points: [number, number, number][];
  color: string;
  speed?: number;
  count?: number;
}) {
  const curve = useMemo(() => curveFrom(points), [points]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    dots.current.forEach((mesh, i) => {
      if (!mesh) return;
      const u = (t * 0.12 + i / count) % 1;
      mesh.position.copy(curve.getPointAt(u));
      mesh.scale.setScalar(0.05 + 0.05 * Math.sin(u * Math.PI));
    });
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 90, 0.02, 8, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.4}
          transparent
          opacity={0.6}
        />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dots.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color={WHITE} emissive={color} emissiveIntensity={3.2} />
        </mesh>
      ))}
    </group>
  );
}

function LiveMeter() {
  const valueRef = useRef<HTMLSpanElement>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const kwh = 15.4 + Math.sin(t * 1.25) * 0.35 + Math.sin(t * 0.37) * 0.12;
    if (valueRef.current) valueRef.current.textContent = kwh.toFixed(1);
    if (ring.current) ring.current.rotation.z = -t * 0.6;
  });

  return (
    <group position={[0.2, 0.55, 1.55]} rotation={[0, 0.15, 0]}>
      <mesh>
        <circleGeometry args={[0.4, 40]} />
        <meshStandardMaterial color="#031018" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.3, 0.38, 48]} />
        <Glow color={CYAN} intensity={2.6} />
      </mesh>
      <mesh ref={ring} position={[0, 0, 0.015]}>
        <ringGeometry args={[0.24, 0.28, 48, 1, 0, Math.PI * 1.35]} />
        <Glow color={BLUE} intensity={3.2} />
      </mesh>
      <Html center transform position={[0, 0, 0.04]} distanceFactor={4.8}>
        <div
          style={{
            width: 88,
            textAlign: "center",
            color: CYAN,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            textShadow: `0 0 12px ${CYAN}`,
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            <span ref={valueRef}>15.7</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>kWh</div>
        </div>
      </Html>
    </group>
  );
}

const PIPE_A: [number, number, number][] = [
  [-2.2, 0.2, 0.8],
  [-1.2, 0.35, 1.0],
  [-0.2, 0.55, 1.2],
  [0.6, 0.7, 1.0],
  [1.4, 0.9, 0.4],
  [2.0, 1.3, -0.2],
];
const PIPE_B: [number, number, number][] = [
  [2.1, 0.15, 1.1],
  [1.3, 0.25, 1.3],
  [0.4, 0.2, 1.4],
  [-0.5, 0.35, 1.1],
  [-1.4, 0.7, 0.3],
  [-1.8, 1.4, -0.4],
];
const PIPE_C: [number, number, number][] = [
  [-1.6, 0.1, -0.8],
  [-0.6, 0.4, -0.5],
  [0.3, 0.85, -0.2],
  [1.1, 1.5, 0.1],
  [1.5, 2.1, 0.2],
];

function IndustrialPlant() {
  return (
    <Float speed={1.05} rotationIntensity={0.06} floatIntensity={0.16}>
      <group position={[0.55, -0.85, 0]} rotation={[0, -0.58, 0]} scale={1.18}>
        <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7, 4.5]} />
          <meshStandardMaterial color="#050b14" metalness={0.95} roughness={0.35} transparent opacity={0.8} />
        </mesh>

        <CoolingTower position={[-1.55, 0, -0.35]} />
        <CoolingTower position={[-0.35, 0, -0.7]} />
        <Tank position={[1.35, 0.55, -0.15]} radius={0.62} height={1.1} />
        <Tank position={[2.15, 0.4, 0.55]} radius={0.42} height={0.8} />

        <mesh position={[0.2, 0.7, 0.2]}>
          <boxGeometry args={[1.4, 1.4, 1.1]} />
          <Wire opacity={0.4} />
        </mesh>
        <mesh position={[0.2, 0.7, 0.2]}>
          <boxGeometry args={[1.32, 1.32, 1.02]} />
          <meshStandardMaterial color="#081422" transparent opacity={0.45} />
        </mesh>

        <mesh position={[1.0, 1.4, 0.55]}>
          <cylinderGeometry args={[0.08, 0.08, 2.4, 10]} />
          <Wire opacity={0.8} />
        </mesh>
        <mesh position={[-0.9, 1.5, 0.6]}>
          <cylinderGeometry args={[0.07, 0.07, 2.6, 10]} />
          <Wire opacity={0.8} />
        </mesh>

        <PipeRun points={PIPE_A} />
        <PipeRun points={PIPE_B} radius={0.05} />
        <PipeRun points={PIPE_C} radius={0.045} />

        <EnergyFlow points={PIPE_A} color={CYAN} speed={1.2} count={24} />
        <EnergyFlow points={PIPE_B} color={WHITE} speed={0.95} count={18} />
        <EnergyFlow points={PIPE_C} color={BLUE} speed={1.4} count={16} />

        <LiveMeter />
      </group>
    </Float>
  );
}

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = 3.9 + Math.sin(t * 0.22) * 0.28;
    state.camera.position.y = 1.6 + Math.sin(t * 0.18) * 0.1;
    state.camera.lookAt(0.75, 0.55, 0);
  });
  return null;
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#03070f"]} />
      <fog attach="fog" args={["#03070f", 9, 18]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[5, 8, 4]} intensity={1.15} color="#d7f4ff" />
      <pointLight position={[2.2, 2.2, 3]} intensity={2.4} color={CYAN} />
      <pointLight position={[-2, 1.2, 2]} intensity={1.5} color={BLUE} />

      <Grid
        position={[0.6, -0.9, 0]}
        args={[22, 22]}
        cellSize={0.45}
        cellThickness={0.65}
        cellColor="#12324a"
        sectionSize={2.25}
        sectionThickness={1.15}
        sectionColor="#2f7eae"
        fadeDistance={15}
        fadeStrength={1.25}
        infiniteGrid
      />

      <IndustrialPlant />
      <CameraDrift />
    </>
  );
}

export function EnergyRibbons() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas camera={{ position: [3.9, 1.6, 5.3], fov: 40 }} dpr={[1, 1.75]}>
        <Scene />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#03070f] via-[#03070f]/80 to-transparent md:w-[58%] md:via-[#03070f]/70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#03070f] to-transparent" />
    </div>
  );
}
