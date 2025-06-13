import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Sphere2DGraph({ points, currentIndex }) {
  // x, y 좌표 배열 생성
  const data = {
    labels: points.map((point) => point.date), // 날짜를 x축에 표시
    datasets: [
      {
        label: 'Price vs. Date',
        data: points.map((point) => point.price), // 가격을 y축에 표시
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        pointBackgroundColor: points.map(
          (_, i) => (i === currentIndex ? 'red' : 'rgba(75, 192, 192, 1)') // 현재 인덱스 빨간색
        ),
        pointRadius: points.map((_, i) => (i === currentIndex ? 8 : 3)), // 강조 효과
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Price vs. Date',
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '400px', marginTop: '20px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
