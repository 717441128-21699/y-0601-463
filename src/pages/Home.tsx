import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { WaterPlantScene } from '../three/models/WaterPlantScene';
import { Header } from '../components/Header';
import { ControlPanel } from '../components/ControlPanel';
import { AlarmPanel } from '../components/AlarmPanel';
import { StatusBar } from '../components/StatusBar';
import { PoolDataPanel } from '../components/PoolDataPanel';
import { TrendChart } from '../components/TrendChart';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { useAuthStore } from '../store/useAuthStore';
import type { CameraPreset } from '../types';

export default function Home() {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | undefined>();
  const [showTrendChart, setShowTrendChart] = useState(false);
  const [trendPoolId, setTrendPoolId] = useState<string | null>(null);
  
  const { selectedPoolId, setSelectedPool, pools } = useWaterPlantStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();
  
  useRealtimeData();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleCameraPresetChange = (preset: CameraPreset) => {
    setCameraPreset(preset);
  };

  const handlePoolClick = (poolId: string) => {
    setSelectedPool(poolId);
  };

  const handleShowTrend = (poolId: string) => {
    setTrendPoolId(poolId);
    setShowTrendChart(true);
  };

  const selectedPool = pools.find(p => p.id === selectedPoolId);
  const trendPool = trendPoolId ? pools.find(p => p.id === trendPoolId) : null;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      <div className="absolute inset-0">
        <Canvas
          shadows
          camera={{ position: [30, 25, 30], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
        >
          <WaterPlantScene 
            onPoolClick={handlePoolClick}
            cameraPreset={cameraPreset}
          />
        </Canvas>
      </div>

      <Header />
      
      <ControlPanel onCameraPresetChange={handleCameraPresetChange} />
      
      <AlarmPanel />
      
      <StatusBar />

      <AnimatePresence>
        {selectedPool && (
          <PoolDataPanel
            pool={selectedPool}
            onClose={() => setSelectedPool(null)}
            onViewTrend={() => handleShowTrend(selectedPool.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrendChart && trendPool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowTrendChart(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-5xl mx-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {trendPool.name} · 近24小时趋势曲线
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">实时监测数据 · 每5分钟更新</p>
                  </div>
                  <button
                    onClick={() => setShowTrendChart(false)}
                    className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <TrendChart poolId={trendPool.id} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed top-24 right-6 z-30 px-4 py-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-xl ${
            currentUser.role === 'manager' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
            currentUser.role === 'supervisor' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
            'bg-gradient-to-br from-cyan-400 to-blue-500'
          } flex items-center justify-center text-white font-bold`}>
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{currentUser.name}</p>
            <p className="text-slate-400 text-xs">
              {currentUser.role === 'manager' ? '厂长' : currentUser.role === 'supervisor' ? '班长' : '值班员'}
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-24 right-6 z-20 flex flex-col gap-2"
      >
        <div className="px-3 py-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-xs text-slate-400 border border-slate-700/50">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            鼠标左键：旋转视角
          </p>
          <p className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            鼠标滚轮：缩放
          </p>
          <p className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            右键拖拽：平移
          </p>
        </div>
      </motion.div>
    </div>
  );
}
