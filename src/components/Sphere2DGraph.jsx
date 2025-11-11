import React, { useState, useRef, useEffect, useMemo } from 'react';
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

export default function Sphere2DGraph({ points, currentIndex, pastData }) {
  const bufferRef = useRef([]);
  const [data, setData] = useState([]);

  // 초기 과거 데이터 (장 시작부터)
  useEffect(() => {
    if (pastData && pastData.length > 0) {
      const initialData = pastData.map((p) => ({
        date: p.date,
        price: Number(p.price) || 0,
        open: Number(p.open) || 0,
        high: Number(p.high) || 0,
        low: Number(p.low) || 0,
        volume: Math.max(0, Number(p.volume) || 0),
        fluctuation_rate: Number(p.fluctuation_rate) || 0,
        active: false,
      }));
      setData(initialData);
    }
  }, [pastData]);

  // 실시간 points가 들어올 때마다 버퍼에 쌓기
  useEffect(() => {
    if (!points || points.length === 0) return;
    bufferRef.current.push(...points);
  }, [points]);

  // 1초마다 버퍼 처리 (실시간)
  useEffect(() => {
    const interval = setInterval(() => {
      if (bufferRef.current.length === 0) return;

      const buffer = [...bufferRef.current];
      bufferRef.current = [];

      const mergedMap = new Map();
      // 기존 데이터 포함
      data.forEach((p) => mergedMap.set(p.date, { ...p }));

      // 실시간 데이터 버퍼 합성
      buffer.forEach((p) => {
        const dateKey = p.date;
        const existing = mergedMap.get(dateKey);
        if (existing) {
          existing.price = Number(p.price) || existing.price;
          existing.volume += Number(p.volume) || 0;
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

      let mergedArray = Array.from(mergedMap.values())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // currentIndex 적용
      if (currentIndex !== null && currentIndex >= 0) {
        mergedArray.forEach((d, i) => {
          d.active = i === currentIndex;
        });
      }

      // 최신 100개만
      mergedArray = mergedArray.slice(-100);

      setData(mergedArray);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, data]);

  // 최소/최대값
  const prices = useMemo(() => data.map((d) => d.price).filter((v) => !isNaN(v)), [data]);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const margin = (maxPrice - minPrice) * 0.1;

  if (!data || data.length === 0) {
    return (
      <div
        className="graph-wrapper"
        style={{ color: '#ccc', textAlign: 'center', padding: 30 }}
      >
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="graph-wrapper">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
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
            data[currentIndex] && (
              <ReferenceDot
                x={data[currentIndex].date}
                y={data[currentIndex].price}
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
