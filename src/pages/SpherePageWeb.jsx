import React, { useEffect, useState } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';

export default function SpherePageWeb() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [metaInfo, setMetaInfo] = useState({
    code: '',
    period: '',
    market: '',
  });

  // Flutter → React 데이터 수신
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ code, period, market }) => {
      try {
        setMetaInfo({ code, period, market });

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const url = `${baseUrl}/api/stock/chart?code=${code}&period=${period}&market=${market}`;

        console.log('📡 Fetching from backend:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        console.log('받아온 주가 데이터:', data);

        setStockData(
          data.map((d) => ({
            date: d.date,
            price: d.close, // 종가
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
        overflowX: 'hidden',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 8 }}>
        📊 Stock Sound Chart
      </h2>

      {metaInfo.code && (
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: 20 }}>
          {metaInfo.market} | {metaInfo.code} | 기간: {metaInfo.period}
        </p>
      )}

      {/* 2D 차트 */}
      {stockData.length > 0 ? (
        <Sphere2DGraph
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
