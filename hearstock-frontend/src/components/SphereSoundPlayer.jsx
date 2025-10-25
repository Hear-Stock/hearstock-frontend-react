import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export default function SphereSoundPlayer({ coords, setCurrentIndex }) {
  const pannerRef = useRef(null);
  const synthRef = useRef(null);
  const synthGainRef = useRef(null);
  const earlyConvRef = useRef(null);
  const earlyGainRef = useRef(null);
  const erDelayRef = useRef(null);
  const erSplitRef = useRef(null);
  const erGainLRef = useRef(null);
  const erGainRRef = useRef(null);
  const erMergeRef = useRef(null);
  const lateRevRef = useRef(null);
  const lateGainRef = useRef(null);
  const busRef = useRef(null);
  const eqRef = useRef(null);
  const initedRef = useRef(false);

  const [extLevel, setExtLevel] = useState('basic');
  const asymScaleRef = useRef(0.25);
  const [isPlaying, setIsPlaying] = useState(false);
  const abortRef = useRef(false);
  const prevValueRef = useRef(coords[0]?.freq || 0); // 이전 값 저장

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
      synthGainRef.current?.dispose();
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

    Tone.Listener.positionX.value = 0;
    Tone.Listener.positionY.value = 0;
    Tone.Listener.positionZ.value = 0;
    Tone.Listener.forwardX.value = 0;
    Tone.Listener.forwardY.value = 0;
    Tone.Listener.forwardZ.value = 1;
    Tone.Listener.upX.value = 0;
    Tone.Listener.upY.value = 1;
    Tone.Listener.upZ.value = 0;

    const eq = new Tone.EQ3({ low: 0, mid: 0, high: -3 });
    const bus = new Tone.Gain(1);
    bus.connect(eq);
    eq.toDestination();

    const panner = new Tone.Panner3D({
      panningModel: 'HRTF',
      positionX: 0,
      positionY: 0,
      positionZ: 1.2,
      refDistance: 2.0,
      rolloffFactor: 2.0,
      distanceModel: 'exponential',
    });
    panner.connect(bus);

    const erDelay = new Tone.Delay(0.004);
    const erConv = new Tone.Convolver();
    const erSplit = new Tone.Split();
    const erGainL = new Tone.Gain(1);
    const erGainR = new Tone.Gain(1);
    const erMerge = new Tone.Merge();
    const erWet = new Tone.Gain(0.12);
    erDelay.connect(erConv);
    erConv.connect(erSplit);
    erSplit.connect(erGainL, 0, 0);
    erSplit.connect(erGainR, 1, 0);
    erGainL.connect(erMerge, 0, 0);
    erGainR.connect(erMerge, 0, 1);
    erMerge.connect(erWet);
    erWet.connect(bus);

    const lateRev = new Tone.Reverb({ decay: 0.6, preDelay: 0.02 });
    await lateRev.generate();
    const lateGain = new Tone.Gain(0.05);
    lateRev.connect(lateGain);
    lateGain.connect(bus);

    const synth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.6, release: 0.3 },
    });

    const synthGain = new Tone.Gain(0.005); // 초기 거의 안 들리는 값
    synth.connect(synthGain);
    synthGain.connect(panner);

    synth.connect(erDelay);
    synth.connect(lateRev);

    const erBuf = createEarlyReflectionsIR(Tone.getContext().rawContext);
    erConv.buffer = erBuf;

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
    synthGainRef.current = synthGain;

    initedRef.current = true;
  };

  const applyExternalizePresetLevel = (level = 'basic') => {
    const table = {
      low: { d: 1.1, er: 0.1, late: 0.035, high: -0.8, asym: 0.18 },
      basic: { d: 1.3, er: 0.12, late: 0.05, high: -1.2, asym: 0.25 },
      strong: { d: 1.6, er: 0.16, late: 0.065, high: -1.8, asym: 0.32 },
    };
    const cfg = table[level] ?? table.basic;

    earlyGainRef.current?.gain.rampTo(cfg.er, 0.1);
    lateGainRef.current?.gain.rampTo(cfg.late, 0.2);
    eqRef.current?.high.rampTo(cfg.high, 0.2);
    pannerRef.current?.positionZ.linearRampToValueAtTime(cfg.d, Tone.now() + 0.1);
    asymScaleRef.current = cfg.asym;
  };

  const handlePlay = async () => {
    await ensureGraph();
    if (isPlaying) return;
    abortRef.current = false;
    setIsPlaying(true);

    const panner = pannerRef.current;
    const synth = synthRef.current;
    const synthGain = synthGainRef.current;
    if (!panner || !synth || !synthGain) return;

    applyExternalizePresetLevel(extLevel);

    try {
      for (let i = 0; i < coords.length; i++) {
        if (abortRef.current) break;
        const p = coords[i];
        setCurrentIndex(i);

        const t = Tone.now() + 0.06;
        panner.positionX.linearRampToValueAtTime(p.x, t);
        panner.positionY.linearRampToValueAtTime(p.y, t);
        panner.positionZ.linearRampToValueAtTime(-p.z, t);

        const dist = Math.max(0.6, Math.min(2.5, Math.hypot(p.x, p.y, p.z)));
        const preDelay = dist / 343;
        erDelayRef.current?.delayTime.rampTo(preDelay, 0.08);

        const azApprox = Math.max(-1, Math.min(1, p.x / (Math.abs(p.z) + 1e-3)));
        const asym = asymScaleRef.current;
        erGainLRef.current?.gain.rampTo(1 - asym * azApprox, 0.08);
        erGainRRef.current?.gain.rampTo(1 + asym * azApprox, 0.08);

        // ✅ 상대 변화 기반 Gain 조정
        const delta = p.freq - prevValueRef.current;
        let currentGain = synthGain.gain.value;
        const gainChangeSpeed = 0.002; // 체감 속도 조절
        currentGain += delta * gainChangeSpeed;
        currentGain = Math.max(0.005, Math.min(1.0, currentGain));
        synthGain.gain.rampTo(currentGain, 0.05);

        prevValueRef.current = p.freq;

        synth.triggerAttackRelease(p.freq, 0.25);
        await sleep(200);
        if (abortRef.current) break;
      }
    } finally {
      setCurrentIndex(null);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    abortRef.current = true;
    try {
      synthRef.current?.triggerRelease?.();
    } catch (_) {}
  };

  const onClickPreset = async (level) => {
    setExtLevel(level);
    if (initedRef.current) {
      await ensureGraph();
      applyExternalizePresetLevel(level);
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '1rem' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => onClickPreset('low')} style={{ padding: '6px 12px', borderRadius: 8, background: extLevel === 'low' ? '#e9f5ff' : '#f2f2f2' }}>외재화: 낮음</button>
        <button onClick={() => onClickPreset('basic')} style={{ padding: '6px 12px', borderRadius: 8, background: extLevel === 'basic' ? '#e9f5ff' : '#f2f2f2' }}>외재화: 기본</button>
        <button onClick={() => onClickPreset('strong')} style={{ padding: '6px 12px', borderRadius: 8, background: extLevel === 'strong' ? '#e9f5ff' : '#f2f2f2' }}>외재화: 강함</button>
      </div>

      <button onClick={handlePlay} style={{ padding: '10px 20px' }}>🔊 재생 (Beep)</button>
      <button onClick={handleStop} disabled={!isPlaying} style={{ padding: '10px 20px', borderRadius: 8, opacity: !isPlaying ? 0.6 : 1 }} title={!isPlaying ? '재생 중이 아닙니다' : '정지'}>⏹ 종료</button>
    </div>
  );
}
