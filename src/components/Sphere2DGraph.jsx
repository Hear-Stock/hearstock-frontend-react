import React, { useMemo } from 'react';
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
} from 'recharts';
import './Sphere2DGraph.css';
import { CustomTooltip } from './CustomTooltip.jsx';

export default function Sphere2DGraph({ points, currentIndex }) {
  // ✅ 안전하게 데이터 정리
  const data = useMemo(() => {
    if (!points || points.length === 0) return [];

    // 1️⃣ 너무 많은 점 제한 (최신 100개만 유지)
    const limited = points.slice(-100);

    // 2️⃣ 최신 데이터가 오른쪽에 오도록 정렬
    return limited
      .map((p, i) => ({
        date: p.date ?? i.toString(),
        price: Number(p.price) || 0,
        open: Number(p.open) || 0,
        high: Number(p.high) || 0,
        low: Number(p.low) || 0,
        volume: Number(p.volume) || 0,
        fluctuation_rate: Number(p.fluctuation_rate) || 0,
        active: i === currentIndex,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // 날짜 순 정렬
  }, [points, currentIndex]);

  if (data.length === 0) {
    return (
      <div
        className="graph-wrapper"
        style={{ color: '#ccc', textAlign: 'center', padding: 30 }}
      >
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  // ✅ 최소, 최대값 계산 (안정성 확보)
  const prices = data.map((d) => d.price).filter((v) => !isNaN(v));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const margin = (maxPrice - minPrice) * 0.1;

  return (
    <div className="graph-wrapper">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#191919" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#191919" stopOpacity={0.1} />
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

          {currentIndex !== null && currentIndex >= 0 && (
            <ReferenceDot
              x={data[currentIndex]?.date}
              y={data[currentIndex]?.price}
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
