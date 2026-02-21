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
}) => {
  const displayValue = useMemo(() => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-none p-6 border border-slate-200 relative overflow-hidden group transition-all hover:border-primary-500"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="p-1 rounded-none bg-slate-50 group-hover:bg-primary-50 transition-colors"
          style={{ color }}
        >
          <Icon size={18} />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {label} ({unit})
        </span>
      </div>

      <div className="flex flex-col mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-display font-medium text-slate-900 tracking-tighter"
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

      <div className="flex gap-4 pt-4 border-t border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <div>
          Min <span className="text-slate-900 ml-1">{min ?? '--'}</span>
        </div>
        <div className="border-l border-slate-100 pl-4">
          Max <span className="text-slate-900 ml-1">{max ?? '--'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
