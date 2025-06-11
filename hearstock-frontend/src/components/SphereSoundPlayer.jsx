import React from 'react';
import * as Tone from 'tone';
import { sampleData } from '../data/sampleData';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SphereSoundPlayer({ coords, setCurrentIndex }) {
  //const coords = convertToSphericalCoords(sampleData);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handlePlay = async () => {
    await Tone.start();

    // panner는 재사용
    const panner = new Tone.Panner3D({
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 1000,
      rolloffFactor: 0.01,
    }).toDestination();

    Tone.Listener.positionX.value = 0;
    Tone.Listener.positionY.value = 0;
    Tone.Listener.positionZ.value = 0;

    for (let i = 0; i < coords.length; i++) {
      const p = coords[i];
      setCurrentIndex(i); // 🔴 현재 재생 위치 업데이트

      panner.positionX.value = -p.x;
      panner.positionY.value = p.y;
      panner.positionZ.value = p.z;

      const tempSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 },
      }).connect(panner);

      //tempSynth.triggerAttackRelease(p.freq, '8n'); // 🟡 주파수 사용
      tempSynth.triggerAttackRelease(440, '8n'); // 주파수 고정 = 높낮이 제거
      await sleep(200); // 간격
      tempSynth.dispose();
    }

    setCurrentIndex(null);
  };

  return (
    <div style={{ textAlign: 'center', margin: '1rem' }}>
      <button onClick={handlePlay} style={{ padding: '10px 20px' }}>
        🔊 재생 (Beep)
      </button>
    </div>
  );
}
