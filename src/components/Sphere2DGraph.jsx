import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceDot,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip.jsx";
import "./Sphere2DGraph.css";

// props:
// 1) points: 실시간 데이터
// 2) currentIndex: 활성 점
// 3) pastData: 기존 기간별 데이터 (1개월, 3개월 등) → 실시간 차트에는 영향 없음
export default function Sphere2DGraph({ points, currentIndex, pastData }) {
  const bufferRef = useRef([]);
  const [realTimeData, setRealTimeData] = useState([]);

  // 버퍼에 실시간 points 추가
  useEffect(() => {
    if (!points || points.length === 0) return;
    bufferRef.current.push(...points);
  }, [points]);

  // 1초마다 버퍼 처리 + 5분 단위만 chartData에 추가
  useEffect(() => {
    const interval = setInterval(() => {
      if (bufferRef.current.length === 0) return;

      const buffer = [...bufferRef.current];
      bufferRef.current = [];

      // 장 시작부터 누적: dateKey 기준
      const mergedMap = new Map(realTimeData.map(d => [d.date, { ...d }]));

      buffer.forEach((p) => {
        const dateKey = p.date;
        const existing = mergedMap.get(dateKey);
        if (existing) {
          // 같은 5분 구간이면 가격 덮어쓰기 + volume 누적
          existing.price = Number(p.price) || existing.price;
          existing.volume += Math.max(0, Number(p.volume) || 0);
          existing.fluctuation_rate = Number(p.fluctuation_rate) || existing.fluctuation_rate;
        } else {
          mergedMap.set(dateKey, {
            date: dateKey,
            price: Number(p.price) || 0,
            open: Number(p.open) || 0,
            high: Number(p.high) || 0,
            low: Number(p.low) || 0,
            volume: Math.max(0, Number(p.volume) || 0),
            fluctuation_rate: Number(p.fluctuation_rate) || 0,
            active: false,
          });
        }
      });

      // Map → Array 변환 후 날짜 순 정렬
      const mergedArray = Array.from(mergedMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // currentIndex 적용
      if (currentIndex !== null && currentIndex >= 0) {
        mergedArray.forEach((d, i) => {
          d.active = i === currentIndex;
        });
      }

      setRealTimeData(mergedArray);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, realTimeData]);

  // 최소/최대값 계산
  const prices = useMemo(() => realTimeData.map(d => d.price).filter(v => !isNaN(v)), [realTimeData]);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const margin = (maxPrice - minPrice) * 0.1;

  // 실시간 데이터가 없으면 pastData로 표시 (기간별 차트)
  const displayData = realTimeData.length > 0 ? realTimeData : pastData || [];

  if (displayData.length === 0) {
    return (
      <div className="graph-wrapper" style={{ color: '#ccc', textAlign: 'center', padding: 30 }}>
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="graph-wrapper">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#191919" stopOpacity={1} />
              <stop offset="100%" stopColor="#191919" stopOpacity={1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" tick={false} />
          <YAxis
            domain={[minPrice - margin, maxPrice + margin]}
            tick={false}
            width={20}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={30} iconType="line" />

          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#colorPrice)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#191919' }}
            activeDot={{ r: 6, fill: '#191919' }}
            isAnimationActive={true}
          />

          {currentIndex !== null &&
            currentIndex >= 0 &&
            displayData[currentIndex] && (
              <ReferenceDot
                x={displayData[currentIndex].date}
                y={displayData[currentIndex].price}
                r={7}
                fill="red"
                stroke="white"
                strokeWidth={2}
                className="pulse-dot"
              />
            )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
