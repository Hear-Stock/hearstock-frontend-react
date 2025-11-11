import React, { useEffect, useState, useMemo, useRef } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SpherePageWeb() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [rawData, setRawData] = useState([]);

  const wsRef = useRef(null);

  // 실시간 데이터 추가
  const handleLiveData = (msg) => {
    setRawData((prev) => {
      const last = prev[prev.length - 1] || {};
      const price = msg.current_price ?? last.close ?? 0;
      const newData = {
        timestamp: Date.now(),
        date: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        open: msg.open ?? last.open ?? price,
        high: Math.max(msg.high ?? price, last.high ?? price),
        low: Math.min(msg.low ?? price, last.low ?? price),
        close: price,
        price: price,
        volume: msg.volume ?? last.volume ?? 0,
        fluctuation_rate: msg.fluctuation_rate ?? last.fluctuation_rate ?? 0,
      };
      // 최근 100개만 유지
      return [...prev.slice(-99), newData];
    });
  };

  // Flutter → 실시간 데이터
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateRealTime = (data) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        handleLiveData(msg);
      } catch (e) {
        console.error('실시간 데이터 처리 실패:', e);
      }
    };
  }, []);

  // Flutter → 일반 / 실시간 데이터 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ baseUrl, code, period, market }) => {
      // WebSocket 연결 닫기 (그래프 전환 시)
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (period === 'live') {
        // 초기화
        setRawData([]);

        const wsUrl = `wss://${baseUrl.replace(/^https?:\/\//, '')}/api/stock/ws/trade-price`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connected');
          socket.send(JSON.stringify({ action: 'subscribe', code }));
        };

        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          handleLiveData(msg);
        };

        socket.onerror = (err) => console.error('WebSocket error:', err);
        socket.onclose = () => {
          console.log('WebSocket closed');
          wsRef.current = null;
        };
        return;
      }

      // 일반 차트 모드
      try {
        const url = `${baseUrl}/api/stock/chart?code=${code}&period=${period}&market=${market}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const mapped = data.map((d) => ({
          timestamp: d.timestamp,
          date: new Date(d.timestamp).toLocaleDateString('ko-KR'),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          price: d.close, // ✅ 공통 key
          volume: d.volume,
          fluctuation_rate: d.fluctuation_rate,
        }));
        setRawData(mapped);
      } catch (err) {
        console.error('주가 데이터 요청 실패:', err);
      }
    };
  }, []);

  // rawData → 변환
  const sphereCoords = useMemo(() => convertToSphericalCoords(rawData), [rawData]);

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
