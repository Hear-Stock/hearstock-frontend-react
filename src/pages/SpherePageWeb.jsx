import React, { useEffect, useState } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SpherePageWeb() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  // Flutter → React 데이터 수신
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ baseUrl, code, period, market }) => {
      try {
        //const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const url = `${baseUrl}/api/stock/chart?code=${code}&period=${period}&market=${market}`;

        console.log('📡 Fetching from backend:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        console.log('sample row 0:', data[0]);
        console.log(JSON.stringify(data.slice(0, 5), null, 2));

        const mapped = data.map((d) => ({
          date: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          price: d.close,
          volume: d.volume,
          fluctuation_rate: d.fluctuation_rate,
        }));

        const sphereCoords = convertToSphericalCoords(mapped);
        setStockData(sphereCoords);
      } catch (err) {
        console.error('주가 데이터 요청 실패:', err);
      }
    };
  }, []);

  return (
    <div
      style={{
        background: '#191919',
        color: 'white',
        minHeight: '100vh',
        padding: 12,
        overflowX: 'hidden',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 2D 차트 */}
      {stockData.length > 0 ? (
        <Sphere2DGraph
          style={{ width: '100%', maxWidth: '100%' }}
          points={stockData}
          currentIndex={currentIndex}
          onPointHover={setCurrentIndex}
        />
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: '#999',
            padding: '80px 0',
          }}
        >
          데이터를 불러오는 중입니다...
        </div>
      )}

      {/* 사운드 플레이어 */}
      <div style={{ marginTop: 30 }}>
        <SphereSoundPlayer
          coords={stockData}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
      </div>
    </div>
  );
}
