import React, { useRef } from 'react';
import * as Tone from 'tone';
import { sampleData } from '../data/sampleData';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SphereSoundPlayer() {
  const coords = convertToSphericalCoords(sampleData);

  // 좌표 스케일이 너무 크면 지터/클리핑 나기 쉬움 → 반경 정규화(필요 시)
  const normPoints = coords.map((p) => {
    const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
    const maxR = 1.5; // 청취자 기준 ±1.5 안쪽
    const s = Math.min(maxR / r, 1);
    return { ...p, x: p.x * s, y: p.y * s, z: p.z * s };
  });

  // 재사용 노드
  const startedRef = useRef(false);
  const pannerRef = useRef(null);
  const compRef = useRef(null);
  const limiterRef = useRef(null);
  const synthRef = useRef(null);

  const ensureGraph = async () => {
    await Tone.start();

    // 한 번만 초기화
    if (!startedRef.current) {
      // 마스터 체인: Synth -> Panner3D -> Compressor -> Limiter -> Destination
      limiterRef.current = new Tone.Limiter(-3).toDestination();
      compRef.current = new Tone.Compressor({
        threshold: -16,
        ratio: 3,
      }).connect(limiterRef.current);
      pannerRef.current = new Tone.Panner3D({
        panningModel: 'HRTF',
        distanceModel: 'inverse',
        rolloffFactor: 1.0,
        refDistance: 1.0,
        maxDistance: 25,
      }).connect(compRef.current);

      synthRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.02, // 너무 짧으면 클릭, 살짝 늘림
          decay: 0.08,
          sustain: 0.15,
          release: 0.18, // 릴리즈도 약간 여유
        },
        volume: -6, // 헤드룸 확보
      }).connect(pannerRef.current);

      // 청취자 위치/방향 초기화
      Tone.Listener.positionX.value = 0;
      Tone.Listener.positionY.value = 0;
      Tone.Listener.positionZ.value = 0;
      Tone.Listener.forwardX.value = 0;
      Tone.Listener.forwardY.value = 0;
      Tone.Listener.forwardZ.value = -1;

      startedRef.current = true;
    }
  };

  const handlePlay = async () => {
    await ensureGraph();
    const panner = pannerRef.current;
    if (!panner) return;
    const synth = synthRef.current;
    if (!synth) return;

    const now = Tone.now();
    const step = 0.12; // 노트 간격(초) — 겹치지 않게 적당히
    const moveRamp = 0.05; // 포지션 이동 램프 시간 — 점프 대신 부드럽게

    // 스케줄: 각 포인트를 미래 시간에 예약
    normPoints.forEach((p, i) => {
      const t = now + i * step;

      // 포지션 파라미터를 부드럽게 램프
      // (Tone.Param의 rampTo(value, rampTime, startTime))
      panner.positionX.rampTo(-p.x, moveRamp, t - moveRamp);
      panner.positionY.rampTo(p.y, moveRamp, t - moveRamp);
      panner.positionZ.rampTo(p.z, moveRamp, t - moveRamp);

      // 노트 발음 예약(길이 8n 대신 고정 길이도 안정적)
      synth.triggerAttackRelease(p.freq, 0.1, t);
    });
  };

  return (
    <div style={{ textAlign: 'center', margin: '1rem' }}>
      <button onClick={handlePlay} style={{ padding: '10px 20px' }}>
        🔊 재생 (Beep)
      </button>
    </div>
  );
}
