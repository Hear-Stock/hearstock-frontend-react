import React from 'react';

export default function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#eeeeee" transparent opacity={0.2} />
    </mesh>
  );
}
