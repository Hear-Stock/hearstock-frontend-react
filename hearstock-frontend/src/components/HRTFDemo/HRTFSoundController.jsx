import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export default function HRTFSoundController({ position }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(null);
  const pannerRef = useRef(null);

  const handleStart = async () => {
    await Tone.start();

    const synth = new Tone.Synth().toDestination();
    const panner = new Tone.Panner3D({
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      rolloffFactor: 0.01,
    }).toDestination();

    Tone.Listener.positionX.value = 0;
    Tone.Listener.positionY.value = 0;
    Tone.Listener.positionZ.value = 0;

    synth.connect(panner);
    synth.triggerAttack(Tone.Frequency(440, 'hz'));

    synthRef.current = synth;
    pannerRef.current = panner;
    setIsPlaying(true);
  };

  const handleStop = () => {
    synthRef.current?.triggerRelease();
    synthRef.current?.dispose();
    synthRef.current = null;
    pannerRef.current = null;
    setIsPlaying(false);
  };

  useEffect(() => {
    if (pannerRef.current) {
      const [x, y, z] = position;
      pannerRef.current.positionX.value = x;
      pannerRef.current.positionY.value = y;
      pannerRef.current.positionZ.value = z;

      const freq = 440 * Math.pow(2, y);
      if (synthRef.current) {
        synthRef.current.setNote(Tone.Frequency(freq, 'hz'));
      }
    }
  }, [position]);

  return (
    <div style={{ marginTop: '1rem' }}>
      {!isPlaying ? (
        <button onClick={handleStart}>🎧 소리 재생</button>
      ) : (
        <button onClick={handleStop}>⏹️ 소리 정지</button>
      )}
    </div>
  );
}
