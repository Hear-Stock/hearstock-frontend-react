import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';

function Point({ position, active }) {
  const ref = useRef();

  // 활성 점이면 살짝 펄싱
  useFrame((state) => {
    if (!ref.current) return;
    if (active) {
      const t = state.clock.getElapsedTime();
      const s = 1 + Math.sin(t * 6) * 0.15; // 부드러운 펄싱
      ref.current.scale.set(s, s, s);
    } else {
      ref.current.scale.set(1, 1, 1);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[active ? 0.06 : 0.03, 16, 16]} />
      <meshStandardMaterial
        color={active ? '#ff9800' : 'grey'}
        emissive={active ? '#ff9800' : '#000000'}
        emissiveIntensity={active ? 0.6 : 0}
      />
    </mesh>
  );
}

export default function Sphere3DScene({ points, currentIndex }) {
  const linePoints = points.map((p) => [p.x, p.y, p.z]);

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 60 }}>
        <ambientLight />
        <pointLight position={[5, 5, 5]} />
        <OrbitControls />

        {/* 점들 */}
        {points.map((p, idx) => (
          <Point
            key={idx}
            position={[p.x, p.y, p.z]}
            active={idx === currentIndex} // 🔹 현재 재생 점 하이라이트
          />
        ))}

        {/* 선으로 연결 */}
        <Line points={linePoints} color="cyan" lineWidth={1} dashed={false} />

        {/* 좌표축 */}
        <axesHelper args={[1.5]} />
      </Canvas>
      <p>x: 🟠, y: 🟢, z: 🔵</p>
    </div>
  );
}
