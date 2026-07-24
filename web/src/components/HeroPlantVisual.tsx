"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function HeroPlantVisual() {
  const [kwh, setKwh] = useState(15.7);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = window.setInterval(() => {
      setKwh(15.4 + Math.sin(Date.now() / 700) * 0.35 + Math.sin(Date.now() / 1600) * 0.12);
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="relative h-full min-h-[420px] w-full overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
        const y = ((e.clientY - r.top) / r.height - 0.5) * -6;
        setTilt({ x, y });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {/* Crop to plant side of the mock (hide baked PlantCost text) */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `perspective(900px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(1.04)`,
        }}
      >
        <Image
          src="/hero-plant.png"
          alt="Animated industrial energy digital twin"
          fill
          priority
          className="object-cover object-[78%_center]"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
      </div>

      {/* Soft left blend into copy */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#03070f] via-[#03070f]/55 to-transparent" />

      {/* Flowing energy streak overlays */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4CC9F0" stopOpacity="0" />
            <stop offset="45%" stopColor="#4CC9F0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="voltart-flow"
          d="M120 420 C 260 360, 340 300, 420 280 S 620 220, 720 160"
          fill="none"
          stroke="url(#flow)"
          strokeWidth="3"
          filter="url(#glow)"
          strokeLinecap="round"
          strokeDasharray="18 220"
        />
        <path
          className="voltart-flow-delay"
          d="M180 480 C 300 430, 420 390, 520 300 S 680 180, 760 120"
          fill="none"
          stroke="url(#flow)"
          strokeWidth="2.2"
          filter="url(#glow)"
          strokeLinecap="round"
          strokeDasharray="14 200"
        />
        <path
          className="voltart-flow-slow"
          d="M90 300 C 220 280, 360 250, 480 210 S 650 140, 780 90"
          fill="none"
          stroke="#3D8BFF"
          strokeOpacity="0.7"
          strokeWidth="2"
          filter="url(#glow)"
          strokeLinecap="round"
          strokeDasharray="10 180"
        />
      </svg>

      {/* Live meter chip */}
      <div className="absolute bottom-[22%] left-[46%] -translate-x-1/2 rounded-full border border-[#4CC9F0]/55 bg-[#031018]/80 px-4 py-2 shadow-[0_0_28px_rgba(76,201,240,0.45)] backdrop-blur-sm md:left-[52%]">
        <div className="font-mono text-lg font-bold leading-none text-[#4CC9F0]">
          {kwh.toFixed(1)}
        </div>
        <div className="mt-0.5 text-center text-[10px] tracking-wide text-[#9ad7ef]/90">kWh</div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#03070f] to-transparent" />
    </div>
  );
}
