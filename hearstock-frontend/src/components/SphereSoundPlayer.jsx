import React from 'react';
import * as Tone from 'tone';
import { sampleData } from '../data/sampleData';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SphereSoundPlayer() {
  const coords = convertToSphericalCoords(sampleData);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handlePlay = async () => {
    await Tone.start();

    Tone.Listener.positionX.value = 0;
    Tone.Listener.positionY.value = 0;
    Tone.Listener.positionZ.value = 0;

    for (let i = 0; i < coords.length; i++) {
      const p = coords[i];

      const panner = new Tone.Panner3D({
        positionX: -p.x,
        positionY: p.y,
        positionZ: p.z,
      }).toDestination();

      const tempSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 },
      }).connect(panner);

      tempSynth.triggerAttackRelease(p.freq, '8n'); // 🟡 주파수 사용
      await sleep(100); // 간격
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '1rem' }}>
      <button onClick={handlePlay} style={{ padding: '10px 20px' }}>
        🔊 재생 (Beep)
      </button>
    </div>
  );
}
