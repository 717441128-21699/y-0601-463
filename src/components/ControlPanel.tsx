import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Map, Layers, Eye, BarChart3, Wrench, FileText, TrendingUp, AlertTriangle, Play, RotateCcw, CheckCircle, Clock, CircleDot, Zap, RefreshCw, GitBranch } from 'lucide-react';
import { cameraPresets, mockProcessPools } from '../services/mock/pools';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { message, Tooltip } from 'antd';
import type { CameraPreset, UserRole, ValveStatus } from '../types';

interface ControlPanelProps {
  onCameraPresetChange: (preset: CameraPreset) => void;
}

const valveNameMap: Record<string, string> = {
  'valve-intake-outlet': '取水口出水阀',
  'valve-sed1-outlet': '沉淀池1出水阀',
  'valve-sed2-outlet': '沉淀池2出水阀',
  'valve-filter1-outlet': '滤池1出水阀',
  'valve-filter2-outlet': '滤池2出水阀',
  'valve-filter3-outlet': '滤池3出水阀',
  'valve-filter4-outlet': '滤池4出水阀',
  'valve-clear-outlet': '清水池出水阀',
  'valve-main-pump': '主泵阀组',
  'valve-standby-pump': '备用泵阀组',
  'valve-delivery': '输水总阀',
};

