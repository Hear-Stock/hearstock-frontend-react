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
import { CustomTooltip } from './CustomTooltip.jsx';

export default function Sphere2DGraph({ points, currentIndex }) {
  const data = points.map((p, i) => ({
    date: p.date,
    price: p.price,
    open: p.open,
    high: p.high,
    low: p.low,
    volume: p.volume,
    fluctuation_rate: p.fluctuation_rate,
    active: i === currentIndex,
  }));

  // 최소, 최대값 계산
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const margin = (maxPrice - minPrice) * 0.1; // 위아래 10% 여유

  return (
    <div className="graph-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 30, bottom: 0 }}
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
            width={0}
            tickFormatter={(v) => v.toLocaleString()} // 천단위 구분
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
