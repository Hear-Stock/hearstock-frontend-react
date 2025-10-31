import React from 'react';
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

export default function Sphere2DGraph({ points, currentIndex }) {
  const data = points.map((p, i) => ({
    date: p.date,
    price: p.price,
    active: i === currentIndex,
  }));

  // 최소, 최대값 계산
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const margin = (maxPrice - minPrice) * 0.1; // 위아래 10% 여유

  return (
    <div className="graph-wrapper">
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1976d2" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#1976d2" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />

          {/* ✅ Y축: 자동 스케일링 (0부터 시작 X) */}
          <YAxis
            domain={[minPrice - margin, maxPrice + margin]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v.toLocaleString()} // 천단위 구분
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '10px',
              border: '1px solid #ddd',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            labelStyle={{ fontWeight: 600, color: '#333' }}
            formatter={(value) => [`₩${value.toLocaleString()}`, 'Price']}
          />

          <Legend verticalAlign="top" height={30} iconType="line" />

          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#colorPrice)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#1976d2' }}
            activeDot={{ r: 6, fill: '#1976d2' }}
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
