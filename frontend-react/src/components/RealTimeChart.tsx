import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useWeatherStore } from '../store/useWeatherStore';
import type { ChartOptions } from 'chart.js';
import { Maximize2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface RealTimeChartProps {
  parameter: string;
  label: string;
  color: string;
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({ parameter, label, color }) => {
  const { history } = useWeatherStore();

  const data = useMemo(() => {
    const labels = history.map(frame => {
      const date = new Date(frame.RTC);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    });
    
    const values = history.map(frame => frame[parameter]);

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: label,
          data: values,
          borderColor: color,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, `${color}44`);
            gradient.addColorStop(1, `${color}00`);
            return gradient;
          },
          tension: 0.4,
          pointRadius: history.length > 50 ? 0 : 4,
          pointBackgroundColor: color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          borderWidth: 3,
        },
      ],
    };
  }, [history, parameter, label, color]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        border: { display: false },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: { size: 10, weight: 'bold' },
          color: '#94a3b8'
        }
      },
      y: {
        beginAtZero: false,
        border: { display: false },
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: { size: 10, weight: 'bold' },
          color: '#94a3b8',
          padding: 10
        }
      },
    },
    interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
    },
    animation: {
      duration: 400,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="h-full w-full group relative">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur shadow-sm border border-slate-100 p-1.5 rounded-md text-slate-400">
        <Maximize2 size={14} />
      </div>
      <Line options={options} data={data} />
    </div>
  );
};

export default RealTimeChart;
