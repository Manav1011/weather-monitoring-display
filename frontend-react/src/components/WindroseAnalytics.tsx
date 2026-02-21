import React, { useState } from 'react';
import { Calendar, Compass, Plus, Trash2 } from 'lucide-react';

interface WindroseBin {
  min: number;
  max: number;
  color: string;
}

interface WindroseAnalyticsProps {
  onApply: (params: { daterange: number[]; values: number[]; colors: string[] }) => void;
}

const WindroseAnalytics: React.FC<WindroseAnalyticsProps> = ({ onApply }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Windrose State (Dynamic Bins)
  const [windroseBins, setWindroseBins] = useState<WindroseBin[]>([
    { min: 0, max: 10, color: '#3b82f6' },
    { min: 10, max: 20, color: '#14b8a6' },
  ]);

  const handleAddBin = () => {
    const lastBin = windroseBins[windroseBins.length - 1];
    setWindroseBins([
      ...windroseBins, 
      { min: lastBin ? lastBin.max : 0, max: (lastBin ? lastBin.max : 0) + 10, color: '#f59e0b' }
    ]);
  };

  const handleRemoveBin = (index: number) => {
    setWindroseBins(windroseBins.filter((_, i) => i !== index));
  };

  const handleBinChange = (index: number, field: keyof WindroseBin, value: number | string) => {
    const newBins = [...windroseBins];
    newBins[index] = { ...newBins[index], [field]: value };
    
    // Auto-adjust previous max if min changes
    if (field === 'min' && index > 0) {
        newBins[index - 1].max = value as number;
    }
    // Auto-adjust next min if max changes
    if (field === 'max' && index < newBins.length - 1) {
        newBins[index + 1].min = value as number;
    }

    setWindroseBins(newBins);
  };

  const handleApply = () => {
    if (!startDate || !endDate) return;

    const daterange = [new Date(startDate).getTime(), new Date(endDate).getTime()];
    const values = windroseBins.map(b => b.max);
    const colors = windroseBins.map(b => b.color);
    // Backend expects the colors array to end with a default top-end color #000000
    colors.push('#000000');
    
    onApply({ daterange, values, colors });
  };

  return (
    <div className="bg-white p-8 border border-slate-200">
      <div className="flex items-center gap-2 text-primary-900 border-b border-slate-100 pb-4 mb-8">
        <Compass size={14} />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Aerodynamic Configuration</span>
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

       {/* WINDROSE CONFIG */}
       <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center mb-4">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Velocity Bins (Km/h)</label>
          <button 
            onClick={handleAddBin}
            className="flex items-center gap-1 text-[10px] font-bold text-primary-500 uppercase tracking-widest hover:bg-primary-50 px-2 py-1 transition-colors"
            disabled={windroseBins.length >= 8}
          >
            <Plus size={12}/> Add Bin
          </button>
        </div>
        
        <div className="space-y-3">
          {windroseBins.map((bin, index) => (
            <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400">Bin {index + 1}</span>
              <div className="flex items-center gap-2 flex-1">
                <input 
                  type="number"
                  value={bin.min}
                  onChange={(e) => handleBinChange(index, 'min', Number(e.target.value))}
                  className="w-20 bg-white border border-slate-200 text-xs text-center py-1 outline-none focus:border-primary-500"
                  disabled={index !== 0} // Min is driven by prev Max unless it's the first
                />
                <span className="text-slate-400 text-xs">to</span>
                <input 
                  type="number"
                  value={bin.max}
                  onChange={(e) => handleBinChange(index, 'max', Number(e.target.value))}
                  className="w-20 bg-white border border-slate-200 text-xs text-center py-1 outline-none focus:border-primary-500"
                />
              </div>
              <input 
                type="color"
                value={bin.color}
                onChange={(e) => handleBinChange(index, 'color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              {index > 0 && index === windroseBins.length - 1 && (
                  <button onClick={() => handleRemoveBin(index)} className="text-red-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16}/>
                  </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleApply}
        disabled={!startDate || !endDate}
        className="w-full bg-primary-900 hover:bg-primary-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-4 transition-all uppercase tracking-[0.2em] text-xs"
      >
        Execute Analysis
      </button>
    </div>
  );
};

export default WindroseAnalytics;
