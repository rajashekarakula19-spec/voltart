"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Grid } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const STEEL = "#5b8fa8";
const MOLTEN = "#f0772a";
const GUNMETAL = "#2a303a";
const GUNMETAL_LIGHT = "#3a4250";

function Building({
  position,
  size,
  color = GUNMETAL,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.4} />
    </mesh>
  );
}

function Chimney({ position, height = 2.2 }: { position: [number, number, number]; height?: number }) {
  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]}>
      <cylinderGeometry args={[0.18, 0.26, height, 6]} />
      <meshStandardMaterial color={GUNMETAL_LIGHT} metalness={0.6} roughness={0.35} />
    </mesh>
  );
}

function EnergyPipe({
  points,
  progress,
  color = MOLTEN,
}: {
  points: [number, number, number][];
  progress: number;
  color?: string;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const count = 14;

  useFrame(() => {
    dots.current.forEach((mesh, i) => {
      if (!mesh) return;
      const u = (progress * 0.85 + i / count) % 1;
      mesh.position.copy(curve.getPointAt(u));
      const visible = u < progress + 0.05;
      mesh.visible = visible;
      mesh.scale.setScalar(visible ? 0.07 + 0.04 * Math.sin(u * Math.PI) : 0.01);
    });
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.045, 6, false]} />
        <meshStandardMaterial color={GUNMETAL_LIGHT} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.02, 6, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35 + progress * 1.8}
          transparent
          opacity={0.25 + progress * 0.55}
        />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dots.current[i] = el;
          }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#fff2e0" emissive={color} emissiveIntensity={2.4} />
        </mesh>
      ))}
    </group>
  );
}

function LowPolyFactory({ scrollProgress }: { scrollProgress: number }) {
  const group = useRef<THREE.Group>(null);
  const p = Math.min(1, Math.max(0, scrollProgress));

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = -0.35 + p * 0.55 + Math.sin(t * 0.15) * 0.03;
    group.current.position.y = -0.2 + Math.sin(t * 0.4) * 0.04;
  });

  const pipeA: [number, number, number][] = [
    [-2.4, 0.2, 0.6],
    [-1.2, 0.45, 0.9],
    [0.1, 0.7, 0.7],
    [1.3, 1.1, 0.2],
    [2.2, 1.8, -0.3],
  ];
  const pipeB: [number, number, number][] = [
    [2.3, 0.15, 1.0],
    [1.2, 0.3, 1.2],
    [0.0, 0.35, 1.1],
    [-1.1, 0.8, 0.4],
    [-1.8, 1.6, -0.2],
  ];

  return (
    <Float speed={0.9} rotationIntensity={0.05} floatIntensity={0.12}>
      <group ref={group} position={[0.3, -0.6, 0]} scale={1.15}>
        <Building position={[-1.3, 0.7, 0]} size={[1.8, 1.4, 1.4]} />
        <Building position={[0.7, 0.95, -0.2]} size={[2.0, 1.9, 1.5]} color="#232933" />
        <Building position={[2.2, 0.55, 0.5]} size={[1.1, 1.1, 1.1]} />
        <Chimney position={[-1.7, 1.4, -0.2]} height={1.8} />
        <Chimney position={[-0.9, 1.4, 0.35]} height={2.3} />
        <mesh position={[0.4, 2.15, -0.2]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.35} emissive={STEEL} emissiveIntensity={0.2} />
        </mesh>
        {/* glowing windows */}
        {[-1.6, -1.1, -0.6].map((x, i) => (
          <mesh key={x} position={[x, 0.85 + (i % 2) * 0.35, 0.72]}>
            <boxGeometry args={[0.28, 0.22, 0.04]} />
            <meshStandardMaterial
              color={MOLTEN}
              emissive={MOLTEN}
              emissiveIntensity={0.6 + p * 1.4}
            />
          </mesh>
        ))}
        <EnergyPipe points={pipeA} progress={p} color={MOLTEN} />
        <EnergyPipe points={pipeB} progress={Math.max(0, p - 0.12)} color={STEEL} />
      </group>
    </Float>
  );
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <color attach="background" args={["#0e1116"]} />
      <fog attach="fog" args={["#0e1116", 8, 18]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 7, 3]} intensity={1.1} color="#f2ebe3" />
      <pointLight position={[2, 2, 3]} intensity={1.6} color={MOLTEN} />
      <pointLight position={[-3, 1, 2]} intensity={1.1} color={STEEL} />
      <Grid
        position={[0.2, -0.85, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#2a313c"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#3d4a5a"
        fadeDistance={14}
        fadeStrength={1.2}
        infiniteGrid
      />
      <LowPolyFactory scrollProgress={scrollProgress} />
    </>
  );
}

export function FactoryScene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [4.2, 2.0, 5.8], fov: 40 }} dpr={[1, 1.6]}>
        <Scene scrollProgress={scrollProgress} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e1116] via-[#0e1116]/70 to-transparent md:w-[55%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e1116] to-transparent" />
    </div>
  );
}
