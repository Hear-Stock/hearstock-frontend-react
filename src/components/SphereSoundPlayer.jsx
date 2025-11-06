import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

import './SphereSoundPlayer.css';

export default function SphereSoundPlayer({
  coords,
  currentIndex,
  setCurrentIndex,
}) {
  // 재사용 노드
  const pannerRef = useRef(null);
  const synthRef = useRef(null);
  const earlyConvRef = useRef(null);
  const earlyGainRef = useRef(null);
  const erDelayRef = useRef(null); // ER 프리딜레이
  const erSplitRef = useRef(null); // ER L/R 분리
  const erGainLRef = useRef(null); // ER Left 게인
  const erGainRRef = useRef(null); // ER Right 게인
  const erMergeRef = useRef(null); // ER Merge
  const lateRevRef = useRef(null); // 레이트 테일(아주 얕게)
  const lateGainRef = useRef(null);
  const busRef = useRef(null); // 마스터 버스
  const eqRef = useRef(null); // 고역 살짝 컷
  const initedRef = useRef(false);

  // 외재화 강도 상태 및 좌우 비대칭 스케일
  const [extLevel, setExtLevel] = useState('basic'); // 'low' | 'basic' | 'strong'
  const asymScaleRef = useRef(0.25); // 좌/우 비대칭 강도

  const [isPlaying, setIsPlaying] = useState(false); // 재생 중 UI 제어
  const abortRef = useRef(false);

  // 짧은 초기 반사 IR 생성기 (스테레오, 80~150ms 추천)
  const createEarlyReflectionsIR = (
    ctx,
    {
      durationMs = 120,
      taps = [
        { tMs: 8, gainL: 0.22, gainR: 0.18 },
        { tMs: 17, gainL: 0.16, gainR: 0.2 },
        { tMs: 31, gainL: 0.12, gainR: 0.11 },
        { tMs: 57, gainL: 0.08, gainR: 0.09 },
        { tMs: 93, gainL: 0.06, gainR: 0.05 },
      ],
      hfDamp = 0.85,
    } = {}
  ) => {
    const sr = ctx.sampleRate;
    const len = Math.round((durationMs / 1000) * sr);
    const buf = ctx.createBuffer(2, len, sr);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    for (const { tMs, gainL, gainR } of taps) {
      const n = Math.min(len - 2, Math.max(0, Math.round((tMs / 1000) * sr)));
      // 짧은 펄스 + 한 샘플 역상 성분(고역 약간 강조 후 hfDamp로 균형)
      L[n] += gainL;
      L[n + 1] += -gainL * (1 - hfDamp);
      R[n] += gainR;
      R[n + 1] += -gainR * (1 - hfDamp);
    }
    return buf;
  };

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      pannerRef.current?.dispose();
      earlyConvRef.current?.dispose();
      earlyGainRef.current?.dispose();
      erDelayRef.current?.dispose();
      erSplitRef.current?.dispose();
      erGainLRef.current?.dispose();
      erGainRRef.current?.dispose();
      erMergeRef.current?.dispose();
      lateRevRef.current?.dispose();
      lateGainRef.current?.dispose();
      busRef.current?.dispose();
      eqRef.current?.dispose();
    };
  }, []);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const ensureGraph = async () => {
    if (initedRef.current) return;
    await Tone.start();

    // 리스너 기준 좌표계(전방 z+, 위 y+)
    Tone.Listener.positionX.value = 0;
    Tone.Listener.positionY.value = 0;
    Tone.Listener.positionZ.value = 0;
    Tone.Listener.forwardX.value = 0;
    Tone.Listener.forwardY.value = 0;
    Tone.Listener.forwardZ.value = 1;
    Tone.Listener.upX.value = 0;
    Tone.Listener.upY.value = 1;
    Tone.Listener.upZ.value = 0;

    // 마스터 버스 + EQ
    const eq = new Tone.EQ3({ low: 0, mid: 0, high: -3 });
    const bus = new Tone.Gain(1);
    bus.connect(eq);
    eq.toDestination();

    // 패너(HRTF)
    const panner = new Tone.Panner3D({
      panningModel: 'HRTF',
      positionX: 0,
      positionY: 0,
      positionZ: 1.2,
      refDistance: 2.0,
      rolloffFactor: 2.0,
      distanceModel: 'exponential', //inverse , exponential
    });
    panner.connect(bus);

    // ----- ER(초기 반사) 경로 -----
    const erDelay = new Tone.Delay(0.004);
    const erConv = new Tone.Convolver();
    const erSplit = new Tone.Split();
    const erGainL = new Tone.Gain(1);
    const erGainR = new Tone.Gain(1);
    const erMerge = new Tone.Merge();
    const erWet = new Tone.Gain(0.12);

    // 소스 → (프리딜레이) → ER 컨볼버 → Split → (L/R) → Merge → Wet → Bus
    erDelay.connect(erConv);
    erConv.connect(erSplit);
    erSplit.connect(erGainL, 0, 0); // 채널 인덱스로 연결
    erSplit.connect(erGainR, 1, 0);
    erGainL.connect(erMerge, 0, 0);
    erGainR.connect(erMerge, 0, 1);
    erMerge.connect(erWet);
    erWet.connect(bus);

    // ----- Late(얕은 잔향) 경로 -----
    const lateRev = new Tone.Reverb({ decay: 0.6, preDelay: 0.02 });
    await lateRev.generate();
    const lateGain = new Tone.Gain(0.05);
    lateRev.connect(lateGain);
    lateGain.connect(bus);

    // 소스
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.6, release: 0.3 },
    });

    // Direct(HRTF) + ER + Late 병렬
    synth.connect(panner);
    synth.connect(erDelay);
    synth.connect(lateRev);

    // ER IR 버퍼(연결 완료 후 설정)
    const erBuf = createEarlyReflectionsIR(Tone.getContext().rawContext);
    erConv.buffer = erBuf;

    // ref에 한 번에 주입
    eqRef.current = eq;
    busRef.current = bus;
    pannerRef.current = panner;
    erDelayRef.current = erDelay;
    earlyConvRef.current = erConv;
    erSplitRef.current = erSplit;
    erGainLRef.current = erGainL;
    erGainRRef.current = erGainR;
    erMergeRef.current = erMerge;
    earlyGainRef.current = erWet;
    lateRevRef.current = lateRev;
    lateGainRef.current = lateGain;
    synthRef.current = synth;

    initedRef.current = true;
  };

  // 외재화 프리셋: 강도별 파라미터를 한 번에 적용
  const applyExternalizePresetLevel = (level = 'basic') => {
    // 프리셋 테이블
    const table = {
      low: {
        ref: 1.0,
        roll: 1.0,
        d: 0.8,
        late: 0.03,
        high: -0.5,
        asym: 0.18,
      },
      basic: {
        ref: 2.0,
        roll: 0.5,
        d: 1.5,
        late: 0.05,
        high: -1.0,
        asym: 0.25,
      },
      strong: {
        ref: 3.0,
        roll: 0.5,
        d: 3.0,
        late: 0.07,
        high: -1.8,
        asym: 0.32,
      },
    };
    const cfg = table[level] ?? table.basic;

    // 거리/감쇠 곡선
    const panner = pannerRef.current;
    if (panner) {
      panner.refDistance = cfg.ref;
      panner.rolloffFactor = cfg.roll;
      panner.positionZ.linearRampToValueAtTime(cfg.d, Tone.now() + 0.1);
    }

    // 잔향과 EQ
    lateGainRef.current?.gain.rampTo(cfg.late, 0.2);
    eqRef.current?.high.rampTo(cfg.high, 0.2);

    // 좌/우 공간 비대칭
    asymScaleRef.current = cfg.asym;
  };

  /* 슬라이더에서 한 점만 재생하는 함수 */
  const playSingleTone = async (index) => {
    await ensureGraph();
    const p = coords[index];
    const synth = synthRef.current;
    const panner = pannerRef.current;
    if (!synth || !panner || !p) return;

    // 현재 인덱스 갱신
    setCurrentIndex(index);

    // 이전 음이 계속 이어지지 않게 즉시 끊고 새로 재생
    synth.triggerRelease();
    const t = Tone.now() + 0.03;
    panner.positionX.linearRampToValueAtTime(p.x, t);
    panner.positionY.linearRampToValueAtTime(p.y, t);
    panner.positionZ.linearRampToValueAtTime(-p.z, t);
    synth.triggerAttackRelease(p.freq, 0.1);
  };

  /** 슬라이더 이동 핸들러 */
  const handleSliderChange = (val) => {
    const idx = Math.max(0, Math.min(coords.length - 1, val));
    playSingleTone(idx);
  };

  const handlePlay = async () => {
    await ensureGraph();

    if (isPlaying) return; // 이미 재생 중이면 무시
    abortRef.current = false; // 새로운 플레이 시작
    setIsPlaying(true); // 버튼 상태 업데이트

    const panner = pannerRef.current;
    const synth = synthRef.current;
    if (!panner || !synth) return;

    applyExternalizePresetLevel(extLevel); // 선택된 강도 적용

    try {
      for (let i = 0; i < coords.length; i++) {
        if (abortRef.current) break;

        const p = coords[i];
        setCurrentIndex(i);

        const t = Tone.now() + 0.06;
        panner.positionX.linearRampToValueAtTime(p.x, t);
        panner.positionY.linearRampToValueAtTime(p.y, t);
        panner.positionZ.linearRampToValueAtTime(-p.z, t);

        // 거리 기반 프리딜레이 + 좌/우 비대칭
        const dist = Math.max(0.6, Math.min(2.5, Math.hypot(p.x, p.y, p.z)));
        const preDelay = dist / 343; // s
        erDelayRef.current?.delayTime.rampTo(preDelay, 0.08);

        const azApprox = Math.max(
          -1,
          Math.min(1, p.x / (Math.abs(p.z) + 1e-3))
        );
        const asym = asymScaleRef.current; // 프리셋 반영
        erGainLRef.current?.gain.rampTo(1 - asym * azApprox, 0.08);
        erGainRRef.current?.gain.rampTo(1 + asym * azApprox, 0.08);

        synth.triggerAttackRelease(p.freq, 0.1);
        await sleep(500);
        if (abortRef.current) break;
      }
    } finally {
      setCurrentIndex(null);
      setIsPlaying(false); // 재생 상태 해제
    }
  };

  const handleStop = () => {
    // 종료 핸들러
    abortRef.current = true; // 루프 즉시 중단
    // 현재 음이 남았더라도 빠르게 감쇄되게 살짝 줄여줌(선택)
    // earlyGainRef.current?.gain.rampTo(0, 0.05);
    // lateGainRef.current?.gain.rampTo(0, 0.05);
    try {
      synthRef.current?.triggerRelease?.();
    } catch (_) {}
  };

  // UI: 외재화 강도 토글 버튼들
  const onClickPreset = async (level) => {
    setExtLevel(level);
    // 그래프가 이미 준비됐다면 즉시 적용(재생 중/전 둘 다 반영)
    if (initedRef.current) {
      await ensureGraph(); // 안전; 이미 init이면 즉시 return
      applyExternalizePresetLevel(level);
    }
  };

  return (
    <div className="sound-player">
      {/* 외재화 프리셋 버튼 */}
      <div className="preset-buttons">
        {['low', 'basic', 'strong'].map((level) => (
          <button
            key={level}
            className={`preset-btn ${extLevel === level ? 'active' : ''}`}
            onClick={() => onClickPreset(level)}
          >
            {level === 'low'
              ? '외재화: 가까이'
              : level === 'basic'
              ? '외재화: 기본'
              : '외재화: 멀리'}
          </button>
        ))}
      </div>

      {/* 전체 재생 / 정지 */}
      <div className="control-buttons">
        <button className="play-btn" onClick={handlePlay} disabled={isPlaying}>
          전체 재생
        </button>
        <button className="play-btn" onClick={handleStop}>
          정지
        </button>
      </div>

      {/* 인덱스 슬라이더 */}
      <div className="slider-section">
        {/* <div className="slider-label">
          <p>
            {Number.isFinite(currentIndex)
              ? `현재 인덱스: ${currentIndex + 1}/${coords.length}`
              : `현재 인덱스: 0/${coords.length}`}
          </p>
        </div> */}

        <div className="slider-box">
          <input
            type="range"
            min="0"
            max={coords.length - 1}
            value={currentIndex ?? 0}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="slider-extended"
          />
        </div>
      </div>
    </div>
  );
}
