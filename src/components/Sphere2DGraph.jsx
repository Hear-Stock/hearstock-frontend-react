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
  // 시간순 정렬 (왼쪽=과거, 오른쪽=현재)
  const sortedPoints = [...points].sort((a, b) => a.date - b.date);

  const data = sortedPoints.map((p, i) => ({
    date: p.date,
    price: p.price,
    open: p.open,
    high: p.high,
    low: p.low,
    volume: p.volume,
    fluctuation_rate: p.fluctuation_rate,
    active: i === currentIndex,
  }));

  const prices = data.map((d) => d.price);
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
              <stop offset="0%" stopColor="#00c6ff" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#0072ff" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={false}
          />
          <YAxis
            domain={[minPrice - margin, maxPrice + margin]}
            tick={false}
            width={20}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={30} iconType="line" />

          <Line
            type="monotone"
            dataKey="price"
            stroke="url(#colorPrice)"
            strokeWidth={2.5}
            dot={false} // ✅ 점 너무 많으니까 제거
            activeDot={{ r: 6, fill: '#FFD700' }}
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
