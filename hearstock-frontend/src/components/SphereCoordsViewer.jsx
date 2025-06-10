import React from 'react';
import './SphereCoordsViewer.css';

export default function SphereCoordsViewer({ coords }) {
  // const coords = convertToSphericalCoords(sampleData);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Sphere Coordinates from JSON</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
            <th>x</th>
            <th>y</th>
            <th>z</th>
            <th>θ (theta)</th>
            <th>φ (phi)</th>
          </tr>
        </thead>
        <tbody>
          {coords.map((point, idx) => (
            <tr key={idx}>
              <td>{point.date}</td>
              <td>{point.price}</td>
              <td>{point.x}</td>
              <td>{point.y}</td>
              <td>{point.z}</td>
              <td>{point.theta}</td>
              <td>{point.phi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
