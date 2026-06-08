"use client";

import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Planet() {
  const g = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * 0.06;
    g.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.1) * 0.12;
  });
  return (
    <group ref={g}>
      <mesh>
        <icosahedronGeometry args={[2.25, 2]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.32} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.1, 48, 48]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.07} />
      </mesh>
      <mesh rotation={[Math.PI / 2.25, 0, 0]}>
        <torusGeometry args={[3.3, 0.013, 16, 140]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, 0.4, 0]}>
        <torusGeometry args={[3.9, 0.006, 16, 140]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 1300;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 8 + Math.random() * 16;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      pos[i * 3 + 2] = r * Math.cos(p);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} color="#cbd5e1" transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

function Rig() {
  useFrame((s: RootState) => {
    const x = s.pointer.x * 0.6;
    const y = s.pointer.y * 0.4;
    s.camera.position.x += (x - s.camera.position.x) * 0.03;
    s.camera.position.y += (y - s.camera.position.y) * 0.03;
    s.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Background3D() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 52 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <Starfield />
      <Planet />
      <Rig />
    </Canvas>
  );
}
