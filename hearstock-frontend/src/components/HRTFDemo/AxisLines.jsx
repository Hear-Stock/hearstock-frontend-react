import React from 'react';
import * as THREE from 'three';

export default function AxisLines() {
  const createAxisLabel = (text, position, color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.font = '80px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.5, 0.5);
    sprite.position.set(...position);
    return <primitive object={sprite} />;
  };

  return (
    <>
      <line
        geometry={new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-2, 0, 0),
          new THREE.Vector3(2, 0, 0),
        ])}
        material={new THREE.LineBasicMaterial({ color: 0xff0000 })}
      />
      <line
        geometry={new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, -2, 0),
          new THREE.Vector3(0, 2, 0),
        ])}
        material={new THREE.LineBasicMaterial({ color: 0x00ff00 })}
      />
      <line
        geometry={new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, -2),
          new THREE.Vector3(0, 0, 2),
        ])}
        material={new THREE.LineBasicMaterial({ color: 0x0000ff })}
      />

      {createAxisLabel('+X', [2.2, 0, 0], 'red')}
      {createAxisLabel('-X', [-2.2, 0, 0], 'red')}
      {createAxisLabel('+Y', [0, 2.2, 0], 'green')}
      {createAxisLabel('-Y', [0, -2.2, 0], 'green')}
      {createAxisLabel('+Z', [0, 0, 2.2], 'blue')}
      {createAxisLabel('-Z', [0, 0, -2.2], 'blue')}
    </>
  );
}
