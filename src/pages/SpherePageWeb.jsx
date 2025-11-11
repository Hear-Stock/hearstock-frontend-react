import React, { useEffect, useState, useMemo, useRef } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SpherePageWeb() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [rawData, setRawData] = useState([]);

  const wsRef = useRef(null);
  const lastUpdateRef = useRef(0); // 데이터 과도 업데이트 방지용

  // 실시간 데이터 처리
  const handleLiveData = (msg) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) return; // 1초 간격으로만 반영
    lastUpdateRef.current = now;

    setRawData((prev) => {
      const last = prev[prev.length - 1] || {};
      const newData = {
        date: now, // X축으로 사용할 timestamp
        open: msg.current_price,
        high: Math.max(msg.current_price, last.high ?? msg.current_price),
        low: Math.min(msg.current_price, last.low ?? msg.current_price),
        close: msg.current_price,
        price: msg.current_price,
        volume: msg.volume ?? last.volume ?? 0,
        fluctuation_rate: msg.fluctuation_rate ?? last.fluctuation_rate ?? 0,
      };

      // 최대 100개까지만 유지
      return [...prev.slice(-99), newData];
    });
  };

  // Flutter에서 보내는 실시간 데이터 수신
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateRealTime = (data) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Flutter 실시간 데이터 수신:', msg);
        handleLiveData(msg);
      } catch (e) {
        console.error('실시간 데이터 처리 실패:', e);
      }
    };
  }, []);

  // 주식 차트 데이터 로딩 + 실시간 WebSocket 연결 관리
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ baseUrl, code, period, market }) => {
      // ✅ 기존 WebSocket 연결 종료
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        console.log('기존 WebSocket 연결 종료');
      }

      // ✅ 실시간 모드
      if (period === 'live') {
        setRawData([{
          date: Date.now(),
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          price: 0,
          volume: 0,
          fluctuation_rate: 0,
        }]);

        const wsUrl = `wss://${baseUrl.replace(/^https?:\/\//, '')}/api/stock/ws/trade-price`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connected');
          socket.send(JSON.stringify({ action: 'subscribe', code }));
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleLiveData(msg);
          } catch (e) {
            console.error('WebSocket 데이터 파싱 실패:', e);
          }
        };

        socket.onerror = (err) => console.error('WebSocket error:', err);
        socket.onclose = () => {
          console.log('WebSocket closed');
          wsRef.current = null;
        };
        return;
      }

      // ✅ 과거 데이터 로딩 (fetch)
      try {
        const url = `${baseUrl}/api/stock/chart?code=${code}&period=${period}&market=${market}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = data.map((d) => ({
          date: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          price: d.close,
          volume: d.volume,
          fluctuation_rate: d.fluctuation_rate,
        }));
        setRawData(mapped);
      } catch (err) {
        console.error('주가 데이터 요청 실패:', err);
      }
    };

    // ✅ 페이지 언마운트 시 WebSocket 정리
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        console.log('페이지 언마운트로 WebSocket 종료');
      }
    };
  }, []);

  // 좌표 변환
  const sphereCoords = useMemo(() => convertToSphericalCoords(rawData), [rawData]);
  useEffect(() => setStockData(sphereCoords), [sphereCoords]);

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
