import React, { useEffect, useState, useMemo } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SpherePageWeb() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [rawData, setRawData] = useState([]);

  let socket = null;

  // Flutter → React 데이터 수신
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ baseUrl, code, period, market }) => {
      try {
        // 만약 이전 websocket 살아있으면 닫기
        if (socket) {
          socket.close();
          socket = null;
        }

        // period가 'current_price'인 경우: WebSocket 사용
        if (period === 'current_price') {
          const wsUrl = `wss://${baseUrl.replace(
            /^https?:\/\//,
            ''
          )}/api/stock/ws/trade-price`;
          console.log('🔌 Connecting to WebSocket:', wsUrl);

          const socket = new WebSocket(wsUrl);

          socket.onopen = () => {
            console.log('WebSocket connected');
            socket.send(JSON.stringify({ action: 'subscribe', code }));
          };

          socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log('Live Data:', msg);

            const { current_price, fluctuation_rate, volume } = msg;

            setRawData((prev) => [
              ...prev.slice(-99), // 최근 100개만 유지
              {
                timestamp: Date.now(),
                open: current_price,
                high: current_price,
                low: current_price,
                close: current_price,
                volume,
                fluctuation_rate,
              },
            ]);
          };

          socket.onerror = (err) => console.error('WebSocket error:', err);
          socket.onclose = () => console.log('WebSocket closed');

          return; // WebSocket 모드일 땐 fetch 생략
        } else {
          // 일반 모드: 기존 REST API 사용
          const url = `${baseUrl}/api/stock/chart?code=${code}&period=${period}&market=${market}`;

          console.log('📡 Fetching from backend:', url);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          console.log('sample row 0:', data[0]);
          console.log(JSON.stringify(data.slice(0, 5), null, 2));

          const mapped = data.map((d) => ({
            timestamp: d.timestamp,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            fluctuation_rate: d.fluctuation_rate,
          }));
          setRawData(mapped);
        }
      } catch (err) {
        console.error('주가 데이터 요청 실패:', err);
      }
    };
  }, []);

  const sphereCoords = useMemo(
    () => convertToSphericalCoords(rawData),
    [rawData]
  );

  useEffect(() => {
    setStockData(sphereCoords);
  }, [sphereCoords]);

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
