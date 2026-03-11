import React from 'react';
import { Download, LayoutDashboard, Maximize2 } from 'lucide-react';
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

interface AnalyticsResultsProps {
  imageBase64?: string;
  tableHtml?: string;
  tableCsv?: string;
  isGenerating?: boolean;
  rawData?: any[];
}

const AnalyticsResults: React.FC<AnalyticsResultsProps> = ({ 
  imageBase64, 
  tableHtml, 
  tableCsv,
  isGenerating,
  rawData
}) => {
  const [chartType, setChartType] = React.useState<'line' | 'area'>('line');

  if (!imageBase64 && !isGenerating && !tableHtml && !rawData) {
    return null;
  }

  const handleExportCsv = () => {
    if (!tableCsv) return;
    const blob = new Blob([tableCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytical_data_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="mt-8 bg-white border border-slate-200">
      <div className="flex justify-between items-center p-6 border-b border-slate-100">
        <h3 className="font-display font-bold text-sm text-primary-900 uppercase tracking-[0.2em] flex items-center gap-3">
          <LayoutDashboard className="text-primary-500" size={18} />
          Analytical Engine Results
        </h3>
        
        {tableCsv && (
          <button 
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      <div className="p-8">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-6"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
              Generating Vector Topology...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Visual Chart Result - Interactive or Image Fallback */}
            {rawData && rawData.length > 0 ? (
                <div className="bg-white p-6 border border-slate-100 shadow-sm relative">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setChartType('line')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${chartType === 'line' ? 'bg-primary-900 text-white border-primary-900' : 'bg-white text-slate-500 border-slate-200 hover:border-primary-500'}`}
                            >
                                Line
                            </button>
                            <button 
                                onClick={() => setChartType('area')}
                                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${chartType === 'area' ? 'bg-primary-900 text-white border-primary-900' : 'bg-white text-slate-500 border-slate-200 hover:border-primary-500'}`}
                            >
                                Area
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Maximize2 size={12} /> Interactive Mode</span>
                        </div>
                    </div>
                    <div className="h-[500px] w-full">
                        <Line 
                            data={{
                                labels: rawData.map(d => {
                                    const date = new Date(d.RTC);
                                    return isNaN(date.getTime()) ? d.RTC : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                }),
                                datasets: Object.keys(rawData[0]).filter(k => k !== 'RTC' && k !== 'Date' && k !== 'Time').map((key, idx) => {
                                    const colors = ['#3b82f6', '#f97316', '#14b8a6', '#ec4899', '#8b5cf6', '#fbbf24'];
                                    const color = colors[idx % colors.length];
                                    return {
                                        label: key,
                                        data: rawData.map(d => d[key]),
                                        borderColor: color,
                                        backgroundColor: chartType === 'area' ? `${color}33` : 'transparent',
                                        fill: chartType === 'area',
                                        tension: 0.3,
                                        pointRadius: rawData.length > 100 ? 0 : 3,
                                        borderWidth: 2,
                                    }
                                })
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            boxWidth: 12,
                                            font: { size: 10, weight: 'bold' },
                                            usePointStyle: true,
                                        }
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        padding: 12,
                                        titleFont: { size: 12, weight: 'bold' },
                                        bodyFont: { size: 11 },
                                        cornerRadius: 4,
                                    }
                                },
                                scales: {
                                    x: {
                                        grid: { display: false },
                                        ticks: { 
                                            maxRotation: 0, 
                                            autoSkip: true, 
                                            maxTicksLimit: 10,
                                            font: { size: 9, weight: 'bold' }
                                        }
                                    },
                                    y: {
                                        grid: { color: '#f1f5f9' },
                                        ticks: { font: { size: 9, weight: 'bold' } }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            ) : imageBase64 && (
              <div className="bg-bg p-8 border border-slate-100 flex justify-center">
                <img 
                  src={`data:image/png;base64,${imageBase64}`} 
                  alt="Analytical Plot" 
                  className="max-w-full h-auto max-h-[600px] object-contain shadow-sm"
                />
              </div>
            )}

            {/* Tabular Data Result */}
            {tableHtml && (
              <div className="w-full overflow-x-auto border border-slate-100 rounded-sm">
                <style dangerouslySetInnerHTML={{__html: `
                  .pandas-table-wrapper table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 11px;
                  }
                  .pandas-table-wrapper th, 
                  .pandas-table-wrapper td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    white-space: nowrap;
                  }
                  .pandas-table-wrapper th {
                    background-color: #f8fafc;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                  .pandas-table-wrapper tr:last-child td {
                    border-bottom: none;
                  }
                  .pandas-table-wrapper tr:hover td {
                    background-color: #f8fafc;
                  }
                `}} />
                <div 
                  className="pandas-table-wrapper text-slate-700 font-medium"
                  dangerouslySetInnerHTML={{ __html: tableHtml }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsResults;
