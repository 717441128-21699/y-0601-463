import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X, ChevronDown, ChevronRight, 
  Zap, Shield, Phone, FlaskConical, RotateCcw, Play, Pause, SkipBack, SkipForward, 
  ArrowLeft, Circle, CircleCheck, Clock
} from 'lucide-react';
import { useAlarmStore } from '../store/useAlarmStore';
import { formatTime } from '../utils/formatters';
import type { EmergencyAction, Alarm } from '../types';
import { useWaterPlantStore } from '../store/useWaterPlantStore';

const ACTION_STEP_ORDER: EmergencyAction['type'][] = [
  'alarm_generated',
  'notified_center',
  'valve_closed',
  'emergency_dosing',
  'system_recovered',
];

const getActionConfig = (type: EmergencyAction['type']) => {
  switch (type) {
    case 'alarm_generated': return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', label: '告警生成', step: 1 };
    case 'notified_center': return { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40', label: '通知监测中心', step: 2 };
    case 'valve_closed': return { icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40', label: '阀门关闭', step: 3 };
    case 'emergency_dosing': return { icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/40', label: '应急投加', step: 4 };
    case 'system_recovered': return { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/40', label: '系统恢复', step: 5 };
  }
};

export function AlarmPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailAlarmId, setDetailAlarmId] = useState<string | null>(null);
  const [playbackStep, setPlaybackStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pools, dosingSystems, pumpHouseData } = useWaterPlantStore();

  const { alarms, acknowledgeAlarm, acknowledgeAll, getUnacknowledgedCount } = useAlarmStore();
  
  const unacknowledgedCount = getUnacknowledgedCount();

  const detailAlarm = detailAlarmId ? alarms.find(a => a.id === detailAlarmId) : null;
  const detailActions = detailAlarm?.emergencyActions || [];
  const maxStep = Math.max(1, ACTION_STEP_ORDER.length);

  const getActionByStep = (stepIdx: number): EmergencyAction | undefined => {
    const actionType = ACTION_STEP_ORDER[stepIdx];
    return detailActions.find(a => a.type === actionType);
  };

  const getReachedSteps = () => {
    const reached: boolean[] = ACTION_STEP_ORDER.map(() => false);
    for (let i = 0; i < ACTION_STEP_ORDER.length; i++) {
      if (getActionByStep(i)) reached[i] = true;
      else break;
    }
    return reached;
  };

  useEffect(() => {
    if (isPlaying && detailAlarm) {
      const reached = getReachedSteps();
      const totalReached = reached.filter(Boolean).length;
      if (playbackStep < totalReached - 1) {
        playTimerRef.current = setTimeout(() => {
          setPlaybackStep(s => Math.min(s + 1, totalReached - 1));
        }, 1800);
      } else {
        setIsPlaying(false);
      }
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, playbackStep, detailAlarm]);

  useEffect(() => {
    if (detailAlarm) {
      const reached = getReachedSteps();
      const firstUnreached = reached.findIndex(r => !r);
      setPlaybackStep(firstUnreached === -1 ? reached.length - 1 : Math.max(0, firstUnreached - 1));
      setIsPlaying(false);
    }
  }, [detailAlarmId]);

  const getAlarmIcon = (level: string) => {
    switch (level) {
      case 'danger': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlarmColor = (level: string) => {
    switch (level) {
      case 'danger': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-orange-500/50 bg-orange-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'danger': return '严重';
      case 'warning': return '警告';
      default: return '通知';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openDetail = (id: string) => {
    setDetailAlarmId(id);
  };

  const closeDetail = () => {
    setDetailAlarmId(null);
    setIsPlaying(false);
  };

  const renderAlarmList = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {alarms.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-400">暂无报警信息</p>
        </div>
      ) : (
        alarms.map((alarm) => {
          const hasActions = alarm.emergencyActions && alarm.emergencyActions.length > 0;
          const isExpanded = expandedId === alarm.id;
          return (
            <motion.div
              key={alarm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border ${getAlarmColor(alarm.level)} ${!alarm.acknowledged ? '' : 'opacity-80'}`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlarmIcon(alarm.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          alarm.level === 'danger' ? 'bg-red-500/20 text-red-400' :
                          alarm.level === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {getLevelText(alarm.level)}
                        </span>
                        <span className="text-xs text-slate-500">{alarm.type}</span>
                        {hasActions && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                            {alarm.emergencyActions!.length} 条处置记录
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white leading-relaxed">{alarm.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{formatTime(alarm.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!alarm.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlarm(alarm.id)}
                        className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors whitespace-nowrap"
                      >
                        确认
                      </button>
                    )}
                    {alarm.acknowledged && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    {hasActions && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openDetail(alarm.id)}
                          className="w-7 h-7 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-purple-400 hover:text-white transition-colors"
                          title="查看处置详情"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleExpand(alarm.id)}
                          className="w-7 h-7 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {isExpanded && hasActions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
                          <Zap className="w-3 h-3" />
                          应急处置流程时间线
                        </div>
                        <button
                          onClick={() => openDetail(alarm.id)}
                          className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                        >
                          查看完整详情 →
                        </button>
                      </div>
                      <div className="relative pl-5">
                        <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-slate-700" />
                        {alarm.emergencyActions!.map((action, idx) => {
                          const config = getActionConfig(action.type);
                          const IconComp = config.icon;
                          const isLast = idx === alarm.emergencyActions!.length - 1;
                          return (
                            <div key={action.id} className={`relative mb-3 ${isLast ? 'mb-0' : ''}`}>
                              <div className={`absolute -left-[22px] top-0 w-5 h-5 rounded-full ${config.bg} border border-current ${config.color} flex items-center justify-center`}>
                                <IconComp className="w-3 h-3" />
                              </div>
                              <div className={`rounded-lg border ${config.bg} ${config.border} p-3`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                  <span className="text-[10px] text-slate-500">{formatTime(action.timestamp)}</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">{action.detail}</p>
                                {action.operator && (
                                  <p className="text-[10px] text-slate-500 mt-1.5">操作人：{action.operator}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}
    </div>
  );

  const renderDetail = () => {
    if (!detailAlarm) return null;
    const reached = getReachedSteps();
    const pool = pools.find(p => p.id === detailAlarm.sourcePoolId);
    const valveId = detailAlarm.sourcePoolId ? useWaterPlantStore.getState().poolValveMap[detailAlarm.sourcePoolId] : null;
    const valveStatus = valveId ? pumpHouseData.valveStatus[valveId] : null;
    const sourcePool = detailAlarm.sourcePoolId ? pools.find(p => p.id === detailAlarm.sourcePoolId) : null;

    const isStepReached = (idx: number) => idx <= playbackStep && reached[idx];
    const currentStepIdx = playbackStep;
    const currentAction = getActionByStep(currentStepIdx);

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/80">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <button
            onClick={closeDetail}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                detailAlarm.level === 'danger' ? 'bg-red-500/20 text-red-400' :
                detailAlarm.level === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {getLevelText(detailAlarm.level)}
              </span>
              <h3 className="text-sm font-bold text-white truncate">应急处置详情</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{detailAlarm.message}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                处置进度（点击步骤可跳转，支持回放）
              </div>
              <div className="flex items-center justify-between gap-1 mb-3">
                {ACTION_STEP_ORDER.map((type, idx) => {
                  const config = getActionConfig(type);
                  const IconComp = config.icon;
                  const reached = isStepReached(idx);
                  const isCurrent = idx === currentStepIdx && reached;
                  return (
                    <div key={type} className="flex items-center flex-1">
                      <button
                        onClick={() => reached && setPlaybackStep(idx)}
                        className={`relative flex flex-col items-center gap-1 flex-1 ${reached ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                        disabled={!reached}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent ? `${config.bg} ${config.border} ${config.color} scale-110 ring-2 ring-current/30` :
                          reached ? `${config.bg} ${config.border} ${config.color}` :
                          'bg-slate-800 border-slate-600 text-slate-500'
                        }`}>
                          {reached ? <IconComp className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                        </div>
                        <span className={`text-[10px] text-center ${isCurrent ? config.color : reached ? 'text-slate-300' : 'text-slate-600'}`}>
                          {config.label}
                        </span>
                      </button>
                      {idx < ACTION_STEP_ORDER.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-0.5 rounded transition-all ${
                          idx < playbackStep && reached ? 'bg-green-500/60' : 'bg-slate-700'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => { setIsPlaying(false); setPlaybackStep(0); }}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="回到开头"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPlaybackStep(s => Math.max(0, s - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  disabled={playbackStep <= 0}
                  title="上一步"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isPlaying ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' :
                    'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
                  }`}
                  title={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setPlaybackStep(s => {
                    const totalReached = reached.filter(Boolean).length;
                    return Math.min(totalReached - 1, s + 1);
                  })}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  disabled={playbackStep >= reached.filter(Boolean).length - 1}
                  title="下一步"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const totalReached = reached.filter(Boolean).length;
                    setIsPlaying(false);
                    setPlaybackStep(totalReached - 1);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  title="跳到最新"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              {currentAction ? (
                <div className={`p-4 border-l-4 ${getActionConfig(currentAction.type).border.replace('/40', '/80')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold ${getActionConfig(currentAction.type).color}`}>
                      第 {getActionConfig(currentAction.type).step} 步 · {getActionConfig(currentAction.type).label}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatTime(currentAction.timestamp)}</span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">{currentAction.detail}</p>
                  {currentAction.operator && (
                    <p className="text-xs text-slate-400 mt-2">操作人：{currentAction.operator}</p>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  该步骤尚未触发
                </div>
              )}
            </div>

            {pool && (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-2">{pool.poolNo} {pool.name} 当前状态</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">浊度</p>
                    <p className={`font-mono ${pool.turbidity > 5 ? 'text-red-400' : 'text-white'}`}>
                      {pool.turbidity.toFixed(2)} NTU
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">pH值</p>
                    <p className={`font-mono ${pool.pH < 6.5 || pool.pH > 8.5 ? 'text-red-400' : 'text-white'}`}>
                      {pool.pH.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">余氯</p>
                    <p className={`font-mono ${pool.residualChlorine < 0.3 || pool.residualChlorine > 4.0 ? 'text-red-400' : 'text-white'}`}>
                      {pool.residualChlorine.toFixed(2)} mg/L
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">流量</p>
                    <p className="text-white font-mono">{pool.currentFlow.toFixed(0)} m³/h</p>
                  </div>
                  {valveId && valveStatus && (
                    <div className="col-span-2">
                      <p className="text-slate-500">出水阀状态</p>
                      <p className={`font-mono text-sm mt-0.5 ${
                        valveStatus === 'open' ? 'text-green-400' :
                        valveStatus === 'closed' ? 'text-red-400' :
                        valveStatus === 'opening' ? 'text-yellow-400' :
                        'text-orange-400'
                      }`}>
                        {valveStatus === 'open' ? '开启' :
                         valveStatus === 'closed' ? '关闭' :
                         valveStatus === 'opening' ? '开启中...' :
                         '关闭中...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {sourcePool && isStepReached(3) && dosingSystems.length > 0 && (
              <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">应急投加状态</span>
                </div>
                <div className="space-y-2">
                  {dosingSystems.map(dosing => (
                    <div key={dosing.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{dosing.name}</span>
                      <span className={`font-mono ${dosing.status === 'over' ? 'text-red-400' : dosing.status === 'normal' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {dosing.actualDosage.toFixed(1)} kg/h
                        {dosing.emergencyPlan && <span className="ml-1 text-[10px] text-red-300">[应急模式]</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-2">完整处置记录</div>
              <div className="relative pl-5">
                <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-slate-700" />
                {detailActions.map((action, idx) => {
                  const config = getActionConfig(action.type);
                  const IconComp = config.icon;
                  const highlighted = idx === currentStepIdx;
                  const isLast = idx === detailActions.length - 1;
                  return (
                    <div key={action.id} className={`relative mb-3 ${isLast ? 'mb-0' : ''}`}>
                      <div
                        onClick={() => setPlaybackStep(ACTION_STEP_ORDER.indexOf(action.type))}
                        className={`absolute -left-[22px] top-0 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                          highlighted ? `${config.bg} ${config.border} border-2 scale-110 ${config.color}` :
                          `${config.bg} border border-current ${config.color}`
                        }`}
                      >
                        <IconComp className="w-3 h-3" />
                      </div>
                      <div className={`rounded-lg border p-3 transition-all ${
                        highlighted ? `${config.bg} ${config.border}` : `${config.bg} border-transparent opacity-70`
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                          <span className="text-[10px] text-slate-500">{formatTime(action.timestamp)}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{action.detail}</p>
                        {action.operator && (
                          <p className="text-[10px] text-slate-500 mt-1.5">操作人：{action.operator}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-24 z-30 w-14 h-14 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:bg-slate-800/90 transition-colors group"
      >
        <Bell className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        {unacknowledgedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unacknowledgedCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => { setIsOpen(false); closeDetail(); }}
            />
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-4 top-24 bottom-4 w-[440px] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col overflow-hidden"
            >
              {!detailAlarm ? (
                <>
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-cyan-400" />
                        实时报警与处置
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">共 {alarms.length} 条报警，{unacknowledgedCount} 条未处理</p>
                    </div>
                    <div className="flex gap-2">
                      {unacknowledgedCount > 0 && (
                        <button
                          onClick={acknowledgeAll}
                          className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          全部确认
                        </button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {renderAlarmList()}
                </>
              ) : (
                renderDetail()
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
