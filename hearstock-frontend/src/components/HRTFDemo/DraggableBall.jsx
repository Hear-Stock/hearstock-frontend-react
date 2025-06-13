import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function DraggableBall({ position, onDrag, disableOrbit }) {
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
        console.log(
          '공 위치:',
          intersection.x.toFixed(2),
          intersection.y.toFixed(2),
          intersection.z.toFixed(2)
        );
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      disableOrbit.current = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, camera, gl, onDrag, disableOrbit]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={() => {
        setIsDragging(true);
        disableOrbit.current = true;
      }}
    >
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color={isDragging ? 'red' : 'orange'} />
    </mesh>
  );
}
