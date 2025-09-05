import React, { useState } from 'react';
import SphereCoordsViewer from '../components/SphereCoordsViewer';
import Sphere3DScene from '../components/Sphere3DScene';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import Sphere2DGraph from '../components/Sphere2DGraph';

import { sampleData } from '../data/sampleData';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SpherePage() {
  const coords = convertToSphericalCoords(sampleData);
  const points = convertToSphericalCoords(sampleData);
  const [currentIndex, setCurrentIndex] = useState(null);

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ textAlign: 'center' }}>Sphere 좌표 결과</h2>
      <Sphere3DScene points={points} currentIndex={currentIndex} />
      <SphereSoundPlayer coords={coords} setCurrentIndex={setCurrentIndex} />
      <Sphere2DGraph points={points} currentIndex={currentIndex} />
      <SphereCoordsViewer coords={points} />
    </div>
  );
}
