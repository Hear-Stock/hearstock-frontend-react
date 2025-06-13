import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

export default function EmojiHuman() {
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
