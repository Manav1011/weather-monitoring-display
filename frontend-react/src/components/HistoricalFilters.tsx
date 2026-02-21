import React, { useState } from 'react';
import { Calendar, Filter, BarChart2, Activity } from 'lucide-react';

interface HistoricalFiltersProps {
  onApply: (type: 'line' | 'area', params: any) => void;
  availableParams: { key: string; label: string }[];
}

const HistoricalFilters: React.FC<HistoricalFiltersProps> = ({ onApply, availableParams }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'line' | 'area'>('line');

  // Line Chart State (Multi-select)
  const [selectedLineParams, setSelectedLineParams] = useState<string[]>(['ATMP']);

  // Area Chart State (Single-select)
  const [selectedAreaParam, setSelectedAreaParam] = useState<string>('ATMP');

  const handleLineToggle = (key: string) => {
    setSelectedLineParams(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleApply = () => {
    if (!startDate || !endDate) return;

    const daterange = [new Date(startDate).getTime(), new Date(endDate).getTime()];

    if (activeTab === 'line') {
      onApply('line', { daterange, params: selectedLineParams });
    } else if (activeTab === 'area') {
      onApply('area', { daterange, value: selectedAreaParam });
    }
  };

  return (
    <div className="bg-white p-8 border border-slate-200">
      <div className="flex items-center gap-2 text-primary-900 border-b border-slate-100 pb-4 mb-8">
        <Filter size={14} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Engine Parameters</span>
      </div>

      {/* Date Ranges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-slate-100 mb-8">
        <div className="p-6 border-r border-slate-100">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-3">T-Start</label>
          <div className="relative">
            <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border-b border-slate-100 focus:border-primary-500 pl-6 py-2 text-xs text-slate-900 transition-all outline-none uppercase"
            />
          </div>
        </div>

        <div className="p-6">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-3">T-End</label>
          <div className="relative">
            <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border-b border-slate-100 focus:border-primary-500 pl-6 py-2 text-xs text-slate-900 transition-all outline-none uppercase"
            />
          </div>
        </div>
      </div>

      {/* Analysis Type Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('line')}
          className={`pb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'line' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Activity size={14}/> Line Chart
        </button>
        <button 
          onClick={() => setActiveTab('area')}
          className={`pb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'area' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <BarChart2 size={14}/> Area Chart
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[150px] mb-8">
        
        {/* LINE CHART CONFIG */}
        {activeTab === 'line' && (
          <div className="space-y-4">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Select Parameters (Multi-select)</label>
            <div className="flex flex-wrap gap-4">
              {availableParams.map(param => (
                <label key={`line-${param.key}`} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${selectedLineParams.includes(param.key) ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
                    {selectedLineParams.includes(param.key) && <span className="w-2 h-2 bg-white block"></span>}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={selectedLineParams.includes(param.key)}
                    onChange={() => handleLineToggle(param.key)}
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{param.key}</span>
                </label>
              ))}
            </div>
            <button 
              onClick={() => setSelectedLineParams(availableParams.map(p => p.key))}
              className="text-[10px] font-bold text-primary-500 uppercase tracking-widest hover:underline mt-4 block"
            >
              Select All
            </button>
          </div>
        )}

        {/* AREA CHART CONFIG */}
        {activeTab === 'area' && (
          <div className="space-y-4">
             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Select Primary Parameter</label>
             <div className="flex flex-wrap gap-4">
              {availableParams.map(param => (
                <label key={`area-${param.key}`} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedAreaParam === param.key ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-300 group-hover:border-primary-400'}`}>
                    {selectedAreaParam === param.key && <span className="w-2 h-2 rounded-full bg-white block"></span>}
                  </div>
                  <input 
                    type="radio" 
                    className="hidden"
                    checked={selectedAreaParam === param.key}
                    onChange={() => setSelectedAreaParam(param.key)}
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{param.key}</span>
                </label>
              ))}
            </div>
          </div>
        )}

      </div>

      <button 
        onClick={handleApply}
        disabled={!startDate || !endDate || (activeTab === 'line' && selectedLineParams.length === 0)}
        className="w-full bg-primary-900 hover:bg-primary-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 transition-all uppercase tracking-[0.2em] text-xs"
      >
        Execute Analysis
      </button>
    </div>
  );
};

export default HistoricalFilters;

