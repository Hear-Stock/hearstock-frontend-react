import React, { useEffect, useState, useMemo, useRef } from 'react';
import Sphere2DGraph from '../components/Sphere2DGraph';
import SphereSoundPlayer from '../components/SphereSoundPlayer';
import { convertToSphericalCoords } from '../utils/sphereUtils';

export default function SpherePageWeb() {
  const [stockData, setStockData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [rawData, setRawData] = useState([]);

  // WebSocket 참조 저장
  const wsRef = useRef(null);

  // 최근 100개 데이터 유지 + 안전하게 업데이트
  const handleLiveData = (msg) => {
    setRawData((prev) => {
      const last = prev[prev.length - 1] || {};
      const newData = {
        timestamp: Date.now(),
        open: msg.current_price,
        high: msg.current_price > last.high ? msg.current_price : last.high ?? msg.current_price,
        low: msg.current_price < last.low ? msg.current_price : last.low ?? msg.current_price,
        close: msg.current_price,
        volume: msg.volume ?? last.volume ?? 0,
        fluctuation_rate: msg.fluctuation_rate ?? last.fluctuation_rate ?? 0,
      };
      return [...prev.slice(-99), newData];
    });
  };

  // Flutter → React 실시간 데이터 수신
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

  // Flutter → React 일반 데이터 / WebSocket 모드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.updateStockChart = async ({ baseUrl, code, period, market }) => {
      // live 모드면 WebSocket 연결
      if (period === 'live') {
        if (wsRef.current) {
          console.log('WebSocket 이미 연결되어 있음.');
          return;
        }

        const wsUrl = `wss://${baseUrl.replace(/^https?:\/\//, '')}/api/stock/ws/trade-price`;
        console.log('🔌 Connecting to WebSocket:', wsUrl);

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connected');
          socket.send(JSON.stringify({ action: 'subscribe', code }));
        };

        socket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          console.log('WebSocket 실시간 데이터:', msg);
          handleLiveData(msg);
        };

        socket.onerror = (err) => console.error('WebSocket error:', err);
        socket.onclose = () => {
          console.log('WebSocket closed');
          wsRef.current = null;
        };
        return;
      }

      // 일반 모드: REST API 호출
      try {
        const url = `${baseUrl}/api/stock/chart?code=${code}&period=${period}&market=${market}`;
        console.log('📡 Fetching from backend:', url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
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
      } catch (err) {
        console.error('주가 데이터 요청 실패:', err);
      }
    };
  }, []);

  // rawData → 3D 좌표 변환
  const sphereCoords = useMemo(() => convertToSphericalCoords(rawData), [rawData]);

  // sphereCoords → 2D 차트 데이터
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
