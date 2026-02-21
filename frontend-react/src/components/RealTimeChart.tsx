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
      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
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
          backgroundColor: `${color}22`,
          tension: 0.4,
          pointRadius: 0,
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
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 5,
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#f3f4f6',
        },
      },
    },
    animation: {
      duration: 0
    }
  };

  return (
    <div className="h-full w-full">
      <Line options={options} data={data} />
    </div>
  );
};

export default RealTimeChart;
