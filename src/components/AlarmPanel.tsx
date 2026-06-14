import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X, ChevronDown, ChevronRight, Zap, Shield, Phone, FlaskConical, RotateCcw } from 'lucide-react';
import { useAlarmStore } from '../store/useAlarmStore';
import { formatTime } from '../utils/formatters';
import type { EmergencyAction } from '../types';

const getActionConfig = (type: EmergencyAction['type']) => {
  switch (type) {
    case 'alarm_generated': return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: '告警生成' };
    case 'valve_closed': return { icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-500/10', label: '阀门关闭' };
    case 'notified_center': return { icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10', label: '通知监测中心' };
    case 'emergency_dosing': return { icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10', label: '应急投加' };
    case 'system_recovered': return { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', label: '系统恢复' };
  }
};

export function AlarmPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { alarms, acknowledgeAlarm, acknowledgeAll, getUnacknowledgedCount } = useAlarmStore();
  
  const unacknowledgedCount = getUnacknowledgedCount();

  const getAlarmIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlarmColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'border-orange-500/50 bg-orange-500/10';
      default:
        return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'danger':
        return '严重';
      case 'warning':
        return '警告';
      default:
        return '通知';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-4 top-24 bottom-4 w-[420px] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col overflow-hidden"
            >
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
                                <button
                                  onClick={() => toggleExpand(alarm.id)}
                                  className="w-7 h-7 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
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
                                <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 mb-3">
                                  <Zap className="w-3 h-3" />
                                  应急处置流程时间线
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
                                        <div className={`rounded-lg border ${config.bg} ${config.color.replace('text-', 'border-')}/30 p-3`}>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
