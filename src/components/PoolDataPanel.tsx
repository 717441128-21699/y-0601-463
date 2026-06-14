import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Activity, Thermometer, Gauge } from 'lucide-react';
import type { ProcessPool } from '../types';
import { formatFlow, formatTurbidity, formatPH, formatResidualChlorine, getStatusColor, getPoolTypeName } from '../utils/formatters';

interface PoolDataPanelProps {
  pool: ProcessPool | null;
  onClose: () => void;
  onViewTrend: () => void;
}

export function PoolDataPanel({ pool, onClose, onViewTrend }: PoolDataPanelProps) {
  if (!pool) return null;

  const statusColor = getStatusColor(pool.status);
  const statusText = pool.status === 'normal' ? '正常运行' : 
                     pool.status === 'warning' ? '预警' : '告警';

  const hasWaterQuality = pool.type !== 'dosing' && pool.type !== 'controlRoom';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -400 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute left-4 top-24 w-80 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden z-20"
      >
        <div 
          className="h-2 w-full"
          style={{ backgroundColor: statusColor }}
        />
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-mono">{pool.name}</h3>
              <p className="text-sm text-cyan-400">{getPoolTypeName(pool.type)} · {pool.poolNo}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-2 mb-5">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor, boxShadow: `0 0 12px ${statusColor}` }}
            />
            <span className="text-sm font-medium" style={{ color: statusColor }}>{statusText}</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">处理水量</p>
                  <p className="text-xl font-bold text-white font-mono">{formatFlow(pool.currentFlow)}</p>
                </div>
              </div>
            </div>

            {hasWaterQuality && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center">
                    <Activity className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400 mb-1">浊度</p>
                    <p className="text-sm font-bold text-white font-mono">{formatTurbidity(pool.turbidity)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center">
                    <Gauge className="w-4 h-4 text-green-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400 mb-1">pH</p>
                    <p className="text-sm font-bold text-white font-mono">{formatPH(pool.pH)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center">
                    <Thermometer className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-400 mb-1">余氯</p>
                    <p className="text-sm font-bold text-white font-mono">{formatResidualChlorine(pool.residualChlorine)}</p>
                  </div>
                </div>

                <button
                  onClick={onViewTrend}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  查看24小时趋势曲线
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
