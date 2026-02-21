import React from 'react';
import { Compass } from 'lucide-react';

interface WindroseContainerProps {
  imageBase64?: string;
  tableHtml?: string;
  onGenerate: (params: any) => void;
}

const WindroseContainer: React.FC<WindroseContainerProps> = ({ imageBase64, tableHtml, onGenerate }) => {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <h3 className="font-display font-bold text-[10px] text-primary-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <Compass className="text-primary-500" size={14} />
          Aerodynamic Analysis
        </h3>
        <button 
          onClick={() => onGenerate({ action: 'get_windrose' })}
          className="text-[9px] font-bold text-primary-500 hover:text-primary-900 uppercase tracking-widest transition-colors"
        >
          Recalculate
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 min-h-[300px]">
        {imageBase64 ? (
          <div className="p-4 bg-white border border-slate-100 shadow-sm">
            <img 
              src={`data:image/png;base64,${imageBase64}`} 
              alt="Windrose Chart" 
              className="max-w-full h-auto grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-12 h-12 border border-slate-200 flex items-center justify-center text-slate-300 mx-auto mb-4 animate-pulse">
              <Compass size={24} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Vector Data Available</p>
          </div>
        )}
      </div>

      {tableHtml && (
        <div 
          className="mt-6 overflow-hidden border border-slate-100 text-[10px] font-medium text-slate-600 prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: tableHtml }}
        />
      )}
    </div>
  );
};

export default WindroseContainer;
