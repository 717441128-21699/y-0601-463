import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Map, Layers, Eye, BarChart3, Wrench, FileText, TrendingUp } from 'lucide-react';
import { cameraPresets } from '../services/mock/pools';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import type { CameraPreset, UserRole } from '../types';

interface ControlPanelProps {
  onCameraPresetChange: (preset: CameraPreset) => void;
}

export function ControlPanel({ onCameraPresetChange }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { dosingSystems, filters, pumpHouseData } = useWaterPlantStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const hasPermission = (requiredRole: UserRole) => {
    if (!currentUser) return false;
    const roles: UserRole[] = ['operator', 'supervisor', 'manager'];
    return roles.indexOf(currentUser.role) >= roles.indexOf(requiredRole);
  };

  const sortedFilters = [...filters].sort((a, b) => b.priority - a.priority);
  const activeBackwash = filters.filter(f => f.isBackwashing);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-30 w-14 h-14 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:bg-slate-800/90 transition-colors group"
      >
        <Settings className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors group-hover:rotate-90 duration-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: -400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-4 top-4 bottom-20 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  控制面板
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <Map className="w-4 h-4" />
                    视角预设
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cameraPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          onCameraPresetChange(preset);
                          setIsOpen(false);
                        }}
                        className="px-3 py-2 bg-slate-800/50 hover:bg-cyan-500/20 border border-slate-700/50 hover:border-cyan-500/50 rounded-xl text-sm text-slate-300 hover:text-cyan-400 transition-all"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-5">
                  <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    智能加药系统
                  </h4>
                  <div className="space-y-3">
                    {dosingSystems.map((dosing) => (
                      <div key={dosing.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{dosing.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            dosing.status === 'normal' ? 'bg-green-500/20 text-green-400' :
                            dosing.status === 'over' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {dosing.status === 'normal' ? '正常' : dosing.status === 'over' ? '超量' : '欠量'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">原水浊度</p>
                            <p className="text-white font-mono">{dosing.rawWaterTurbidity.toFixed(1)} NTU</p>
                          </div>
                          <div>
                            <p className="text-slate-500">原水流量</p>
                            <p className="text-white font-mono">{dosing.rawWaterFlow.toFixed(0)} m³/h</p>
                          </div>
                          <div>
                            <p className="text-slate-500">计算投加量</p>
                            <p className="text-cyan-400 font-mono">{dosing.calculatedDosage.toFixed(1)} kg/h</p>
                          </div>
                          <div>
                            <p className="text-slate-500">实际投加量</p>
                            <p className={`font-mono ${
                              dosing.status === 'normal' ? 'text-green-400' :
                              dosing.status === 'over' ? 'text-red-400' : 'text-yellow-400'
                            }`}>{dosing.actualDosage.toFixed(1)} kg/h</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-5">
                  <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    滤池反冲洗
                  </h4>
                  <div className="text-xs text-slate-400 mb-2">
                    正在反冲洗: {activeBackwash.length}/2 · 排队: {sortedFilters.filter(f => !f.isBackwashing && f.priority > 70).length}
                  </div>
                  <div className="space-y-2">
                    {sortedFilters.map((filter) => (
                      <div key={filter.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{filter.filterNo}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-cyan-400">优先级 {filter.priority}</span>
                            {filter.isBackwashing ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
                                冲洗中 {filter.backwashProgress}%
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                                待机
                              </span>
                            )}
                          </div>
                        </div>
                        {filter.isBackwashing && (
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${filter.backwashProgress}%` }}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div>
                            <p className="text-slate-500">水头损失</p>
                            <p className="text-white font-mono">{filter.headLoss.toFixed(2)} m</p>
                          </div>
                          <div>
                            <p className="text-slate-500">出水浊度</p>
                            <p className="text-white font-mono">{filter.effluentTurbidity.toFixed(2)} NTU</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-5">
                  <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    送水泵房
                  </h4>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">清水池水位</p>
                        <p className="text-white font-mono text-lg">{pumpHouseData.waterLevel.toFixed(2)} m</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">管网压力</p>
                        <p className="text-white font-mono text-lg">{pumpHouseData.pipePressure.toFixed(2)} MPa</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">运行泵数</p>
                        <p className="text-white font-mono text-lg">{pumpHouseData.runningPumps}/{pumpHouseData.totalPumps}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">运行频率</p>
                        <p className="text-white font-mono text-lg">{pumpHouseData.frequency.toFixed(1)} Hz</p>
                      </div>
                    </div>
                    {pumpHouseData.standbyPumpOn && (
                      <div className="mt-3 px-3 py-2 bg-yellow-500/20 rounded-lg text-yellow-400 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        备用泵已启动
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-5 space-y-2">
                  <button
                    onClick={() => navigate('/trend')}
                    className="w-full px-4 py-3 bg-slate-800/50 hover:bg-blue-500/20 border border-slate-700/50 hover:border-blue-500/50 rounded-xl text-sm text-slate-300 hover:text-blue-400 transition-all flex items-center gap-3"
                  >
                    <TrendingUp className="w-4 h-4" />
                    趋势分析
                  </button>
                  {hasPermission('supervisor') && (
                    <>
                      <button
                        onClick={() => navigate('/equipment')}
                        className="w-full px-4 py-3 bg-slate-800/50 hover:bg-cyan-500/20 border border-slate-700/50 hover:border-cyan-500/50 rounded-xl text-sm text-slate-300 hover:text-cyan-400 transition-all flex items-center gap-3"
                      >
                        <Wrench className="w-4 h-4" />
                        设备管理
                      </button>
                      <button
                        onClick={() => navigate('/report')}
                        className="w-full px-4 py-3 bg-slate-800/50 hover:bg-green-500/20 border border-slate-700/50 hover:border-green-500/50 rounded-xl text-sm text-slate-300 hover:text-green-400 transition-all flex items-center gap-3"
                      >
                        <FileText className="w-4 h-4" />
                        生产日报
                      </button>
                    </>
                  )}
                  {hasPermission('manager') && (
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full px-4 py-3 bg-slate-800/50 hover:bg-purple-500/20 border border-slate-700/50 hover:border-purple-500/50 rounded-xl text-sm text-slate-300 hover:text-purple-400 transition-all flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      系统设置
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
