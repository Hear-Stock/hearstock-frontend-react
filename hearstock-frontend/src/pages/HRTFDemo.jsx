import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as Tone from 'tone';

function DraggableBall({ position, onDrag }) {
  const meshRef = useRef();
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const plane = useRef(new THREE.Plane());
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!isDragging) return;
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);

      if (meshRef.current) {
        const intersection = new THREE.Vector3();
        const planeNormal = new THREE.Vector3(0, 0, -1).applyQuaternion(
          camera.quaternion
        );
        plane.current.setFromNormalAndCoplanarPoint(
          planeNormal,
          meshRef.current.position
        );
        raycaster.current.ray.intersectPlane(plane.current, intersection);
        meshRef.current.position.copy(intersection);
        onDrag([intersection.x, intersection.y, intersection.z]);
      }
    };

    const handlePointerUp = () => setIsDragging(false);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, camera, gl, onDrag]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={() => setIsDragging(true)}
    >
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color={isDragging ? 'red' : 'orange'} />
    </mesh>
  );
}

function EmojiHuman() {
  const [sprite, setSprite] = useState(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.font = '800px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧍‍♀️', 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const spriteObj = new THREE.Sprite(material);
    spriteObj.scale.set(2, 2, 2);
    spriteObj.position.set(0, 0, 0);
    setSprite(spriteObj);
  }, []);

  return sprite ? <primitive object={sprite} /> : null;
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#eeeeee" />
    </mesh>
  );
}

function AxisLines() {
  const materialX = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const materialY = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const materialZ = new THREE.LineBasicMaterial({ color: 0x0000ff });

  const geometryX = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(2, 0, 0),
  ]);
  const geometryY = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -2, 0),
    new THREE.Vector3(0, 2, 0),
  ]);
  const geometryZ = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -2),
    new THREE.Vector3(0, 0, 2),
  ]);

  return (
    <>
      <line geometry={geometryX} material={materialX} />
      <line geometry={geometryY} material={materialY} />
      <line geometry={geometryZ} material={materialZ} />
    </>
  );
}

export default function HRTF3DController() {
  const [pos, setPos] = useState([0, 0, 0]);
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
    synth.triggerAttack('A4');

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
      const [x, y, z] = pos;
      pannerRef.current.positionX.value = x;
      pannerRef.current.positionY.value = y;
      pannerRef.current.positionZ.value = z;
    }
  }, [pos]);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <Canvas
        camera={{ position: [0, 2, 3], fov: 60 }}
        style={{ height: 500, width: '100%' }}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <GroundPlane />
        <AxisLines />
        <DraggableBall position={pos} onDrag={setPos} />
        <EmojiHuman />
      </Canvas>
      <div style={{ marginTop: '1rem' }}>
        {!isPlaying ? (
          <button onClick={handleStart}>🎧 소리 재생</button>
        ) : (
          <button onClick={handleStop}>⏹️ 소리 정지</button>
        )}
      </div>
    </div>
  );
}
