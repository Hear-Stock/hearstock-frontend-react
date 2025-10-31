import React from 'react';
import './SphereCoordsViewer.css';

export default function SphereCoordsViewer({ coords }) {
  return (
    <div className="sphere-coords-container">
      <div className="table-wrapper">
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
                <td>{point.x.toFixed(3)}</td>
                <td>{point.y.toFixed(3)}</td>
                <td>{point.z.toFixed(3)}</td>
                <td>{point.theta.toFixed(3)}</td>
                <td>{point.phi.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
