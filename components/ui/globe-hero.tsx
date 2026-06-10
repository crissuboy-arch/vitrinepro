"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef } from "react";
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
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.8 }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 2.8]} fov={75} />
        <ambientLight intensity={0.5} />
        <Globe rotationSpeed={0.0025} radius={1.15} />
      </Canvas>
    </div>
  );
}
