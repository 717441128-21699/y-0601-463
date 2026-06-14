import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Droplets, Activity, Gauge, BarChart3 } from 'lucide-react';
import { TrendChart } from '../components/TrendChart';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRealtimeData } from '../hooks/useRealtimeData';

export default function TrendAnalysis() {
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const { pools, dosingSystems, filters, pumpHouseData } = useWaterPlantStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  useRealtimeData();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (pools.length > 0 && !selectedPoolId) {
      const firstProcessPool = pools.find(p => p.type !== 'dosing' && p.type !== 'controlRoom');
      if (firstProcessPool) {
        setSelectedPoolId(firstProcessPool.id);
      }
    }
  }, [pools, selectedPoolId]);

  const displayPools = pools.filter(p => p.type !== 'dosing' && p.type !== 'controlRoom');
  const selectedPool = pools.find(p => p.id === selectedPoolId);

  const getPoolIcon = (type: string) => {
    switch (type) {
      case 'intake': return '🌊';
      case 'sedimentation': return '💧';
      case 'filter': return '🔍';
      case 'clearWater': return '💦';
      case 'pumpHouse': return '⚡';
      default: return '🏭';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'alarm': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return '正常';
      case 'warning': return '预警';
      case 'alarm': return '报警';
      default: return '未知';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/30 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                趋势分析中心
              </h1>
              <p className="text-slate-400 text-sm mt-1">多参数历史数据对比与趋势分析</p>
            </div>
          </div>
          {currentUser && (
            <div className="px-4 py-3 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50 flex items-center gap-3">
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
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          {displayPools.map((pool, index) => (
            <motion.button
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPoolId(pool.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                selectedPoolId === pool.id
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/30'
              }`}
            >
              <div className="text-3xl mb-2">{getPoolIcon(pool.type)}</div>
              <h3 className="text-white font-medium text-sm mb-1">{pool.name}</h3>
              <p className="text-slate-400 text-xs mb-2">#{pool.poolNo}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(pool.status)}`}>
                {getStatusText(pool.status)}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {selectedPool && (
          <>
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="p-5 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-slate-400 text-sm">当前流量</span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">{selectedPool.currentFlow.toFixed(1)}</p>
                <p className="text-slate-500 text-sm">m³/h</p>
              </div>

              <div className="p-5 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-slate-400 text-sm">浊度</span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">{selectedPool.turbidity.toFixed(2)}</p>
                <p className="text-slate-500 text-sm">NTU</p>
              </div>

              <div className="p-5 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-slate-400 text-sm">pH值</span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">{selectedPool.pH.toFixed(2)}</p>
                <p className="text-slate-500 text-sm">标准 6.5-8.5</p>
              </div>

              <div className="p-5 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-400 text-sm">余氯</span>
                </div>
                <p className="text-3xl font-bold text-white font-mono">{selectedPool.residualChlorine.toFixed(2)}</p>
                <p className="text-slate-500 text-sm">mg/L</p>
              </div>
            </motion.div>

            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedPool.name} · 近24小时趋势曲线</h2>
                    <p className="text-slate-400 text-sm">流量、浊度、pH值、余氯 多参数对比</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  实时更新中
                </div>
              </div>
              <div className="h-[500px]">
                <TrendChart poolId={selectedPool.id} height="100%" />
              </div>
            </motion.div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-orange-400">🧪</span>
              智能加药系统状态
            </h3>
            <div className="space-y-3">
              {dosingSystems.map((dosing) => (
                <div key={dosing.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">{dosing.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      dosing.status === 'normal' ? 'bg-green-500/20 text-green-400' :
                      dosing.status === 'over' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {dosing.status === 'normal' ? '正常' : dosing.status === 'over' ? '超量' : '欠量'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">计算投加量</p>
                      <p className="text-cyan-400 font-mono">{dosing.calculatedDosage.toFixed(2)} kg/h</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">实际投加量</p>
                      <p className={`font-mono ${
                        dosing.status === 'normal' ? 'text-green-400' :
                        dosing.status === 'over' ? 'text-red-400' : 'text-yellow-400'
                      }`}>{dosing.actualDosage.toFixed(2)} kg/h</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">⚡</span>
              送水泵房运行状态
            </h3>
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-500 text-xs mb-1">清水池水位</p>
                  <p className="text-2xl font-bold text-white font-mono">{pumpHouseData.waterLevel.toFixed(2)} m</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">管网压力</p>
                  <p className="text-2xl font-bold text-white font-mono">{pumpHouseData.pipePressure.toFixed(2)} MPa</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">运行泵数</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono">{pumpHouseData.runningPumps}/{pumpHouseData.totalPumps}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">运行频率</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono">{pumpHouseData.frequency.toFixed(1)} Hz</p>
                </div>
              </div>
              {pumpHouseData.standbyPumpOn && (
                <div className="px-3 py-2 bg-yellow-500/20 rounded-xl text-yellow-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  备用泵已启动
                </div>
              )}
            </div>

            <h4 className="text-sm font-medium text-slate-300 mb-3">滤池反冲洗状态</h4>
            <div className="space-y-2">
              {filters.map((filter) => (
                <div key={filter.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">{filter.filterNo}</span>
                    {filter.isBackwashing ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
                        冲洗中 {filter.backwashProgress}%
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                        待机 · 优先级 {filter.priority}
                      </span>
                    )}
                  </div>
                  {filter.isBackwashing && (
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${filter.backwashProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