const getValveStatusStyle = (status: ValveStatus): { bg: string; text: string; label: string; icon: typeof CheckCircle } => {
  switch (status) {
    case 'open': return { bg: 'bg-green-500/20 border-green-500/40', text: 'text-green-400', label: '开启', icon: CheckCircle };
    case 'closed': return { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', label: '关闭', icon: RotateCcw };
    case 'opening': return { bg: 'bg-yellow-500/20 border-yellow-500/40', text: 'text-yellow-400', label: '开启中', icon: Play };
    case 'closing': return { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-400', label: '关闭中', icon: RotateCcw };
  }
};

export function ControlPanel({ onCameraPresetChange }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    dosingSystems, 
    filters, 
    pumpHouseData, 
    pools,
    backwashQueue,
    isAutoBackwashEnabled,
    isEmergencyMode,
    activeEmergencyPoolId,
    simulateTurbidityOverflow,
    recoverEmergencyPool,
    setAutoBackwashEnabled,
    processBackwashQueue,
  } = useWaterPlantStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const hasPermission = (requiredRole: UserRole) => {
    if (!currentUser) return false;
    const roles: UserRole[] = ['operator', 'supervisor', 'manager'];
    return roles.indexOf(currentUser.role) >= roles.indexOf(requiredRole);
  };

  const sortedFilters = [...filters].sort((a, b) => b.priority - a.priority);
  const activeBackwash = filters.filter(f => f.isBackwashing);
  const filterPools = pools.filter(p => p.type === 'filter');

  const handleSimulateOverflow = (poolId: string) => {
    simulateTurbidityOverflow(poolId);
    const pool = pools.find(p => p.id === poolId);
    message.success(`已模拟${pool?.poolNo || poolId}浊度超标，自动启动应急流程`);
  };

  const handleRecoverPool = (poolId: string) => {
    recoverEmergencyPool(poolId);
    const pool = pools.find(p => p.id === poolId);
    message.success(`${pool?.poolNo || poolId}已恢复正常运行`);
  };

  const emergencyPools = pools.filter(p => p.status === 'alarm');

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
              className="fixed left-4 top-4 bottom-20 w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col overflow-hidden"
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
                {isEmergencyMode && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      应急处置模式已启动
                    </div>
                    <div className="text-xs text-red-300">
                      当前应急池：{pools.find(p => p.id === activeEmergencyPoolId)?.poolNo || '多池'}
                    </div>
                  </div>
                )}

                {hasPermission('supervisor') && (
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-orange-500/30">
                    <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      验收模拟工具
                    </h4>
                    <div className="text-xs text-slate-400 mb-3">
                      点击下方按钮模拟滤池浊度超标，查看自动应急流程
                    </div>
                    <div className="space-y-2">
                      {filterPools.map(pool => (
                        <div key={pool.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-300">{pool.poolNo}</span>
                          <div className="flex gap-2">
                            {pool.status !== 'alarm' ? (
                              <Tooltip title="模拟浊度超标">
                                <button
                                  onClick={() => handleSimulateOverflow(pool.id)}
                                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg text-xs text-red-400 transition-all flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  触发告警
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="恢复正常状态">
                                <button
                                  onClick={() => handleRecoverPool(pool.id)}
                                  className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/40 border border-green-500/50 rounded-lg text-xs text-green-400 transition-all flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  恢复
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {emergencyPools.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-400 mb-2">当前告警池：</div>
                        {emergencyPools.map(p => (
                          <div key={p.id} className="text-xs text-red-400">
                            • {p.poolNo} 浊度 {p.turbidity.toFixed(2)} NTU
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                      <div key={dosing.id} className={`bg-slate-800/50 rounded-xl p-4 border ${
                        isEmergencyMode ? 'border-red-500/40 bg-red-500/5' : 'border-slate-700/50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{dosing.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            dosing.status === 'normal' ? 'bg-green-500/20 text-green-400' :
                            dosing.status === 'over' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {dosing.status === 'normal' ? '正常' : 
                             dosing.status === 'over' ? (isEmergencyMode ? '应急投加' : '超量') : '欠量'}
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
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      滤池反冲洗
                    </h4>
                    {hasPermission('supervisor') && (
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAutoBackwashEnabled}
                            onChange={(e) => setAutoBackwashEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                        <span className="text-xs text-slate-400">自动排班</span>
                      </div>
                    )}
                  </div>
                  
                  {backwashQueue.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium mb-2">
                        <Clock className="w-3 h-3" />
                        等待队列 ({backwashQueue.length})
                      </div>
                      <div className="space-y-1">
                        {backwashQueue.map((fid, idx) => {
                          const f = filters.find(x => x.id === fid);
                          return (
                            <div key={fid} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">
                                {idx + 1}. {f?.filterNo}
                              </span>
                              <span className="text-cyan-400">优先级 {f?.priority}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>正在反冲洗: {activeBackwash.length}/2</span>
                    {hasPermission('supervisor') && (
                      <button
                        onClick={() => { processBackwashQueue(); message.info('已处理反冲洗队列'); }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        立即处理
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {sortedFilters.map((filter) => (
                      <div key={filter.id} className={`bg-slate-800/50 rounded-xl p-3 border ${
                        backwashQueue.includes(filter.id) ? 'border-yellow-500/40' : 'border-slate-700/50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{filter.filterNo}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-cyan-400">P{filter.priority}</span>
                            {filter.isBackwashing ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
                                冲洗 {filter.backwashProgress}%
                              </span>
                            ) : backwashQueue.includes(filter.id) ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                                排队中
                              </span>
                            ) : filter.priority > 70 ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                                待冲洗
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                                正常
                              </span>
                            )}
                          </div>
                        </div>
                        {filter.isBackwashing && (
                          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${filter.backwashProgress}%` }}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-500">水头损失</p>
                            <p className={`font-mono ${filter.headLoss > 2.5 ? 'text-orange-400' : 'text-white'}`}>
                              {filter.headLoss.toFixed(2)} m
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">出水浊度</p>
                            <p className={`font-mono ${filter.effluentTurbidity > 0.6 ? 'text-orange-400' : 'text-white'}`}>
                              {filter.effluentTurbidity.toFixed(2)} NTU
                            </p>
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
                        <p className={`font-mono text-lg ${
                          pumpHouseData.pipePressure < 0.3 ? 'text-orange-400' : 'text-white'
                        }`}>
                          {pumpHouseData.pipePressure.toFixed(2)} MPa
                        </p>
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
                        备用泵已启动 · 阀组切换完成
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                      <GitBranch className="w-3 h-3" />
                      阀门状态
                    </h5>
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                      {Object.entries(pumpHouseData.valveStatus).map(([vid, vstatus]) => {
                        const style = getValveStatusStyle(vstatus);
                        const IconComp = style.icon;
                        return (
                          <div
                            key={vid}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border ${style.bg}`}
                          >
                            <span className="text-xs text-slate-300">
                              {valveNameMap[vid] || vid}
                            </span>
                            <span className={`text-xs flex items-center gap-1 ${style.text}`}>
                              <IconComp className="w-3 h-3" />
                              {style.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
