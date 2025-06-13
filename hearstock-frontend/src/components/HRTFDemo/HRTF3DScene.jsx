// components/HRTF3DScene.jsx
import React, { useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import GroundPlane from './GroundPlane';
import AxisLines from './AxisLines';
import EmojiHuman from './Emoji';
import DraggableBall from './DraggableBall';

export default function HRTF3DScene({ position, onPositionChange, isPlaying }) {
  const disableOrbit = useRef(false);

  return (
    <Canvas
      camera={{ position: [2, 3, 3], fov: 60 }}
      style={{ height: 500, width: '100%' }}
    >
      <OrbitControls enabled={!disableOrbit.current} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <GroundPlane />
      <AxisLines />
      <DraggableBall
        position={position}
        onDrag={onPositionChange}
        disableOrbit={disableOrbit}
      />
      <EmojiHuman />
    </Canvas>
  );
}
