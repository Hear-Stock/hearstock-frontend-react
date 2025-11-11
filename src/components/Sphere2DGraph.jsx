import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { CustomTooltip } from './CustomTooltip.jsx';
import './Sphere2DGraph.css';

export default function Sphere2DGraph({ points, currentIndex }) {
  const [data, setData] = useState([]);
  const bufferRef = useRef([]);
  const lastUpdateRef = useRef(Date.now());

  // volume 안전 처리
  const safePoints = useMemo(() => {
    return points.map(p => ({
      ...p,
      volume: Math.max(0, Number(p.volume) || 0),
    }));
  }, [points]);

  // 버퍼에 쌓기
  useEffect(() => {
    bufferRef.current.push(...safePoints);

    const now = Date.now();
    if (now - lastUpdateRef.current > 1000) { // 초당 1번만 렌더링
      lastUpdateRef.current = now;

      // 중복 x값 제거: execution_time 기준 마지막 값으로 덮어쓰기
      const mergedDataMap = {};
      [...data, ...bufferRef.current].forEach(d => {
        mergedDataMap[d.execution_time] = d;
      });
      const mergedData = Object.values(mergedDataMap).sort((a, b) => a.execution_time - b.execution_time);

      setData(mergedData);
      bufferRef.current = [];
    }
  }, [safePoints, data]);

  // memo로 렌더링 최적화
  const chartData = useMemo(() => data, [data]);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="execution_time" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="current_price"
          stroke="url(#lineGradient)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
          isAnimationActive={true}
        />
        {currentIndex !== undefined && currentIndex < chartData.length && (
          <ReferenceDot
            x={chartData[currentIndex].execution_time}
            y={chartData[currentIndex].current_price}
            r={6}
            fill="red"
            stroke="none"
            isFront={true}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
