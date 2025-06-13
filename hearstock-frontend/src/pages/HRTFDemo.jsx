import React, { useState } from 'react';
import HRTF3DScene from '../components/HRTFDemo/HRTF3DScene';
import HRTFSoundController from '../components/HRTFDemo/HRTFSoundController';

export default function HRTF3DPage() {
  const [position, setPosition] = useState([0, 0, 0]);

  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h2>🎧 HRTF 3D 공간 청음 테스트</h2>
      <HRTF3DScene position={position} onPositionChange={setPosition} />
      <HRTFSoundController position={position} />
    </div>
  );
}
