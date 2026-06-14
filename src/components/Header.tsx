import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

export function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-900/95 to-transparent z-30 px-6"
    >
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              3D智慧水厂可视化平台
            </h1>
            <p className="text-xs text-cyan-400 mt-0.5">Smart Water Plant 3D Visualization Platform</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">运行状态</p>
              <p className="text-sm font-medium text-green-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                系统正常运行
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-right">
            <p className="text-xs text-slate-500">处理能力</p>
            <p className="text-sm font-bold text-cyan-400 font-mono">250,000 m³/d</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
