"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const Globe: React.FC<{ rotationSpeed: number; radius: number }> = ({ rotationSpeed, radius }) => {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.2;
    }
  });
  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color="#c9a96e" transparent opacity={0.07} wireframe />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.01, 48, 48]} />
        <meshBasicMaterial color="#c9a96e" transparent opacity={0.03} wireframe />
      </mesh>
    </group>
  );
};

export function GlobeBackground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  // PERF: o render só corre quando a hero está visível E o separador está
  // ativo. Fora do ecrã ou com o separador oculto, o loop pára (frameloop
  // "never") — a rotação retoma do mesmo estado quando volta a ser visível.
  // Sem qualquer alteração visual enquanto o globo está no ecrã.
  const [active, setActive] = useState(true);
  // Acessibilidade (correção mobile 21/10/2026): com
  // prefers-reduced-motion, o globo fica visível mas ESTÁTICO —
  // frameloop "never" (o frame inicial continua renderizado; só a
  // rotação contínua para). Sem esconder conteúdo.
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let inView = true;
    let tabVisible = !document.hidden;
    const update = () => setActive(inView && tabVisible);
    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        update();
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    const onVisibility = () => {
      tabVisible = !document.hidden;
      update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.8 }}
    >
      {/* dpr limitado a 1.5: o wireframe translúcido é indistinguível a 2x,
          mas o custo de GPU/CPU por frame desce de forma relevante. */}
      <Canvas dpr={[1, 1.5]} frameloop={active && !reducedMotion ? "always" : "never"}>
        <PerspectiveCamera makeDefault position={[0, 0, 2.8]} fov={75} />
        <ambientLight intensity={0.5} />
        <Globe rotationSpeed={0.0025} radius={1.15} />
      </Canvas>
    </div>
  );
}
