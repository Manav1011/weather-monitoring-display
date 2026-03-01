import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  color: string;
  min?: number | string;
  max?: number | string;
  timestamp?: string;
  onDoubleClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  color,
  min,
  max,
  timestamp,
  onDoubleClick,
}) => {
  const displayValue = useMemo(() => {
    if (typeof value === 'number') {
      if (label.toLowerCase().includes('wind dir')) {
        return value.toFixed(0);
      }
      return value.toFixed(2);
    }
    return value;
  }, [value, label]);

  const formatValue = (val: number | string | undefined) => {
    if (typeof val === 'number') {
      if (label.toLowerCase().includes('wind dir')) return val.toFixed(0);
      return val.toFixed(2);
    }
    return val ?? '--';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-none p-6 border border-slate-200 relative overflow-hidden group transition-all hover:border-primary-500 cursor-pointer"
      style={{ borderLeft: `8px solid ${color}` }}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-2">
        <div 
          className="p-1 rounded-none bg-slate-50 group-hover:bg-primary-50 transition-colors"
          style={{ color }}
        >
          <Icon size={24} />
        </div>
        <span className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">
          {label} ({unit})
        </span>
      </div>

      <div className="flex flex-col mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-display font-medium tracking-tighter"
            style={{ color: color }}
          >
            {displayValue}
          </motion.div>
        </AnimatePresence>
        {timestamp && (
          <div className="text-[9px] font-medium text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-wider">
            <span className="opacity-40">Sync:</span> {timestamp}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">
        <div className="bg-slate-50 px-3 py-1.5 rounded flex items-center">
          Min <span className="text-slate-900 ml-2 font-black text-sm">{formatValue(min)}</span>
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded flex items-center text-right">
          Max <span className="text-slate-900 ml-2 font-black text-sm">{formatValue(max)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
