import React, { useEffect, useState } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';

export default function SpherePageWebView() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  // Flutter → React 통신 함수 등록
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ code, period, market }) => {
      try {
        const fullCode = code.includes('.') ? code : `${code}.KS`;
        const url = `/api/stock/chart?code=${fullCode}&period=${period}&market=${market}`;

        console.log('Fetching:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        console.log('받아온 주가 데이터:', data);

        setStockData(
          data.map((d) => ({
            date: d.date,
            price: d.close, // 종가 기준
            volume: d.volume,
            rate: d.fluctuation_rate,
          }))
        );
      } catch (err) {
        console.error('주가 데이터 요청 실패:', err);
      }
    };

    return () => {
      delete window.updateStockChart;
    };
  }, []);

  return (
    <div
      style={{
        background: '#121212',
        color: 'white',
        minHeight: '100vh',
        padding: 20,
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
        📊 Stock Sound Chart
      </h2>

      {/* 2D 차트 */}
      <Sphere2DGraph points={stockData} currentIndex={currentIndex} />

      {/* 사운드 플레이어 */}
      <SphereSoundPlayer coords={stockData} setCurrentIndex={setCurrentIndex} />
    </div>
  );
}
