import React, { useState } from 'react';
import { List, Settings2 } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';

const RealTimeTable: React.FC = () => {
    const { history } = useWeatherStore();
    const [viewLimit, setViewLimit] = useState(30);

    const displayData = [...history].reverse().slice(0, viewLimit);

    return (
        <div className="bg-white border border-slate-200 flex flex-col h-[500px]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-display font-bold text-xs text-primary-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <List className="text-primary-500" size={16} />
                    Real-Time Data Log
                </h3>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Settings2 size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show Rows:</span>
                    </div>
                    <select 
                        value={viewLimit}
                        onChange={(e) => setViewLimit(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 outline-none focus:border-primary-500 transition-all"
                    >
                        <option value={10}>10 Rows</option>
                        <option value={30}>30 Rows</option>
                        <option value={60}>60 Rows</option>
                        <option value={100}>100 Rows</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Timestamp</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Temp (°C)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Hum (%)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Spd (m/s)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Dir (°)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Rain (mm)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">BP (mmHg)</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 text-center">Solar (W/m²)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayData.length > 0 ? (
                            displayData.map((frame, idx) => (
                                <tr key={frame.RTC + idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-[11px] font-medium text-slate-600 border-b border-slate-100 uppercase tracking-tight">
                                        {frame.RTC.split('T')[1].split('.')[0]} {/* Just show time for brevity */}
                                        <span className="text-[9px] text-slate-400 ml-2">{frame.RTC.split('T')[0]}</span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-primary-600 text-center">{frame.ATMP?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-orange-600 text-center">{frame.HUMD?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-teal-600 text-center">{frame.WSPD?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-pink-600 text-center">{frame.WDIR?.toFixed(0)}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-blue-600 text-center">{frame.RAIN?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-purple-600 text-center">{frame.BPRS?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-[11px] font-bold text-amber-600 text-center">{frame.SRAD?.toFixed(2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waiting for live data...</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RealTimeTable;
