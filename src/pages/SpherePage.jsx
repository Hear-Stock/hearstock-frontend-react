import React, { useState } from 'react';
import SphereCoordsViewer from '../components/SphereCoordsViewer';
// import Sphere3DScene from '../components/Sphere3DScene';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import Sphere2DGraph from '../components/Sphere2DGraph';
import { sampleData } from '../data/sampleData';
import { convertToSphericalCoords } from '../utils/sphereUtils';

import './SpherePage.css';

export default function SpherePage() {
  const coords = convertToSphericalCoords(sampleData);
  const points = convertToSphericalCoords(sampleData);
  const [currentIndex, setCurrentIndex] = useState(null);

  return (
    <div className="sphere-container">
      <div className="sphere-left">
        <SphereSoundPlayer
          coords={coords}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      </div>
      <div className="sphere-center">
        {/* <Sphere3DScene points={points} currentIndex={currentIndex} /> */}
        <Sphere2DGraph points={points} currentIndex={currentIndex} />
      </div>
      <div className="sphere-right">
        <SphereCoordsViewer coords={points} />
      </div>
    </div>
  );
}
